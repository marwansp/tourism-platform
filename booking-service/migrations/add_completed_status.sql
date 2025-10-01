-- Add 'completed' status to the booking status check constraint
-- First, drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add the new constraint that includes 'completed'
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));