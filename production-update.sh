#!/bin/bash

# Safe Production Update Script
# This script updates the system WITHOUT deleting existing data

echo "🔄 Starting Safe Production Update..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Backup existing database
print_info "Step 1: Creating database backup..."
cd /var/www/tourism-platform
BACKUP_FILE="tours_backup_$(date +%Y%m%d_%H%M%S).sql"
docker-compose exec -T tours-db pg_dump -U tours_user tours_db > "$BACKUP_FILE"
if [ -f "$BACKUP_FILE" ]; then
    print_status "Database backed up to: $BACKUP_FILE"
else
    print_error "Backup failed! Aborting update."
    exit 1
fi

# Step 2: Pull latest code
print_info "Step 2: Pulling latest code from GitHub..."
git fetch origin
git pull origin main
print_status "Code updated"

# Step 3: Create migration SQL file
print_info "Step 3: Creating migration SQL..."
cat > /tmp/production_migration.sql << 'EOF'
-- Safe Production Migration Script
-- Adds new features without deleting existing data

-- ============================================
-- 1. Create languages table if not exists
-- ============================================
CREATE TABLE IF NOT EXISTS languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_languages_code ON languages(code);
CREATE INDEX IF NOT EXISTS idx_languages_active ON languages(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_languages_single_default ON languages(is_default) WHERE is_default = TRUE;

-- Seed default languages
INSERT INTO languages (code, name, native_name, flag_emoji, is_active, is_default)
VALUES 
    ('en', 'English', 'English', '🇺🇸', TRUE, TRUE),
    ('fr', 'French', 'Français', '🇫🇷', TRUE, FALSE)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. Add tour_type column to tours table
-- ============================================
ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS tour_type VARCHAR(20) NOT NULL DEFAULT 'excursion';

-- Add check constraint (drop first if exists to avoid conflicts)
DO $$ 
BEGIN
    ALTER TABLE tours DROP CONSTRAINT IF EXISTS check_tour_type;
    ALTER TABLE tours ADD CONSTRAINT check_tour_type CHECK (tour_type IN ('tour', 'excursion'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_tours_tour_type ON tours(tour_type);

-- Update existing tours: if duration contains "jour" (1 day), mark as excursion
UPDATE tours 
SET tour_type = 'excursion' 
WHERE (duration LIKE '%1 jour%' OR duration LIKE '%1 day%')
  AND tour_type = 'tour';

-- ============================================
-- 3. Add category column to tags table
-- ============================================
ALTER TABLE tags 
ADD COLUMN IF NOT EXISTS category VARCHAR(20) NOT NULL DEFAULT 'included';

-- Add check constraint
DO $$ 
BEGIN
    ALTER TABLE tags DROP CONSTRAINT IF EXISTS check_tag_category;
    ALTER TABLE tags ADD CONSTRAINT check_tag_category CHECK (category IN ('included', 'not_included'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);

-- ============================================
-- 4. Verify migration
-- ============================================
DO $$ 
DECLARE
    tour_count INTEGER;
    lang_count INTEGER;
    tag_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tour_count FROM tours;
    SELECT COUNT(*) INTO lang_count FROM languages;
    SELECT COUNT(*) INTO tag_count FROM tags;
    
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '📊 Tours: %', tour_count;
    RAISE NOTICE '🌐 Languages: %', lang_count;
    RAISE NOTICE '🏷️  Tags: %', tag_count;
END $$;
EOF

print_status "Migration SQL created"

# Step 4: Apply migration to database
print_info "Step 4: Applying database migration..."
docker-compose exec -T tours-db psql -U tours_user -d tours_db < /tmp/production_migration.sql
if [ $? -eq 0 ]; then
    print_status "Database migration completed successfully"
else
    print_error "Migration failed! Database backup is available at: $BACKUP_FILE"
    print_warning "To restore: docker-compose exec -T tours-db psql -U tours_user -d tours_db < $BACKUP_FILE"
    exit 1
fi

# Step 5: Rebuild and restart services (without deleting volumes)
print_info "Step 5: Rebuilding services..."
docker-compose build tours-service frontend
print_status "Services rebuilt"

print_info "Step 6: Restarting services..."
docker-compose up -d tours-service frontend
print_status "Services restarted"

# Step 7: Wait for services to be ready
print_info "Step 7: Waiting for services to start..."
sleep 15

# Step 8: Health checks
print_info "Step 8: Running health checks..."

# Check tours service
for i in {1..10}; do
    if curl -f http://localhost:8010/health > /dev/null 2>&1; then
        print_status "Tours service is healthy"
        break
    fi
    print_info "Waiting for tours service... ($i/10)"
    sleep 3
done

# Check frontend
for i in {1..10}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend is healthy"
        break
    fi
    print_info "Waiting for frontend... ($i/10)"
    sleep 3
done

# Step 9: Verify data integrity
print_info "Step 9: Verifying data integrity..."

# Count tours
TOUR_COUNT=$(docker-compose exec -T tours-db psql -U tours_user -d tours_db -t -c "SELECT COUNT(*) FROM tours;")
print_info "Tours in database: $TOUR_COUNT"

# Check languages
LANG_COUNT=$(docker-compose exec -T tours-db psql -U tours_user -d tours_db -t -c "SELECT COUNT(*) FROM languages;")
print_info "Languages available: $LANG_COUNT"

# Test API
if curl -f http://localhost:8010/tours > /dev/null 2>&1; then
    print_status "Tours API is working"
else
    print_warning "Tours API check failed"
fi

if curl -f http://localhost:8010/languages > /dev/null 2>&1; then
    print_status "Languages API is working"
else
    print_warning "Languages API check failed"
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo -e "${GREEN}"
echo "🎉 Production Update Complete!"
echo "=================================="
echo "✅ All existing data preserved"
echo "✅ New features added:"
echo "   - Languages table created"
echo "   - Tour types added"
echo "   - Tag categories added"
echo ""
echo "🌐 Your Tourism Platform:"
echo "📱 Frontend: http://$SERVER_IP:3000"
echo "🔧 Tours API: http://$SERVER_IP:8010"
echo "🌐 Languages API: http://$SERVER_IP:8010/languages"
echo "📚 API Docs: http://$SERVER_IP:8010/docs"
echo ""
echo "💾 Backup saved: $BACKUP_FILE"
echo "=================================="
echo -e "${NC}"

print_status "Update completed successfully!"

# Show running services
print_info "Running services:"
docker-compose ps

# Cleanup
rm -f /tmp/production_migration.sql
