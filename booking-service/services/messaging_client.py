import httpx
import os
from typing import Dict, Any
import logging
from models import Booking

logger = logging.getLogger(__name__)

class MessagingClient:
    """
    HTTP client for communicating with Messaging & Notification Service
    """
    
    def __init__(self):
        self.base_url = os.getenv("MESSAGING_SERVICE_URL", "http://messaging-service:8030")
        self.timeout = 30.0
    
    async def send_booking_notification(self, booking: Booking, tour_data: Dict[Any, Any]) -> bool:
        """
        Send booking notification email to customer and admin
        
        Args:
            booking: Booking object with customer details
            tour_data: Tour information from Tours service
            
        Returns:
            True if notification sent successfully, False otherwise
        """
        try:
            # Calculate duration in days
            duration_days = (booking.end_date.date() - booking.start_date.date()).days + 1
            
            # Prepare notification data
            notification_data = {
                "booking_id": str(booking.id),
                "customer_name": booking.customer_name,
                "customer_email": booking.email,
                "tour_title": tour_data.get("title", "Unknown Tour"),
                "start_date": booking.start_date.strftime("%B %d, %Y"),
                "end_date": booking.end_date.strftime("%B %d, %Y"),
                "duration_days": duration_days,
                "number_of_participants": booking.number_of_participants,
                "price_per_person": str(booking.price_per_person),
                "total_price": str(booking.total_price),
                "travel_date": booking.travel_date.isoformat() if booking.travel_date else booking.start_date.isoformat(),  # Legacy support
                "tour_price": str(booking.total_price),  # Legacy support
                "status": booking.status
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Send customer confirmation email
                customer_response = await client.post(
                    f"{self.base_url}/notify/email",
                    json={
                        "to": booking.email,
                        "subject": "Booking Confirmation - Your Tour Reservation",
                        "template": "booking_confirmation",
                        "data": notification_data
                    }
                )
                
                # Send admin notification email
                admin_email = os.getenv("ADMIN_EMAIL", "admin@tourismplatform.com")
                admin_response = await client.post(
                    f"{self.base_url}/notify/email",
                    json={
                        "to": admin_email,
                        "subject": f"New Booking: {tour_data.get('title', 'Unknown Tour')}",
                        "template": "admin_notification",
                        "data": notification_data
                    }
                )
                
                # Consider successful if at least one email was sent
                customer_success = customer_response.status_code == 200
                admin_success = admin_response.status_code == 200
                
                if customer_success or admin_success:
                    logger.info(f"Booking notification sent for booking {booking.id}")
                    return True
                else:
                    logger.error(f"Failed to send booking notifications for booking {booking.id}")
                    return False
                    
        except httpx.TimeoutException:
            logger.error(f"Timeout while sending notification for booking {booking.id}")
            return False
        except httpx.RequestError as e:
            logger.error(f"Request error while sending notification for booking {booking.id}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error while sending notification for booking {booking.id}: {str(e)}")
            return False
    
    async def send_booking_update_notification(self, booking: Booking, tour_data: Dict[Any, Any]) -> bool:
        """
        Send booking status update notification
        
        Args:
            booking: Updated booking object
            tour_data: Tour information from Tours service
            
        Returns:
            True if notification sent successfully, False otherwise
        """
        try:
            # Calculate duration in days
            duration_days = (booking.end_date.date() - booking.start_date.date()).days + 1
            
            notification_data = {
                "booking_id": str(booking.id),
                "customer_name": booking.customer_name,
                "customer_email": booking.email,
                "tour_title": tour_data.get("title", "Unknown Tour"),
                "start_date": booking.start_date.strftime("%B %d, %Y"),
                "end_date": booking.end_date.strftime("%B %d, %Y"),
                "duration_days": duration_days,
                "number_of_participants": booking.number_of_participants,
                "price_per_person": str(booking.price_per_person),
                "total_price": str(booking.total_price),
                "travel_date": booking.travel_date.isoformat() if booking.travel_date else booking.start_date.isoformat(),  # Legacy support
                "tour_price": str(booking.total_price),  # Legacy support
                "status": booking.status
            }
            
            # Choose template and subject based on status
            if booking.status == "confirmed":
                template = "booking_confirmed"
                subject = f"🎉 Booking Confirmed - {tour_data.get('title', 'Your Tour')}"
            elif booking.status == "cancelled":
                template = "booking_cancellation"
                subject = f"❌ Booking Cancelled - {tour_data.get('title', 'Your Tour')}"
            else:
                template = "booking_confirmation"  # Default template
                subject = f"Booking Update - {tour_data.get('title', 'Your Tour')}"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/notify/email",
                    json={
                        "to": booking.email,
                        "subject": subject,
                        "template": template,
                        "data": notification_data
                    }
                )
                
                if response.status_code == 200:
                    logger.info(f"Booking {booking.status} notification sent for booking {booking.id}")
                    return True
                else:
                    logger.error(f"Failed to send booking {booking.status} notification for booking {booking.id}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error sending booking update notification for booking {booking.id}: {str(e)}")
            return False
    
    async def send_review_request(self, booking: Booking, tour_data: Dict[Any, Any], review_token: str) -> bool:
        """
        Send review request email to customer after tour completion
        
        Args:
            booking: Completed booking object
            tour_data: Tour information from Tours service
            review_token: Unique token for review access
            
        Returns:
            True if review request sent successfully, False otherwise
        """
        try:
            # Calculate duration in days
            duration_days = (booking.end_date.date() - booking.start_date.date()).days + 1
            
            # Create review link
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            review_link = f"{frontend_url}/review/{review_token}"
            
            notification_data = {
                "booking_id": str(booking.id),
                "customer_name": booking.customer_name,
                "customer_email": booking.email,
                "tour_title": tour_data.get("title", "Unknown Tour"),
                "tour_date": booking.start_date.strftime("%B %d, %Y"),
                "start_date": booking.start_date.strftime("%B %d, %Y"),
                "end_date": booking.end_date.strftime("%B %d, %Y"),
                "duration_days": duration_days,
                "review_link": review_link,
                "review_token": review_token
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/notify/email",
                    json={
                        "to": booking.email,
                        "subject": f"🌟 How was your {tour_data.get('title', 'tour')} experience?",
                        "template": "review_request",
                        "data": notification_data
                    }
                )
                
                if response.status_code == 200:
                    logger.info(f"Review request sent for booking {booking.id}")
                    return True
                else:
                    logger.error(f"Failed to send review request for booking {booking.id}: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error sending review request for booking {booking.id}: {str(e)}")
            return False

    async def health_check(self) -> bool:
        """
        Check if Messaging service is healthy
        
        Returns:
            True if service is healthy, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200
        except Exception:
            return False