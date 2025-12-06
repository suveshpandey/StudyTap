# -----------------------------------------------------------------------------
# File: email_config.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Email configuration for FastAPI Mail
# -----------------------------------------------------------------------------

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
import os
from dotenv import load_dotenv

load_dotenv()

# Email configuration from environment variables
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
MAIL_FROM = os.getenv("MAIL_FROM", MAIL_USERNAME)
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "StudyTap")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_STARTTLS = os.getenv("MAIL_STARTTLS", "True").lower() == "true"
MAIL_SSL_TLS = os.getenv("MAIL_SSL_TLS", "False").lower() == "true"
MAIL_USE_CREDENTIALS = os.getenv("MAIL_USE_CREDENTIALS", "True").lower() == "true"

# Check if email is configured
EMAIL_ENABLED = bool(MAIL_USERNAME and MAIL_PASSWORD and MAIL_SERVER)

# FastMail configuration (only if email is enabled)
if EMAIL_ENABLED:
    conf = ConnectionConfig(
        MAIL_USERNAME=MAIL_USERNAME,
        MAIL_PASSWORD=MAIL_PASSWORD,
        MAIL_FROM=MAIL_FROM,
        MAIL_FROM_NAME=MAIL_FROM_NAME,
        MAIL_PORT=MAIL_PORT,
        MAIL_SERVER=MAIL_SERVER,
        MAIL_STARTTLS=MAIL_STARTTLS,
        MAIL_SSL_TLS=MAIL_SSL_TLS,
        USE_CREDENTIALS=MAIL_USE_CREDENTIALS,
        TEMPLATE_FOLDER=None,  # We'll use inline HTML
    )
    
    # Create FastMail instance
    fm = FastMail(conf)
else:
    fm = None
    print("Warning: Email configuration not found. Email functionality will be disabled.")
    print("Please set MAIL_USERNAME, MAIL_PASSWORD, and MAIL_SERVER in your .env file.")

