-- Initialize Messaging Database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'whatsapp')),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);

-- Insert sample notification data
INSERT INTO notifications (type, recipient, subject, message, status, sent_at) VALUES
('email', 'john.smith@example.com', 'Booking Confirmation', 'Your booking for Marrakech City Tour has been confirmed.', 'sent', '2024-09-15 10:30:00+00'),
('email', 'admin@tourismplatform.com', 'New Booking Alert', 'New booking received for Sahara Desert Adventure.', 'sent', '2024-09-15 11:15:00+00'),
('email', 'maria.garcia@example.com', 'Booking Confirmation', 'Your booking for Essaouira Coastal Escape is pending confirmation.', 'sent', '2024-09-15 14:20:00+00')
ON CONFLICT DO NOTHING;