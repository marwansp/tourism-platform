-- Migration: Add date range and pricing fields to bookings table
-- Date: 2025-09-27

-- Add new columns to bookings table
ALTER TABLE bookings 
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN number_of_participants INTEGER DEFAULT 1,
ADD COLUMN price_per_person DECIMAL(10,2),
ADD COLUMN total_price DECIMAL(10,2);

-- Create indexes for new columns
CREATE INDEX idx_bookings_start_date ON bookings(start_date);
CREATE INDEX idx_bookings_end_date ON bookings(end_date);
CREATE INDEX idx_bookings_participants ON bookings(number_of_participants);

-- Migrate existing data (copy travel_date to start_date and end_date)
UPDATE bookings 
SET 
    start_date = travel_date,
    end_date = travel_date + INTERVAL '1 day',
    number_of_participants = 1,
    price_per_person = 100.00,  -- Default price, should be updated with actual tour prices
    total_price = 100.00
WHERE start_date IS NULL;

-- Make new columns NOT NULL after data migration
ALTER TABLE bookings 
ALTER COLUMN start_date SET NOT NULL,
ALTER COLUMN end_date SET NOT NULL,
ALTER COLUMN number_of_participants SET NOT NULL,
ALTER COLUMN price_per_person SET NOT NULL,
ALTER COLUMN total_price SET NOT NULL;

-- Add check constraints
ALTER TABLE bookings 
ADD CONSTRAINT chk_bookings_date_range CHECK (end_date >= start_date),
ADD CONSTRAINT chk_bookings_participants CHECK (number_of_participants > 0 AND number_of_participants <= 50),
ADD CONSTRAINT chk_bookings_price_positive CHECK (price_per_person > 0 AND total_price > 0);