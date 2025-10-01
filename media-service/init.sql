-- Initialize Media Database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create media_items table
CREATE TABLE IF NOT EXISTS media_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    caption VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    filename VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_items_created_at ON media_items(created_at);
CREATE INDEX IF NOT EXISTS idx_media_items_mime_type ON media_items(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_items_filename ON media_items(filename);

-- Insert sample media data with beautiful Moroccan images
INSERT INTO media_items (url, caption, file_size, mime_type, filename) VALUES
('https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 'Beautiful view of Marrakech city with traditional architecture and bustling souks', 245760, 'image/jpeg', 'marrakech-city.jpg'),
('https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 'Stunning sunset over the Sahara Desert dunes with camel silhouettes', 312480, 'image/jpeg', 'sahara-sunset.jpg'),
('https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 'Coastal view of Essaouira with blue waters and historic Portuguese walls', 198720, 'image/jpeg', 'essaouira-coast.jpg'),
('https://images.unsplash.com/photo-1544967882-6abec37be2b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 'Panoramic view of the Atlas Mountains with snow-capped peaks and valleys', 387200, 'image/jpeg', 'atlas-mountains.jpg'),
('https://images.unsplash.com/photo-1570939274717-7eda259b50ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 'The famous blue streets of Chefchaouen with traditional Moroccan doors', 156800, 'image/jpeg', 'chefchaouen-blue.jpg'),
('https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 'Traditional Berber village nestled in the Atlas Mountains', 234560, 'image/jpeg', 'berber-village.jpg'),
('https://images.unsplash.com/photo-1544967919-6e4b999de2a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 'Ancient medina of Fes with traditional Islamic architecture', 298240, 'image/jpeg', 'fes-medina.jpg'),
('https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 'Moroccan mint tea ceremony with traditional glasses and teapot', 187520, 'image/jpeg', 'mint-tea.jpg'),
('https://images.unsplash.com/photo-1544967882-6abec37be2b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 'Traditional Moroccan architecture with intricate geometric patterns', 298765, 'image/jpeg', 'moroccan-architecture.jpg'),
('https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 'Colorful spices in traditional Moroccan market', 234890, 'image/jpeg', 'spice-market.jpg'),
('https://images.unsplash.com/photo-1570939274717-7eda259b50ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 'Traditional Moroccan lanterns and crafts', 198456, 'image/jpeg', 'moroccan-crafts.jpg'),
('https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 'Camel caravan crossing the Sahara Desert at golden hour', 345678, 'image/jpeg', 'camel-caravan.jpg')
ON CONFLICT DO NOTHING;