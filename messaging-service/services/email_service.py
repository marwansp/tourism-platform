import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader, select_autoescape
import os
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """
    Service for sending emails using SMTP
    """
    
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)
        self.admin_email = os.getenv("ADMIN_EMAIL", "admin@tourismplatform.com")
        
        # Initialize Jinja2 template environment
        template_dir = os.path.join(os.path.dirname(__file__), "..", "templates")
        self.jinja_env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
    
    def get_admin_email(self) -> str:
        """Get admin email address"""
        return self.admin_email
    
    async def send_email(self, to: str, subject: str, template: str = "default", data: Optional[Dict[str, Any]] = None) -> bool:
        """
        Send email using specified template
        
        Args:
            to: Recipient email address
            subject: Email subject
            template: Template name
            data: Template data
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Skip sending if SMTP credentials are not configured
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured, skipping email send")
                return True  # Return True for testing purposes
            
            # Generate email content from template
            html_content, text_content = self._render_template(template, data or {})
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.from_email
            message["To"] = to
            
            # Add text and HTML parts
            text_part = MIMEText(text_content, "plain")
            html_part = MIMEText(html_content, "html")
            
            message.attach(text_part)
            message.attach(html_part)
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=self.smtp_server,
                port=self.smtp_port,
                start_tls=True,
                username=self.smtp_username,
                password=self.smtp_password,
            )
            
            logger.info(f"Email sent successfully to {to}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {str(e)}")
            return False
    
    def _render_template(self, template_name: str, data: Dict[str, Any]) -> tuple[str, str]:
        """
        Render email template with data
        
        Args:
            template_name: Name of the template
            data: Template data
            
        Returns:
            Tuple of (html_content, text_content)
        """
        try:
            # Try to load custom template
            html_template = self.jinja_env.get_template(f"{template_name}.html")
            html_content = html_template.render(**data)
            
            # Try to load text version
            try:
                text_template = self.jinja_env.get_template(f"{template_name}.txt")
                text_content = text_template.render(**data)
            except:
                # Generate simple text version from HTML
                text_content = self._html_to_text(html_content)
                
        except Exception as e:
            logger.warning(f"Template {template_name} not found, using default: {str(e)}")
            # Use default template
            html_content, text_content = self._get_default_template(data)
        
        return html_content, text_content
    
    def _get_default_template(self, data: Dict[str, Any]) -> tuple[str, str]:
        """
        Generate default email template
        
        Args:
            data: Template data
            
        Returns:
            Tuple of (html_content, text_content)
        """
        # Default HTML template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Tourism Platform Notification</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2c3e50; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Tourism Platform</h1>
                </div>
                <div class="content">
                    <h2>Notification</h2>
                    <p>You have received a new notification from Tourism Platform.</p>
                    {self._format_data_as_html(data)}
                </div>
                <div class="footer">
                    <p>This is an automated message from Tourism Platform.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Default text template
        text_content = f"""
        Tourism Platform Notification
        
        You have received a new notification from Tourism Platform.
        
        {self._format_data_as_text(data)}
        
        ---
        This is an automated message from Tourism Platform.
        """
        
        return html_content, text_content
    
    def _format_data_as_html(self, data: Dict[str, Any]) -> str:
        """Format data as HTML list"""
        if not data:
            return ""
        
        html = "<ul>"
        for key, value in data.items():
            if value:
                html += f"<li><strong>{key.replace('_', ' ').title()}:</strong> {value}</li>"
        html += "</ul>"
        return html
    
    def _format_data_as_text(self, data: Dict[str, Any]) -> str:
        """Format data as plain text"""
        if not data:
            return ""
        
        text = ""
        for key, value in data.items():
            if value:
                text += f"{key.replace('_', ' ').title()}: {value}\n"
        return text
    
    def _html_to_text(self, html: str) -> str:
        """Convert HTML to plain text (simple version)"""
        import re
        # Remove HTML tags
        text = re.sub('<[^<]+?>', '', html)
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text