-- Add tour reviews table for guest reviews
CREATE TABLE IF NOT EXISTS tour_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL UNIQUE, -- One review per booking
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_token VARCHAR(64) NOT NULL UNIQUE, -- Unique token for review access
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE, -- Admin can moderate reviews
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tour_reviews_tour_id ON tour_reviews(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_booking_id ON tour_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_token ON tour_reviews(review_token);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_email ON tour_reviews(customer_email);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_verified ON tour_reviews(is_verified);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_approved ON tour_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_created_at ON tour_reviews(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tour_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tour_reviews_updated_at
    BEFORE UPDATE ON tour_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_tour_reviews_updated_at();