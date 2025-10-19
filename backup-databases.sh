#!/bin/bash

# Manual Database Backup Script
# Run this anytime to backup your databases

echo "📦 Starting Database Backup..."

# Create backup directory with timestamp
BACKUP_DIR="/var/www/tourism-platform/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo "Backup directory: $BACKUP_DIR"

# Backup tours database
echo "Backing up tours database..."
docker-compose exec -T tours-db pg_dump -U tours_user tours_db > $BACKUP_DIR/tours_db.sql
echo "✅ Tours database backed up"

# Backup booking database
echo "Backing up booking database..."
docker-compose exec -T booking-db pg_dump -U booking_user booking_db > $BACKUP_DIR/booking_db.sql
echo "✅ Booking database backed up"

# Backup messaging database
echo "Backing up messaging database..."
docker-compose exec -T messaging-db pg_dump -U messaging_user messaging_db > $BACKUP_DIR/messaging_db.sql
echo "✅ Messaging database backed up"

# Backup media database
echo "Backing up media database..."
docker-compose exec -T media-db pg_dump -U media_user media_db > $BACKUP_DIR/media_db.sql
echo "✅ Media database backed up"

# Create compressed archive
echo "Creating compressed archive..."
cd /var/www/tourism-platform/backups
tar -czf $(basename $BACKUP_DIR).tar.gz $(basename $BACKUP_DIR)
echo "✅ Compressed archive created"

echo ""
echo "🎉 Backup Complete!"
echo "=================================="
echo "📦 Backup location: $BACKUP_DIR"
echo "📦 Archive: $BACKUP_DIR.tar.gz"
echo "=================================="
echo ""
echo "To restore from this backup, run:"
echo "bash restore-databases.sh $BACKUP_DIR"
