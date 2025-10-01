import httpx
import os
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class ToursClient:
    """
    HTTP client for communicating with Tours & Packages Service
    """
    
    def __init__(self):
        self.base_url = os.getenv("TOURS_SERVICE_URL", "http://tours-service:8010")
        self.timeout = 30.0
    
    async def get_tour(self, tour_id: str) -> Optional[Dict[Any, Any]]:
        """
        Get tour details by ID from Tours service
        
        Args:
            tour_id: UUID string of the tour
            
        Returns:
            Tour data dictionary if found, None otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/tours/{tour_id}")
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 404:
                    logger.warning(f"Tour {tour_id} not found")
                    return None
                else:
                    logger.error(f"Error fetching tour {tour_id}: {response.status_code}")
                    return None
                    
        except httpx.TimeoutException:
            logger.error(f"Timeout while fetching tour {tour_id}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error while fetching tour {tour_id}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error while fetching tour {tour_id}: {str(e)}")
            return None
    
    async def get_tours(self, skip: int = 0, limit: int = 100) -> Optional[list]:
        """
        Get list of tours from Tours service
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of tour data dictionaries if successful, None otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/tours",
                    params={"skip": skip, "limit": limit}
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Error fetching tours: {response.status_code}")
                    return None
                    
        except httpx.TimeoutException:
            logger.error("Timeout while fetching tours")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error while fetching tours: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error while fetching tours: {str(e)}")
            return None
    
    async def create_review_token(self, booking_id: str, tour_id: str, customer_name: str, customer_email: str) -> Optional[str]:
        """
        Create a review token for a completed booking
        
        Args:
            booking_id: UUID string of the booking
            tour_id: UUID string of the tour
            customer_name: Customer name
            customer_email: Customer email
            
        Returns:
            Review token string if successful, None otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/reviews/create-token",
                    json={
                        "booking_id": booking_id,
                        "tour_id": tour_id,
                        "customer_name": customer_name,
                        "customer_email": customer_email
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("token")
                else:
                    logger.error(f"Error creating review token: {response.status_code}")
                    return None
                    
        except httpx.TimeoutException:
            logger.error("Timeout while creating review token")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error while creating review token: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error while creating review token: {str(e)}")
            return None

    async def health_check(self) -> bool:
        """
        Check if Tours service is healthy
        
        Returns:
            True if service is healthy, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200
        except Exception:
            return False