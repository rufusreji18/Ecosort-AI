import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from database import execute_query

# Load SMTP configuration from environment variables with defaults
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@ecosort-ai.com")

def send_bin_full_alert(bin_id, bin_name, location, fill_level):
    """
    Sends an email notification to the administrator when a dustbin level is >= 80%.
    Logs the alert to the database `notifications` table.
    """
    subject = f"⚠️ CRITICAL ALERT: Smart Dustbin #{bin_id} at {bin_name} is Full!"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Alert message text
    alert_message = f"Smart Dustbin #{bin_id} at {location} ({bin_name}) is {fill_level}% full. Please schedule waste collection immediately."
    
    # HTML template with modern styling
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                background-color: #0b0f19;
                color: #ffffff;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(135deg, #0f172a, #1e293b);
                border: 1px solid #ef4444;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 4px 20px rgba(239, 68, 68, 0.2);
            }}
            .header {{
                text-align: center;
                border-bottom: 2px solid #ef4444;
                padding-bottom: 15px;
                margin-bottom: 20px;
            }}
            .header h1 {{
                color: #ef4444;
                margin: 0;
                font-size: 24px;
            }}
            .details {{
                margin-bottom: 25px;
                background: rgba(255, 255, 255, 0.05);
                padding: 15px;
                border-radius: 8px;
            }}
            .details p {{
                margin: 8px 0;
                font-size: 16px;
            }}
            .label {{
                font-weight: bold;
                color: #38bdf8;
            }}
            .footer {{
                text-align: center;
                font-size: 12px;
                color: #94a3b8;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 15px;
            }}
            .status-badge {{
                display: inline-block;
                padding: 6px 12px;
                background-color: #ef4444;
                color: white;
                font-weight: bold;
                border-radius: 20px;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 EcoSort-AI Dustbin Capacity Alert</h1>
            </div>
            <div class="details">
                <p><span class="label">Bin ID:</span> #{bin_id}</p>
                <p><span class="label">Location Name:</span> {bin_name}</p>
                <p><span class="label">Detailed Area:</span> {location}</p>
                <p><span class="label">Current Fill level:</span> <span class="status-badge">{fill_level}%</span></p>
                <p><span class="label">Timestamp:</span> {timestamp}</p>
                <p style="margin-top: 15px; font-style: italic;">"{alert_message}"</p>
            </div>
            <div class="footer">
                This is an automated message sent by the EcoSort-AI IoT Monitoring System.<br>
                Please do not reply directly to this email.
            </div>
        </div>
    </body>
    </html>
    """
    
    # Save notification to notifications database table
    try:
        execute_query(
            "INSERT INTO notifications (bin_id, message, type, is_read) VALUES (%s, %s, %s, %s)",
            (bin_id, alert_message, "email_alert", 0),
            fetch="none"
        )
        print(f"[EMAIL SERVICE] Alert logged to DB notifications table for Bin #{bin_id}")
    except Exception as db_err:
        print("[EMAIL SERVICE] Failed to log alert to notifications table:", db_err)
        
    # Attempt to send email via SMTP
    if SMTP_USER and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = SMTP_USER
            msg["To"] = ADMIN_EMAIL
            
            part1 = MIMEText(alert_message, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)
            
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, ADMIN_EMAIL, msg.as_string())
            server.quit()
            print(f"[EMAIL SERVICE] Success! Alert email sent to {ADMIN_EMAIL} for Bin #{bin_id}")
            return True
        except Exception as e:
            print(f"[EMAIL SERVICE] SMTP sending failed: {e}")
            return False
    else:
        # Mock Email Logging
        print("\n" + "="*60)
        print("[MOCK EMAIL ALERT]")
        print(f"To: {ADMIN_EMAIL}")
        print(f"Subject: {subject}")
        print(f"Body: {alert_message}")
        print("="*60 + "\n")
        return True
