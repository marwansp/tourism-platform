-- Initialize Booking Database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bookings table with all required columns (matching the SQLAlchemy model)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    tour_id UUID NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    number_of_participants INTEGER NOT NULL DEFAULT 1,
    price_per_person DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    travel_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_viewed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_customer_name ON bookings(customer_name);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_id ON bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_travel_date ON bookings(travel_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_admin_viewed ON bookings(admin_viewed);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for bookings table
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample booking data with all required fields
INSERT INTO bookings (
    customer_name, email, phone, tour_id, 
    start_date, end_date, number_of_participants, 
    price_per_person, total_price, travel_date, status
) VALUES
('John Smith', 'john.smith@example.com', '+1-555-0123', 
 'fa9aa31a-f979-4d21-ad3e-0436281cd5d2'::uuid,
 '2024-12-15 09:00:00+00', '2024-12-15 18:00:00+00', 2, 
 45.00, 90.00, '2024-12-15 09:00:00+00', 'confirmed'),
('Maria Garcia', 'maria.garcia@example.com', '+34-600-123456', 
 '563177db-9a0c-4e5d-b180-58edd0a5d277'::uuid,
 '2024-11-20 08:00:00+00', '2024-11-22 18:00:00+00', 1, 
 180.00, 180.00, '2024-11-20 08:00:00+00', 'pending'),
('Ahmed Hassan', 'ahmed.hassan@example.com', '+212-600-789012', 
 '6f5b7f7d-cf58-4395-a349-3247cbb4e0dc'::uuid,
 '2024-10-25 10:00:00+00', '2024-10-25 17:00:00+00', 3, 
 65.00, 195.00, '2024-10-25 10:00:00+00', 'confirmed')
ON CONFLICT DO NOTHING;