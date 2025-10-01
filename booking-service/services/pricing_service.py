"""
Pricing service for calculating dynamic tour prices
"""
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Optional, Tuple
import httpx
from sqlalchemy.orm import Session
from schemas import PriceCalculationRequest, PriceCalculationResponse


class PricingService:
    """Service for calculating tour prices with seasonal and group discounts"""
    
    def __init__(self, tours_service_url: str = "http://tours-service:8010"):
        self.tours_service_url = tours_service_url
    
    async def calculate_price(
        self, 
        request: PriceCalculationRequest,
        db: Session
    ) -> PriceCalculationResponse:
        """
        Calculate total price for a tour booking
        
        Args:
            request: Price calculation request with tour details
            db: Database session
            
        Returns:
            PriceCalculationResponse with detailed pricing breakdown
        """
        # Get tour details from tours service
        tour_data = await self._get_tour_details(request.tour_id)
        
        # Calculate duration in days
        start_date = self._parse_date(request.start_date)
        end_date = self._parse_date(request.end_date)
        duration_days = (end_date - start_date).days + 1
        
        # Get base price (handle both old and new field names)
        base_price = Decimal(str(tour_data.get('base_price', tour_data.get('price', 100))))
        
        # Get seasonal pricing multiplier
        seasonal_data = await self._get_seasonal_pricing(
            request.tour_id, 
            start_date, 
            end_date
        )
        
        seasonal_multiplier = Decimal(str(seasonal_data['multiplier']))
        season_name = seasonal_data['season_name']
        
        # Calculate price per person with seasonal adjustment
        seasonal_price = base_price * seasonal_multiplier
        
        # Apply group discount if applicable
        group_discount_percentage = Decimal('0')
        group_threshold = tour_data.get('group_discount_threshold', 5)
        group_discount = tour_data.get('group_discount_percentage', 0)
        if (request.number_of_participants >= group_threshold and group_discount > 0):
            group_discount_percentage = Decimal(str(group_discount))
        
        # Calculate final price per person
        discount_amount = seasonal_price * (group_discount_percentage / Decimal('100'))
        price_per_person = seasonal_price - discount_amount
        
        # Calculate total price: base_price_per_day × duration × participants
        price_per_day = price_per_person  # Rename for clarity - this is actually per day
        total_price = price_per_day * Decimal(str(duration_days)) * Decimal(str(request.number_of_participants))
        
        # Round to 2 decimal places
        price_per_day = price_per_day.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        total_price = total_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        # Create detailed breakdown
        breakdown = {
            'base_price_per_day': float(base_price),
            'seasonal_adjustment': float(seasonal_price - base_price),
            'group_discount_amount': float(discount_amount),
            'duration_days': duration_days,
            'participants': request.number_of_participants,
            'calculation_steps': [
                f"Base price per day: ${base_price}",
                f"Seasonal multiplier ({season_name}): {seasonal_multiplier}x = ${seasonal_price} per day",
                f"Group discount ({group_discount_percentage}%): -${discount_amount} per day",
                f"Final price per day: ${price_per_day}",
                f"Duration: {duration_days} days",
                f"Participants: {request.number_of_participants}",
                f"Total: ${price_per_day} × {duration_days} days × {request.number_of_participants} participants = ${total_price}"
            ]
        }
        
        return PriceCalculationResponse(
            tour_id=request.tour_id,
            base_price_per_person=base_price,  # This is actually per day now
            seasonal_multiplier=seasonal_multiplier,
            group_discount_percentage=group_discount_percentage,
            price_per_person=price_per_day,  # This is actually per day now
            total_price=total_price,
            number_of_participants=request.number_of_participants,
            duration_days=duration_days,
            season_name=season_name,
            breakdown=breakdown
        )
    
    async def _get_tour_details(self, tour_id: str) -> Dict:
        """Get tour details from tours service"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.tours_service_url}/tours/{tour_id}")
            if response.status_code != 200:
                raise ValueError(f"Tour not found: {tour_id}")
            return response.json()
    
    async def _get_seasonal_pricing(
        self, 
        tour_id: str, 
        start_date: date, 
        end_date: date
    ) -> Dict:
        """Get seasonal pricing for the given date range"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.tours_service_url}/tours/{tour_id}/seasonal-pricing",
                params={
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                }
            )
            if response.status_code == 200:
                return response.json()
            else:
                # Default to base pricing if no seasonal pricing found
                return {
                    'multiplier': 1.0,
                    'season_name': 'Regular Season'
                }
    
    def _parse_date(self, date_input) -> date:
        """Parse date from various input formats"""
        if isinstance(date_input, date):
            return date_input
        elif isinstance(date_input, datetime):
            return date_input.date()
        elif isinstance(date_input, str):
            return datetime.strptime(date_input, '%Y-%m-%d').date()
        else:
            raise ValueError(f"Invalid date format: {date_input}")
    
    async def check_availability(
        self, 
        tour_id: str, 
        start_date: date, 
        end_date: date, 
        participants: int
    ) -> Dict:
        """Check if tour is available for the given dates and participant count"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.tours_service_url}/tours/{tour_id}/availability",
                params={
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'participants': participants
                }
            )
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    'available': False,
                    'message': 'Unable to check availability'
                }


# Global pricing service instance
pricing_service = PricingService()