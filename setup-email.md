# 📧 Email Notifications Setup Guide

## Quick Setup Instructions

### Step 1: Choose Your Email Provider

#### Option A: Gmail (Recommended for testing)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
   - Copy the 16-character password

#### Option B: Other Providers
- **Outlook**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Check your hosting provider

### Step 2: Create Environment File

Create a `.env` file in your project root:

```bash
# Copy the example file
cp .env.example .env
```

### Step 3: Configure Your Email Settings

Edit the `.env` file with your credentials:

```env
# Gmail Example
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
FROM_EMAIL=your-email@gmail.com
ADMIN_EMAIL=admin@yourcompany.com
```

### Step 4: Restart Services

```bash
docker-compose restart messaging-service
```

### Step 5: Test Email Functionality

1. Go to your website: http://localhost:3000
2. Visit the Contact page
3. Send a test message
4. Check the Admin Dashboard → Messages tab
5. Check your admin email inbox

## 🎯 What You'll Get

### Admin Dashboard Features:
- **Messages Tab**: View all email notifications
- **Status Tracking**: See sent/failed/pending emails
- **Contact Form Messages**: All customer inquiries
- **Booking Notifications**: Automatic booking confirmations

### Automatic Email Notifications:
- **Booking Confirmations**: Sent to customers
- **Admin Notifications**: New booking alerts
- **Contact Form**: Customer messages forwarded to admin

## 🔧 Troubleshooting

### Common Issues:

1. **"SMTP credentials not configured"**
   - Check your `.env` file exists
   - Verify SMTP_USERNAME and SMTP_PASSWORD are set
   - Restart messaging-service

2. **"Authentication failed"**
   - For Gmail: Use App Password, not regular password
   - Verify 2FA is enabled on Gmail
   - Check username/password are correct

3. **"Connection refused"**
   - Check SMTP server and port
   - Verify firewall settings
   - Try different SMTP provider

### Test Commands:

```bash
# Check if messaging service is running
docker-compose logs messaging-service

# Test email endpoint directly
curl -X POST http://localhost:8030/notify/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "template": "default",
    "data": {"message": "Test message"}
  }'
```

## 📱 Admin Dashboard Access

1. Visit: http://localhost:3000/admin
2. Click the **"Messages"** tab
3. View all email notifications and their status
4. Failed emails will show with red indicators

## 🚀 Ready to Use!

Once configured, your tourism platform will automatically:
- Send booking confirmations to customers
- Notify you of new bookings
- Forward contact form messages to your email
- Track all email delivery status in the admin dashboard