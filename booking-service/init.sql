-- Initialize Booking Database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    tour_id UUID NOT NULL,
    travel_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
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

-- Insert sample booking data (using tour IDs from tours service)
-- Note: These tour IDs should match the ones from tours service init.sql
INSERT INTO bookings (customer_name, email, phone, tour_id, travel_date, status) VALUES
('John Smith', 'john.smith@example.com', '+1-555-0123', (SELECT id FROM (VALUES ('731e6fc9-f4e3-4589-8c54-0045d9fced1f'::uuid)) AS t(id) LIMIT 1), '2024-12-15 09:00:00+00', 'confirmed'),
('Maria Garcia', 'maria.garcia@example.com', '+34-600-123456', (SELECT id FROM (VALUES ('8b2c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::uuid)) AS t(id) LIMIT 1), '2024-11-20 08:00:00+00', 'pending'),
('Ahmed Hassan', 'ahmed.hassan@example.com', '+212-600-789012', (SELECT id FROM (VALUES ('9c3d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid)) AS t(id) LIMIT 1), '2024-10-25 10:00:00+00', 'confirmed')
ON CONFLICT DO NOTHING;