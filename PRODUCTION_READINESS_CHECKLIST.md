# 🚀 Production Readiness Checklist

## Overview
This checklist ensures your Tourism Platform is ready for production deployment.

---

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] **Copy `.env.production.example` to `.env`**
  ```bash
  cp .env.production.example .env
  ```

- [ ] **Update FRONTEND_URL** in `.env`
  ```bash
  # Change from:
  FRONTEND_URL=http://localhost:3000
  
  # To your production domain:
  FRONTEND_URL=https://yourdomain.com
  # OR your server IP:
  FRONTEND_URL=http://159.89.1.127:3000
  ```

- [ ] **Change ALL database passwords**
  - TOURS_DB_PASS
  - BOOKING_DB_PASS
  - MESSAGING_DB_PASS
  - MEDIA_DB_PASS
  
  Use strong passwords (min 16 characters, mixed case, numbers, symbols)

- [ ] **Change MinIO credentials**
  - MINIO_ACCESS_KEY
  - MINIO_SECRET_KEY (min 32 characters)

- [ ] **Configure SendGrid API Key**
  - Get key from: https://app.sendgrid.com/settings/api_keys
  - Update SENDGRID_API_KEY in `.env`

- [ ] **Set correct email addresses**
  - FROM_EMAIL (verified sender in SendGrid)
  - ADMIN_EMAIL (where notifications go)

### 2. Docker Compose Configuration

- [ ] **Use production docker-compose file**
  ```bash
  # Use docker-compose.prod.yml for production
  docker-compose -f docker-compose.prod.yml up -d
  ```

- [ ] **Verify no localhost references**
  ```bash
  grep -r "localhost" docker-compose.prod.yml
  # Should only show in comments or defaults
  ```

- [ ] **Check restart policies**
  - All services should have `restart: unless-stopped`

- [ ] **Verify health checks configured**
  - All services should have healthcheck blocks

### 3. Database Setup

- [ ] **Backup existing data** (if migrating)
  ```bash
  ./backup-databases.sh
  ```

- [ ] **Apply all migrations**
  ```bash
  # Tours service migrations
  docker exec tour-tours-db-1 psql -U tours_user -d tours_db -f /docker-entrypoint-initdb.d/init.sql
  
  # Apply tour info sections migration
  docker cp tours-service/migrations/add_tour_info_sections.sql tour-tours-db-1:/tmp/
  docker exec tour-tours-db-1 psql -U tours_user -d tours_db -f /tmp/add_tour_info_sections.sql
  ```

- [ ] **Verify all tables exist**
  ```bash
  docker exec tour-tours-db-1 psql -U tours_user -d tours_db -c "\dt"
  ```

- [ ] **Create database backups directory**
  ```bash
  mkdir -p ./backups
  chmod 755 ./backups
  ```

### 4. Security

- [ ] **Change default database ports** (optional but recommended)
  - Consider using non-standard ports
  - Update firewall rules accordingly

- [ ] **Enable SSL/TLS**
  - [ ] Configure HTTPS for frontend
  - [ ] Use Let's Encrypt certificates
  - [ ] Update FRONTEND_URL to use https://

- [ ] **Firewall configuration**
  ```bash
  # Allow only necessary ports
  ufw allow 22/tcp    # SSH
  ufw allow 80/tcp    # HTTP
  ufw allow 443/tcp   # HTTPS
  ufw allow 3000/tcp  # Frontend (if not using reverse proxy)
  ufw enable
  ```

- [ ] **Secure database access**
  - [ ] Databases should NOT be exposed to public internet
  - [ ] Remove port mappings for databases in production
  - [ ] Use internal Docker network only

- [ ] **API rate limiting** (recommended)
  - Consider adding nginx reverse proxy with rate limiting

### 5. Frontend Configuration

- [ ] **Update API base URL** in `frontend/src/api/config.ts`
  ```typescript
  // Should use environment variable
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
  ```

- [ ] **Build frontend for production**
  ```bash
  docker-compose -f docker-compose.prod.yml build frontend
  ```

- [ ] **Verify frontend environment variables**
  - Check `frontend/.env.production` if exists

### 6. Backend Services

- [ ] **Remove --reload flag** from production commands
  - Already done in `docker-compose.prod.yml`

- [ ] **Set worker count** for uvicorn
  - Already configured with `--workers 4`

- [ ] **Verify CORS settings**
  - Check allowed origins in each service's main.py
  - Should match your production domain

### 7. Monitoring & Logging

- [ ] **Set up log rotation**
  ```bash
  # Add to docker-compose.prod.yml for each service:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
  ```

- [ ] **Configure monitoring** (optional)
  - [ ] Set up Sentry for error tracking
  - [ ] Configure Datadog/Prometheus for metrics
  - [ ] Set up uptime monitoring (UptimeRobot, Pingdom)

- [ ] **Set up backup automation**
  ```bash
  # Add to crontab
  0 2 * * * /path/to/backup-databases.sh
  ```

### 8. Performance Optimization

- [ ] **Enable CDN** for static assets
  - Cloudflare, AWS CloudFront, or DigitalOcean CDN

- [ ] **Configure caching**
  - [ ] Browser caching headers
  - [ ] API response caching (Redis recommended)

- [ ] **Database optimization**
  - [ ] Verify all indexes are created
  - [ ] Configure connection pooling
  - [ ] Set appropriate shared_buffers in PostgreSQL

- [ ] **Image optimization**
  - [ ] Use WebP format where possible
  - [ ] Implement lazy loading
  - [ ] Configure image CDN

### 9. Testing

- [ ] **Test all API endpoints**
  ```bash
  # Tours service
  curl https://yourdomain.com/api/tours/tours
  
  # Booking service
  curl https://yourdomain.com/api/bookings/health
  
  # Messaging service
  curl https://yourdomain.com/api/messaging/health
  ```

- [ ] **Test email functionality**
  ```bash
  python test_sendgrid.py
  ```

- [ ] **Test booking flow**
  - [ ] Create booking
  - [ ] Receive confirmation email
  - [ ] Admin receives notification

- [ ] **Test tour info sections**
  - [ ] Create section via admin panel
  - [ ] Verify display on tour details page
  - [ ] Test language switching

- [ ] **Load testing** (recommended)
  ```bash
  # Use Apache Bench or similar
  ab -n 1000 -c 10 https://yourdomain.com/
  ```

### 10. Documentation

- [ ] **Update README.md** with production URLs

- [ ] **Document deployment process**

- [ ] **Create runbook** for common issues

- [ ] **Document backup/restore procedures**

---

## 🚀 Deployment Commands

### Initial Deployment

```bash
# 1. Clone repository
git clone <your-repo-url>
cd tour

# 2. Configure environment
cp .env.production.example .env
nano .env  # Update all values

# 3. Build and start services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 4. Check logs
docker-compose -f docker-compose.prod.yml logs -f

# 5. Verify all services are healthy
docker-compose -f docker-compose.prod.yml ps
```

### Update Deployment

```bash
# 1. Pull latest changes
git pull origin main

# 2. Backup databases
./backup-databases.sh

# 3. Rebuild and restart services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 4. Apply any new migrations
# (See database migration section above)

# 5. Verify deployment
curl https://yourdomain.com/api/tours/health
```

---

## 🔍 Post-Deployment Verification

### Health Checks

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Check service health
curl https://yourdomain.com/api/tours/health
curl https://yourdomain.com/api/bookings/health
curl https://yourdomain.com/api/messaging/health
curl https://yourdomain.com/api/media/health

# Check frontend
curl https://yourdomain.com/
```

### Database Verification

```bash
# Check database connections
docker exec tour-tours-db-1 psql -U tours_user -d tours_db -c "SELECT COUNT(*) FROM tours;"
docker exec tour-booking-db-1 psql -U booking_user -d booking_db -c "SELECT COUNT(*) FROM bookings;"

# Verify new tables exist
docker exec tour-tours-db-1 psql -U tours_user -d tours_db -c "\dt tour_info_sections"
```

### Functional Testing

- [ ] Visit homepage: `https://yourdomain.com`
- [ ] Browse tours: `https://yourdomain.com/tours`
- [ ] View tour details
- [ ] Test booking form
- [ ] Test contact form
- [ ] Check admin panel: `https://yourdomain.com/admin`
- [ ] Create test info section
- [ ] Verify email delivery

---

## 🆘 Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs <service-name>

# Check environment variables
docker-compose -f docker-compose.prod.yml config

# Restart specific service
docker-compose -f docker-compose.prod.yml restart <service-name>
```

### Database connection errors

```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps tours-db

# Test connection
docker exec tour-tours-db-1 psql -U tours_user -d tours_db -c "SELECT 1;"

# Check DATABASE_URL format
echo $DATABASE_URL
```

### Frontend not loading

```bash
# Check nginx logs
docker logs tour-frontend-1

# Rebuild frontend
docker-compose -f docker-compose.prod.yml build frontend
docker-compose -f docker-compose.prod.yml up -d frontend

# Clear browser cache
# Hard refresh: Ctrl+Shift+R
```

---

## 📊 Monitoring Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Check resource usage
docker stats

# Check disk space
df -h

# Check database size
docker exec tour-tours-db-1 psql -U tours_user -d tours_db -c "
SELECT pg_size_pretty(pg_database_size('tours_db'));"
```

---

## ✅ Final Checklist

Before going live:

- [ ] All environment variables configured
- [ ] All passwords changed from defaults
- [ ] FRONTEND_URL points to production domain
- [ ] SSL/HTTPS configured
- [ ] Firewall rules configured
- [ ] Database backups automated
- [ ] All services healthy
- [ ] All tests passing
- [ ] Email delivery working
- [ ] Admin panel accessible
- [ ] Tour info sections working
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team trained on deployment process

---

## 🎉 Go Live!

Once all checks pass, your Tourism Platform is ready for production! 🚀

**Remember:**
- Monitor logs closely for first 24 hours
- Have rollback plan ready
- Keep backups
- Document any issues encountered

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Version:** _____________  
**Status:** ⬜ Ready / ⬜ In Progress / ⬜ Complete
