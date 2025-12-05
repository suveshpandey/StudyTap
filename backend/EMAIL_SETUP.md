# Email Configuration Setup

This document explains how to configure email functionality for sending student credentials.

## Environment Variables

Add the following variables to your `.env` file:

```env
# Email Configuration
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
MAIL_FROM_NAME=CampusMind AI
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_TLS=True
MAIL_SSL=False
MAIL_USE_CREDENTIALS=True
```

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this app password as `MAIL_PASSWORD` (not your regular Gmail password)

3. **Configuration**:
   ```
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-16-char-app-password
   MAIL_FROM=your-email@gmail.com
   MAIL_FROM_NAME=CampusMind AI
   MAIL_PORT=587
   MAIL_SERVER=smtp.gmail.com
   MAIL_TLS=True
   MAIL_SSL=False
   MAIL_USE_CREDENTIALS=True
   ```

## Other Email Providers

### Outlook/Hotmail
```env
MAIL_SERVER=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_TLS=True
```

### Yahoo
```env
MAIL_SERVER=smtp.mail.yahoo.com
MAIL_PORT=587
MAIL_TLS=True
```

### Custom SMTP Server
```env
MAIL_SERVER=your-smtp-server.com
MAIL_PORT=587  # or 465 for SSL
MAIL_TLS=True  # or False if using SSL
MAIL_SSL=False  # Set to True if using port 465
```

## Testing

After configuration, when a university admin uploads student data via CSV:
1. Students are created in the database
2. Credentials emails are automatically sent to each student's email address
3. The email contains:
   - Student's email address
   - Auto-generated 8-character password
   - Login instructions

## Troubleshooting

- **Email not sending**: Check your SMTP credentials and firewall settings
- **Authentication errors**: Verify your app password (for Gmail) or account credentials
- **Connection timeout**: Check if your firewall allows outbound SMTP connections
- **Rate limiting**: The system sends emails with a concurrency limit of 5 to avoid overwhelming the SMTP server

