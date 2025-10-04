# Email Configuration Guide

## 🔧 Setting Up Email for Production

Your tourism platform needs email configuration to send booking confirmations and notifications.

### **Step 1: Configure Gmail App Password**

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

### **Step 2: Update .env File**

Edit your `.env` file with your email settings:

```bash
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
FROM_EMAIL=your-email@gmail.com
ADMIN_EMAIL=admin@yourcompany.com
```

### **Step 3: Restart Services**

```bash
# Restart messaging service to pick up new config
docker-compose restart messaging-service

# Test email functionality
curl -X POST http://localhost:8030/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","message":"Test email"}'
```

### **Alternative Email Providers**

#### **SendGrid**
```bash
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### **Mailgun**
```bash
SMTP_SERVER=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

### **Troubleshooting**

1. **Check messaging service logs**:
   ```bash
   docker-compose logs messaging-service
   ```

2. **Test SMTP connection**:
   ```bash
   docker-compose exec messaging-service python -c "
   import smtplib
   server = smtplib.SMTP('smtp.gmail.com', 587)
   server.starttls()
   server.login('your-email@gmail.com', 'your-app-password')
   print('SMTP connection successful!')
   server.quit()
   "
   ```

3. **Common Issues**:
   - ❌ **"Authentication failed"** → Check app password
   - ❌ **"Connection refused"** → Check SMTP server/port
   - ❌ **"Less secure apps"** → Use app password instead

### **Security Notes**

- ✅ **Never commit** email passwords to Git
- ✅ **Use app passwords** instead of account passwords
- ✅ **Rotate passwords** regularly
- ✅ **Use environment variables** for production