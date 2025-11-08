#!/bin/bash

# Backup All Databases Script
# Creates SQL dumps of all databases in the tourism platform

echo "🔒 Starting Database Backup..."
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Create backup directory with timestamp
BACKUP_DIR="backups/db_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

cd /var/www/tourism-platform

echo "📦 Backup directory: $BACKUP_DIR"
echo ""

# Backup Tours Database
echo "1️⃣  Backing up Tours Database..."
docker exec tourism-platform_tours-db_1 pg_dump -U tours_user tours_db > $BACKUP_DIR/tours_db.sql
if [ $? -eq 0 ]; then
    TOURS_SIZE=$(du -h $BACKUP_DIR/tours_db.sql | cut -f1)
    echo "   ✅ Tours DB backed up ($TOURS_SIZE)"
else
    echo "   ❌ Tours DB backup failed!"
fi

# Backup Booking Database
echo "2️⃣  Backing up Booking Database..."
docker exec tourism-platform_booking-db_1 pg_dump -U booking_user booking_db > $BACKUP_DIR/booking_db.sql
if [ $? -eq 0 ]; then
    BOOKING_SIZE=$(du -h $BACKUP_DIR/booking_db.sql | cut -f1)
    echo "   ✅ Booking DB backed up ($BOOKING_SIZE)"
else
    echo "   ❌ Booking DB backup failed!"
fi

# Backup Messaging Database
echo "3️⃣  Backing up Messaging Database..."
docker exec tourism-platform_messaging-db_1 pg_dump -U messaging_user messaging_db > $BACKUP_DIR/messaging_db.sql
if [ $? -eq 0 ]; then
    MESSAGING_SIZE=$(du -h $BACKUP_DIR/messaging_db.sql | cut -f1)
    echo "   ✅ Messaging DB backed up ($MESSAGING_SIZE)"
else
    echo "   ❌ Messaging DB backup failed!"
fi

# Backup Media Database
echo "4️⃣  Backing up Media Database..."
docker exec tourism-platform_media-db_1 pg_dump -U media_user media_db > $BACKUP_DIR/media_db.sql
if [ $? -eq 0 ]; then
    MEDIA_SIZE=$(du -h $BACKUP_DIR/media_db.sql | cut -f1)
    echo "   ✅ Media DB backed up ($MEDIA_SIZE)"
else
    echo "   ❌ Media DB backup failed!"
fi

# Create a summary file
echo ""
echo "📝 Creating backup summary..."
cat > $BACKUP_DIR/backup_info.txt << EOF
Database Backup Summary
=======================
Date: $(date '+%Y-%m-%d %H:%M:%S')
Server: $(hostname)
Backup Location: $BACKUP_DIR

Files:
- tours_db.sql (Tours, Reviews, Tags, Pricing)
- booking_db.sql (Bookings, Reservations)
- messaging_db.sql (Messages, Notifications)
- media_db.sql (Gallery, Media Files)

To restore a database:
docker exec -i tourism-platform_tours-db_1 psql -U tours_user tours_db < tours_db.sql
docker exec -i tourism-platform_booking-db_1 psql -U booking_user booking_db < booking_db.sql
docker exec -i tourism-platform_messaging-db_1 psql -U messaging_user messaging_db < messaging_db.sql
docker exec -i tourism-platform_media-db_1 psql -U media_user media_db < media_db.sql
EOF

# Calculate total backup size
TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)

echo ""
echo "="*60
echo "✅ BACKUP COMPLETE!"
echo "="*60
echo "📁 Location: $BACKUP_DIR"
echo "💾 Total Size: $TOTAL_SIZE"
echo ""
echo "📋 Backup Contents:"
ls -lh $BACKUP_DIR/
echo ""
echo "💡 To download backups to your local machine:"
echo "   scp -r root@159.89.1.127:/var/www/tourism-platform/$BACKUP_DIR ."
echo ""
echo "🔄 To restore from this backup, see: $BACKUP_DIR/backup_info.txt"
