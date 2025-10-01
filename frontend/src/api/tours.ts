import { toursApi } from './config'

export interface TourImage {
  id?: string
  image_url: string
  is_main: boolean
  display_order: number
  alt_text?: string
}

export interface Tour {
  id: string
  title: string
  description: string
  price: string
  duration: string
  location: string
  max_participants: number
  difficulty_level: string
  includes: string[]
  available_dates: string[]
  images: TourImage[]
  created_at: string
  updated_at: string
}

export const toursService = {
  // Get all tours
  async getAllTours(): Promise<Tour[]> {
    try {
      const response = await toursApi.get('/tours')
      return response.data
    } catch (error) {
      console.error('Error fetching tours:', error)
      throw new Error('Failed to fetch tours')
    }
  },

  // Get tour by ID
  async getTourById(id: string): Promise<Tour> {
    try {
      const response = await toursApi.get(`/tours/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching tour:', error)
      throw new Error('Failed to fetch tour details')
    }
  },

  // Get featured tours (first 3 tours)
  async getFeaturedTours(): Promise<Tour[]> {
    try {
      const response = await toursApi.get('/tours?limit=3')
      return response.data
    } catch (error) {
      console.error('Error fetching featured tours:', error)
      throw new Error('Failed to fetch featured tours')
    }
  }
}