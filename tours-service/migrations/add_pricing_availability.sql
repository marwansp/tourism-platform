-- Migration: Add seasonal pricing and availability tables
-- Date: 2025-09-27

-- Add new columns to tours table
ALTER TABLE tours 
ADD COLUMN base_price DECIMAL(10,2),
ADD COLUMN duration_days INTEGER DEFAULT 1,
ADD COLUMN duration_description VARCHAR(50),
ADD COLUMN min_participants INTEGER DEFAULT 1,
ADD COLUMN group_discount_threshold INTEGER DEFAULT 5,
ADD COLUMN group_discount_percentage DECIMAL(5,2) DEFAULT 0.00;

-- Migrate existing data
UPDATE tours 
SET 
    base_price = price,
    duration_days = 1,
    duration_description = duration,
    min_participants = 1,
    group_discount_threshold = 5,
    group_discount_percentage = 0.00
WHERE base_price IS NULL;

-- Make new columns NOT NULL after data migration
ALTER TABLE tours 
ALTER COLUMN base_price SET NOT NULL,
ALTER COLUMN duration_days SET NOT NULL,
ALTER COLUMN duration_description SET NOT NULL,
ALTER COLUMN min_participants SET NOT NULL,
ALTER COLUMN group_discount_threshold SET NOT NULL,
ALTER COLUMN group_discount_percentage SET NOT NULL;

-- Create seasonal pricing table
CREATE TABLE tour_seasonal_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    season_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for seasonal pricing
CREATE INDEX idx_seasonal_prices_tour_id ON tour_seasonal_prices(tour_id);
CREATE INDEX idx_seasonal_prices_dates ON tour_seasonal_prices(start_date, end_date);
CREATE INDEX idx_seasonal_prices_active ON tour_seasonal_prices(is_active);

-- Create availability table
CREATE TABLE tour_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    available_spots INTEGER NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for availability
CREATE INDEX idx_availability_tour_id ON tour_availability(tour_id);
CREATE INDEX idx_availability_date ON tour_availability(date);
CREATE INDEX idx_availability_available ON tour_availability(is_available);
CREATE UNIQUE INDEX idx_availability_tour_date ON tour_availability(tour_id, date);

-- Add check constraints
ALTER TABLE tour_seasonal_prices 
ADD CONSTRAINT chk_seasonal_price_multiplier CHECK (price_multiplier > 0),
ADD CONSTRAINT chk_seasonal_date_range CHECK (end_date >= start_date);

ALTER TABLE tour_availability 
ADD CONSTRAINT chk_availability_spots CHECK (available_spots >= 0);

ALTER TABLE tours 
ADD CONSTRAINT chk_tours_participants CHECK (min_participants > 0 AND min_participants <= max_participants),
ADD CONSTRAINT chk_tours_discount CHECK (group_discount_percentage >= 0 AND group_discount_percentage <= 100);

-- Insert some default seasonal pricing for existing tours
INSERT INTO tour_seasonal_prices (tour_id, season_name, start_date, end_date, price_multiplier, is_active)
SELECT 
    id,
    'Regular Season',
    '2025-01-01',
    '2025-12-31',
    1.00,
    true
FROM tours;