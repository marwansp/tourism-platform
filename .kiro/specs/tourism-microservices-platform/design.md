# Design Document

## Overview

The Tourism Microservices Platform is designed as a distributed system consisting of six independent microservices that collectively provide a complete tourism booking solution. The architecture follows microservices principles with clear service boundaries, RESTful communication, and containerized deployment. The system is designed to be auth-free initially with extensibility hooks for future authentication integration.

## Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end
    
    subgraph "Frontend Layer"
        Frontend[Frontend Service<br/>React + TailwindCSS<br/>Port: 3000]
    end
    
    subgraph "API Gateway Layer"
        Nginx[Nginx Reverse Proxy]
    end
    
    subgraph "Microservices Layer"
        Tours[Tours & Packages Service<br/>FastAPI + PostgreSQL<br/>Port: 8010]
        Booking[Booking & Reservation Service<br/>FastAPI + PostgreSQL<br/>Port: 8020]
        Messaging[Messaging & Notification Service<br/>FastAPI + SMTP<br/>Port: 8030]
        Media[Media & Gallery Service<br/>FastAPI + MinIO<br/>Port: 8040]
        AI[AI Travel Assistant Service<br/>FastAPI + Ollama<br/>Port: 8050]
    end
    
    subgraph "Data Layer"
        ToursDB[(Tours Database<br/>PostgreSQL)]
        BookingDB[(Booking Database<br/>PostgreSQL)]
        MediaStorage[(Media Storage<br/>MinIO/S3)]
        NotificationLog[(Notification Log<br/>PostgreSQL)]
    end
    
    subgraph "External Services"
        SMTP[SMTP Service<br/>Gmail/SendGrid]
        WhatsApp[WhatsApp API<br/>Twilio]
        Ollama[Ollama<br/>Local LLM]
    end
    
    Browser --> Frontend
    Frontend --> Nginx
    Nginx --> Tours
    Nginx --> Booking
    Nginx --> Messaging
    Nginx --> Media
    Nginx --> AI
    
    Tours --> ToursDB
    Booking --> BookingDB
    Booking --> Messaging
    Media --> MediaStorage
    Messaging --> NotificationLog
    Messaging --> SMTP
    Messaging --> WhatsApp
    AI --> Ollama
```

### Service Communication Patterns

1. **Frontend to Backend**: HTTP/REST API calls through Nginx reverse proxy
2. **Inter-service Communication**: Direct HTTP/REST API calls between services
3. **Database Access**: Each service owns its database with no shared databases
4. **External Integrations**: Services integrate with external APIs (SMTP, Twilio, Ollama)

## Components and Interfaces

### 1. Frontend Service

**Technology Stack**: React 18, TailwindCSS, Nginx, Docker

**Key Components**:
- React Router for client-side routing
- Axios for API communication
- TailwindCSS for responsive styling
- i18next for internationalization (EN/FR)

**API Integration Points**:
```typescript
interface APIClient {
  tours: {
    getAll(): Promise<Tour[]>
    getById(id: string): Promise<Tour>
  }
  bookings: {
    create(booking: BookingRequest): Promise<BookingResponse>
  }
  media: {
    getGallery(): Promise<MediaItem[]>
  }
  messaging: {
    sendContact(message: ContactMessage): Promise<void>
  }
  ai?: {
    ask(question: string): Promise<AIResponse>
  }
}
```

### 2. Tours & Packages Service

**Technology Stack**: FastAPI, PostgreSQL, SQLAlchemy, Pydantic

**Core Components**:
- FastAPI application with automatic OpenAPI documentation
- SQLAlchemy ORM for database operations
- Pydantic models for request/response validation
- PostgreSQL database with connection pooling

**API Endpoints**:
```python
@app.get("/tours", response_model=List[TourResponse])
@app.get("/tours/{tour_id}", response_model=TourDetailResponse)
@app.post("/tours", response_model=TourResponse)
@app.put("/tours/{tour_id}", response_model=TourResponse)
@app.delete("/tours/{tour_id}")
```

### 3. Booking & Reservation Service

**Technology Stack**: FastAPI, PostgreSQL, SQLAlchemy, httpx

**Core Components**:
- Booking management with status tracking
- Customer data validation and storage
- Integration client for Messaging service
- Admin dashboard endpoints

**Booking Workflow**:
```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend
    participant B as Booking Service
    participant M as Messaging Service
    participant DB as Database
    
    C->>F: Submit booking form
    F->>B: POST /bookings
    B->>DB: Store booking data
    B->>M: POST /notify/email
    M-->>B: Notification sent
    B->>F: Booking confirmation
    F->>C: Display confirmation
```

### 4. Messaging & Notification Service

**Technology Stack**: FastAPI, SMTP (Gmail/SendGrid), Twilio, PostgreSQL

**Core Components**:
- Email service with template engine
- WhatsApp integration (optional)
- Notification logging and tracking
- Template management system

**Notification Templates**:
```python
class EmailTemplate:
    BOOKING_CONFIRMATION = "booking_confirmation.html"
    ADMIN_NOTIFICATION = "admin_notification.html"
    CONTACT_FORM = "contact_form.html"
```

### 5. Media & Gallery Service

**Technology Stack**: FastAPI, MinIO, PostgreSQL

**Core Components**:
- File upload handling with validation
- MinIO/S3 integration for storage
- Image metadata management
- URL generation for frontend access

**Storage Strategy**:
- Images stored in MinIO with organized bucket structure
- Metadata stored in PostgreSQL for searchability
- CDN-ready URL generation for performance

### 6. AI Travel Assistant Service (Optional)

**Technology Stack**: FastAPI, Ollama, Llama 3

**Core Components**:
- Natural language processing for travel queries
- Tour recommendation engine
- Context-aware response generation
- Integration with Tours service for data

## Data Models

### Tours Service Schema

```sql
CREATE TABLE tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Booking Service Schema

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    tour_id UUID NOT NULL,
    travel_date TIMESTAMP NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Media Service Schema

```sql
CREATE TABLE media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    caption TEXT,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Messaging Service Schema

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
    recipient TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Error Handling

### Global Error Handling Strategy

1. **HTTP Status Codes**: Consistent use of appropriate HTTP status codes
2. **Error Response Format**: Standardized error response structure across all services
3. **Logging**: Comprehensive logging for debugging and monitoring
4. **Graceful Degradation**: Services continue operating when optional dependencies fail

```python
class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime
    request_id: str
```

### Service-Specific Error Handling

- **Tours Service**: Handle database connection failures, invalid tour data
- **Booking Service**: Validate customer data, handle tour availability
- **Messaging Service**: Handle SMTP failures, retry mechanisms
- **Media Service**: Handle file upload errors, storage failures
- **AI Service**: Handle model unavailability, timeout scenarios

## Testing Strategy

### Unit Testing
- **Framework**: pytest for Python services, Jest for React frontend
- **Coverage**: Minimum 80% code coverage for all services
- **Mocking**: Mock external dependencies (databases, APIs)

### Integration Testing
- **API Testing**: Test all REST endpoints with various scenarios
- **Database Testing**: Test database operations with test containers
- **Service Communication**: Test inter-service communication patterns

### End-to-End Testing
- **User Journeys**: Test complete booking workflow from frontend to backend
- **Cross-Service Testing**: Verify data flow between services
- **Performance Testing**: Load testing for expected traffic patterns

### Testing Infrastructure
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  test-db:
    image: postgres:15
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
  
  test-minio:
    image: minio/minio
    command: server /data
    environment:
      MINIO_ROOT_USER: test_user
      MINIO_ROOT_PASSWORD: test_password
```

## Deployment Architecture

### Container Strategy
- Each microservice runs in its own Docker container
- Multi-stage builds for optimized production images
- Health checks for container orchestration
- Environment-specific configuration via environment variables

### Docker Compose Configuration
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - tours-service
      - booking-service
  
  tours-service:
    build: ./tours-service
    ports:
      - "8010:8010"
    environment:
      - DATABASE_URL=postgresql://user:pass@tours-db:5432/tours
    depends_on:
      - tours-db
```

### Scalability Considerations
- Horizontal scaling capability for each service
- Database connection pooling for performance
- Caching strategies for frequently accessed data
- Load balancing for high-availability deployment

## Security Considerations

### Current Security Measures
- Input validation using Pydantic models
- SQL injection prevention through ORM usage
- File upload validation and sanitization
- CORS configuration for frontend-backend communication

### Future Authentication Hooks
- JWT token validation middleware ready for integration
- Role-based access control structure prepared
- API key authentication for admin endpoints
- OAuth2 integration points identified

### Data Protection
- Environment variable management for sensitive data
- Database connection encryption
- HTTPS enforcement in production
- File upload size and type restrictions