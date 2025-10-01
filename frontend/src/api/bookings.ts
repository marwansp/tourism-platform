import { bookingsApi } from './config'

export interface BookingRequest {
  customer_name: string
  email: string
  phone?: string
  tour_id: string
  start_date: string
  end_date: string
  number_of_participants: number
  // Legacy field for backward compatibility
  travel_date?: string
}

export interface BookingResponse {
  id: string
  customer_name: string
  email: string
  phone: string | null
  tour_id: string
  start_date: string
  end_date: string
  number_of_participants: number
  price_per_person: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  admin_viewed: boolean
  created_at: string
  updated_at: string
  // Legacy field for backward compatibility
  travel_date?: string
}

export interface PriceCalculationRequest {
  tour_id: string
  start_date: string
  end_date: string
  number_of_participants: number
}

export interface PriceCalculationResponse {
  tour_id: string
  base_price_per_person: number  // Actually per day
  seasonal_multiplier: number
  group_discount_percentage: number
  price_per_person: number  // Actually per day
  total_price: number
  number_of_participants: number
  duration_days: number
  season_name?: string
  breakdown: {
    base_price_per_day?: number
    base_price?: number  // Legacy support
    seasonal_adjustment: number
    group_discount_amount: number
    duration_days: number
    participants: number
    calculation_steps: string[]
  }
}

export interface AvailabilityResponse {
  available: boolean
  message: string
  max_participants?: number
  unavailable_dates?: string[]
}

export const bookingsService = {
  // Calculate price for a booking
  async calculatePrice(request: PriceCalculationRequest): Promise<PriceCalculationResponse> {
    try {
      const response = await bookingsApi.post('/bookings/calculate-price', request)
      return response.data
    } catch (error) {
      console.error('Error calculating price:', error)
      throw new Error('Failed to calculate price')
    }
  },

  // Check availability for a booking
  async checkAvailability(request: PriceCalculationRequest): Promise<AvailabilityResponse> {
    try {
      const response = await bookingsApi.post('/bookings/check-availability', request)
      return response.data
    } catch (error) {
      console.error('Error checking availability:', error)
      throw new Error('Failed to check availability')
    }
  },

  // Create a new booking
  async createBooking(booking: BookingRequest): Promise<BookingResponse> {
    try {
      const response = await bookingsApi.post('/bookings', booking)
      return response.data
    } catch (error) {
      console.error('Error creating booking:', error)
      throw new Error('Failed to create booking')
    }
  },

  // Get booking by ID (for confirmation)
  async getBookingById(id: string): Promise<BookingResponse> {
    try {
      const response = await bookingsApi.get(`/bookings/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching booking:', error)
      throw new Error('Failed to fetch booking details')
    }
  },

  // Admin: Get all bookings
  async getAllBookings(): Promise<BookingResponse[]> {
    try {
      const response = await bookingsApi.get('/bookings')
      return response.data
    } catch (error) {
      console.error('Error fetching bookings:', error)
      throw new Error('Failed to fetch bookings')
    }
  },

  // Admin: Update booking status
  async updateBookingStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed'): Promise<BookingResponse> {
    try {
      const response = await bookingsApi.put(`/bookings/${id}`, { status })
      return response.data
    } catch (error) {
      console.error('Error updating booking status:', error)
      throw new Error('Failed to update booking status')
    }
  },

  // Admin: Mark booking as viewed
  async markAsViewed(id: string): Promise<void> {
    try {
      await bookingsApi.patch(`/bookings/${id}/mark-viewed`)
    } catch (error) {
      console.error('Error marking booking as viewed:', error)
      throw new Error('Failed to mark booking as viewed')
    }
  }
}