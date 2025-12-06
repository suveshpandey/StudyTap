# -----------------------------------------------------------------------------
# File: email_service.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Email service for sending student credentials
# -----------------------------------------------------------------------------

from fastapi_mail import MessageSchema
from app.email_config import fm, EMAIL_ENABLED
from typing import List
import asyncio


def get_student_credentials_email_html(student_name: str, email: str, password: str) -> str:
    """
    Generate HTML email template for student credentials.
    """
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .credentials-box {{
                background: white;
                border: 2px solid #667eea;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }}
            .credential-item {{
                margin: 15px 0;
                padding: 12px;
                background: #f0f4ff;
                border-left: 4px solid #667eea;
                border-radius: 4px;
            }}
            .label {{
                font-weight: bold;
                color: #667eea;
                display: block;
                margin-bottom: 5px;
            }}
            .value {{
                font-size: 18px;
                color: #333;
                font-family: 'Courier New', monospace;
            }}
            .warning {{
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 12px;
            }}
            .button {{
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Welcome to StudyTap!</h1>
            <p>Your Learning Journey Starts Here</p>
        </div>
        
        <div class="content">
            <h2>Hello {student_name},</h2>
            
            <p>Your student account has been successfully created. Below are your login credentials:</p>
            
            <div class="credentials-box">
                <h3 style="margin-top: 0; color: #667eea;">Your Login Credentials</h3>
                
                <div class="credential-item">
                    <span class="label">Email Address:</span>
                    <span class="value">{email}</span>
                </div>
                
                <div class="credential-item">
                    <span class="label">Password:</span>
                    <span class="value">{password}</span>
                </div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Important:</strong> Please keep these credentials secure. 
                You can change your password after logging in from your profile settings.
            </div>
            
            <p>You can now log in to the StudyTap platform and start your learning journey!</p>
            
            <div style="text-align: center;">
                <a href="http://localhost:5173/login" class="button">Login Now</a>
            </div>
            
            <p style="margin-top: 30px;">If you have any questions or need assistance, please contact your university administrator.</p>
        </div>
        
        <div class="footer">
            <p>© 2025 StudyTap. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </body>
    </html>
    """


async def send_student_credentials_email(
    student_email: str,
    student_name: str,
    password: str
) -> bool:
    """
    Send credentials email to a student.
    Returns True if successful, False otherwise.
    """
    if not EMAIL_ENABLED or fm is None:
        print(f"Email not configured. Skipping email to {student_email}")
        return False
    
    try:
        message = MessageSchema(
            subject="Welcome to StudyTap - Your Login Credentials",
            recipients=[student_email],
            body=get_student_credentials_email_html(student_name, student_email, password),
            subtype="html"
        )
        
        await fm.send_message(message)
        return True
    except Exception as e:
        print(f"Error sending email to {student_email}: {str(e)}")
        return False


async def send_bulk_student_credentials_emails(
    students: List[dict]
) -> dict:
    """
    Send credentials emails to multiple students.
    students: List of dicts with 'email', 'name', and 'password' keys.
    
    Returns a dict with:
    - sent: number of successfully sent emails
    - failed: list of failed emails with error messages
    """
    sent = 0
    failed = []
    
    # Send emails concurrently with a limit to avoid overwhelming the SMTP server
    semaphore = asyncio.Semaphore(5)  # Max 5 concurrent emails
    
    async def send_with_limit(student_data):
        async with semaphore:
            success = await send_student_credentials_email(
                student_data['email'],
                student_data['name'],
                student_data['password']
            )
            if not success:
                failed.append({
                    'email': student_data['email'],
                    'name': student_data['name'],
                    'error': 'Failed to send email'
                })
            return success
    
    tasks = [send_with_limit(student) for student in students]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    sent = sum(1 for result in results if result is True)
    
    return {
        'sent': sent,
        'failed': failed,
        'total': len(students)
    }

