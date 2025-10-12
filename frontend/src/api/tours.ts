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

// V2 Types
export interface GroupPricing {
  id: string
  tour_id: string
  min_participants: number
  max_participants: number
  price_per_person: number
  created_at: string
}

export interface Tag {
  id: string
  name: string
  icon?: string
  created_at: string
}

export interface TourTag {
  id: string
  tour_id: string
  tag_id: string
  tag: Tag
  created_at: string
}

export interface PriceCalculation {
  price_per_person: number
  total_price: number
  participants: number
  pricing_tier: string
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
  },

  // ============================================================================
  // V2 API Methods - Group Pricing
  // ============================================================================

  // Get group pricing for a tour
  async getGroupPricing(tourId: string): Promise<GroupPricing[]> {
    try {
      const response = await toursApi.get(`/tours/${tourId}/group-pricing`)
      return response.data
    } catch (error) {
      console.error('Error fetching group pricing:', error)
      throw new Error('Failed to fetch group pricing')
    }
  },

  // Create group pricing tier
  async createGroupPricing(tourId: string, data: Omit<GroupPricing, 'id' | 'tour_id' | 'created_at'>): Promise<GroupPricing> {
    try {
      const response = await toursApi.post(`/tours/${tourId}/group-pricing`, data)
      return response.data
    } catch (error) {
      console.error('Error creating group pricing:', error)
      throw new Error('Failed to create group pricing')
    }
  },

  // Update group pricing tier
  async updateGroupPricing(pricingId: string, data: Partial<Omit<GroupPricing, 'id' | 'tour_id' | 'created_at'>>): Promise<GroupPricing> {
    try {
      const response = await toursApi.put(`/group-pricing/${pricingId}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating group pricing:', error)
      throw new Error('Failed to update group pricing')
    }
  },

  // Delete group pricing tier
  async deleteGroupPricing(pricingId: string): Promise<void> {
    try {
      await toursApi.delete(`/group-pricing/${pricingId}`)
    } catch (error) {
      console.error('Error deleting group pricing:', error)
      throw new Error('Failed to delete group pricing')
    }
  },

  // Calculate price for group size
  async calculatePrice(tourId: string, participants: number): Promise<PriceCalculation> {
    try {
      const response = await toursApi.get(`/tours/${tourId}/calculate-price`, {
        params: { participants }
      })
      return response.data
    } catch (error) {
      console.error('Error calculating price:', error)
      throw new Error('Failed to calculate price')
    }
  },

  // ============================================================================
  // V2 API Methods - Tags
  // ============================================================================

  // Get all tags
  async getAllTags(): Promise<Tag[]> {
    try {
      const response = await toursApi.get('/tags')
      return response.data
    } catch (error) {
      console.error('Error fetching tags:', error)
      throw new Error('Failed to fetch tags')
    }
  },

  // Create tag
  async createTag(data: Omit<Tag, 'id' | 'created_at'>): Promise<Tag> {
    try {
      const response = await toursApi.post('/tags', data)
      return response.data
    } catch (error) {
      console.error('Error creating tag:', error)
      throw new Error('Failed to create tag')
    }
  },

  // Update tag
  async updateTag(tagId: string, data: Partial<Omit<Tag, 'id' | 'created_at'>>): Promise<Tag> {
    try {
      const response = await toursApi.put(`/tags/${tagId}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating tag:', error)
      throw new Error('Failed to update tag')
    }
  },

  // Delete tag
  async deleteTag(tagId: string): Promise<void> {
    try {
      await toursApi.delete(`/tags/${tagId}`)
    } catch (error) {
      console.error('Error deleting tag:', error)
      throw new Error('Failed to delete tag')
    }
  },

  // Get tour tags
  async getTourTags(tourId: string): Promise<TourTag[]> {
    try {
      const response = await toursApi.get(`/tours/${tourId}/tags`)
      return response.data
    } catch (error) {
      console.error('Error fetching tour tags:', error)
      throw new Error('Failed to fetch tour tags')
    }
  },

  // Add tag to tour
  async addTagToTour(tourId: string, tagId: string): Promise<TourTag> {
    try {
      const response = await toursApi.post(`/tours/${tourId}/tags`, { tag_id: tagId })
      return response.data
    } catch (error) {
      console.error('Error adding tag to tour:', error)
      throw new Error('Failed to add tag to tour')
    }
  },

  // Remove tag from tour
  async removeTagFromTour(tourId: string, tagId: string): Promise<void> {
    try {
      await toursApi.delete(`/tours/${tourId}/tags/${tagId}`)
    } catch (error) {
      console.error('Error removing tag from tour:', error)
      throw new Error('Failed to remove tag from tour')
    }
  }
}