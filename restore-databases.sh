#!/bin/bash

# Database Restore Script
# Usage: bash restore-databases.sh /path/to/backup/directory

if [ -z "$1" ]; then
    echo "❌ Error: Please provide backup directory path"
    echo "Usage: bash restore-databases.sh /path/to/backup/directory"
    echo ""
    echo "Available backups:"
    ls -la /var/www/tourism-platform/backups/
    exit 1
fi

BACKUP_DIR=$1

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: Backup directory not found: $BACKUP_DIR"
    exit 1
fi

echo "🔄 Starting Database Restore..."
echo "Backup directory: $BACKUP_DIR"
echo ""
echo "⚠️  WARNING: This will replace current data with backup data!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Restore tours database
if [ -f "$BACKUP_DIR/tours_db.sql" ]; then
    echo "Restoring tours database..."
    docker-compose exec -T tours-db psql -U tours_user -d tours_db < $BACKUP_DIR/tours_db.sql
    echo "✅ Tours database restored"
else
    echo "⚠️  Tours database backup not found"
fi

# Restore booking database
if [ -f "$BACKUP_DIR/booking_db.sql" ]; then
    echo "Restoring booking database..."
    docker-compose exec -T booking-db psql -U booking_user -d booking_db < $BACKUP_DIR/booking_db.sql
    echo "✅ Booking database restored"
else
    echo "⚠️  Booking database backup not found"
fi

# Restore messaging database
if [ -f "$BACKUP_DIR/messaging_db.sql" ]; then
    echo "Restoring messaging database..."
    docker-compose exec -T messaging-db psql -U messaging_user -d messaging_db < $BACKUP_DIR/messaging_db.sql
    echo "✅ Messaging database restored"
else
    echo "⚠️  Messaging database backup not found"
fi

# Restore media database
if [ -f "$BACKUP_DIR/media_db.sql" ]; then
    echo "Restoring media database..."
    docker-compose exec -T media-db psql -U media_user -d media_db < $BACKUP_DIR/media_db.sql
    echo "✅ Media database restored"
else
    echo "⚠️  Media database backup not found"
fi

echo ""
echo "🎉 Restore Complete!"
echo "Your data has been restored from: $BACKUP_DIR"
