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
  tour_type: 'tour' | 'excursion'
  includes: string[]
  available_dates: string[]
  images: TourImage[]
  created_at: string
  updated_at: string
  available_languages?: string[]
  current_language?: string
  is_fallback?: boolean
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
  category: 'included' | 'not_included'
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

export interface MultilingualTourCreate {
  price: number
  duration: string
  max_participants: number
  difficulty_level: string
  available_dates?: string[]
  translations: {
    en: {
      title: string
      description: string
      location: string
      includes?: string
    }
    fr: {
      title: string
      description: string
      location: string
      includes?: string
    }
  }
  images?: TourImage[]
}

export interface TourInfoSection {
  id: string
  tour_id: string
  title_en: string
  title_fr: string
  content_en: string
  content_fr: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface TourInfoSectionCreate {
  title_en: string
  title_fr: string
  content_en: string
  content_fr: string
  display_order?: number
}

export interface TourInfoSectionUpdate {
  title_en?: string
  title_fr?: string
  content_en?: string
  content_fr?: string
  display_order?: number
}

export interface TourTranslationInput {
  language_code: string
  title: string
  description: string
  location?: string
  itinerary?: string
}

export interface TourCreateDynamic {
  price: number
  duration: string
  max_participants: number
  difficulty_level: string
  includes?: string[]
  available_dates?: string[]
  translations: TourTranslationInput[]
  images?: TourImage[]
}

export interface TourUpdateDynamic {
  price?: number
  duration?: string
  max_participants?: number
  difficulty_level?: string
  includes?: string[]
  available_dates?: string[]
  translations?: TourTranslationInput[]
  images?: TourImage[]
}

export const toursService = {
  // Get all tours with language support
  async getAllTours(lang: string = 'en'): Promise<Tour[]> {
    try {
      const response = await toursApi.get('/tours', {
        params: { lang }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching tours:', error)
      throw new Error('Failed to fetch tours')
    }
  },

  // Get tours filtered by type
  async getTours(lang: string = 'en', tourType?: 'tour' | 'excursion'): Promise<Tour[]> {
    try {
      const params: any = { lang }
      if (tourType) {
        params.tour_type = tourType
      }
      const response = await toursApi.get('/tours', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching tours:', error)
      throw new Error('Failed to fetch tours')
    }
  },

  // Create multilingual tour
  async createMultilingualTour(data: MultilingualTourCreate): Promise<Tour> {
    try {
      const response = await toursApi.post('/tours/multilingual', data)
      return response.data
    } catch (error) {
      console.error('Error creating multilingual tour:', error)
      throw new Error('Failed to create multilingual tour')
    }
  },

  // Create tour with dynamic languages (v2)
  async createTourDynamic(data: TourCreateDynamic): Promise<Tour> {
    try {
      const response = await toursApi.post('/tours/v2', data)
      return response.data
    } catch (error) {
      console.error('Error creating tour with dynamic languages:', error)
      throw new Error('Failed to create tour')
    }
  },

  // Update tour with dynamic languages (v2)
  async updateTourDynamic(tourId: string, data: TourUpdateDynamic): Promise<Tour> {
    try {
      const response = await toursApi.put(`/tours/v2/${tourId}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating tour with dynamic languages:', error)
      throw new Error('Failed to update tour')
    }
  },

  // Get tour by ID with language support
  async getTourById(id: string, lang: string = 'en'): Promise<Tour> {
    try {
      const response = await toursApi.get(`/tours/${id}`, {
        params: { lang }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching tour:', error)
      throw new Error('Failed to fetch tour details')
    }
  },

  // Get available languages for a tour
  async getTourAvailableLanguages(id: string): Promise<{ tour_id: string; available_languages: string[] }> {
    try {
      const response = await toursApi.get(`/tours/${id}/available-languages`)
      return response.data
    } catch (error) {
      console.error('Error fetching tour available languages:', error)
      throw new Error('Failed to fetch tour available languages')
    }
  },

  // Get featured tours (first 3 tours) with language support
  async getFeaturedTours(lang: string = 'en'): Promise<Tour[]> {
    try {
      const response = await toursApi.get('/tours', {
        params: { limit: 3, lang }
      })
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
  },

  // ============================================================================
  // Tour Info Sections
  // ============================================================================

  async getTourInfoSections(tourId: string): Promise<TourInfoSection[]> {
    try {
      const response = await toursApi.get(`/tours/${tourId}/info-sections`)
      return response.data
    } catch (error) {
      console.error('Error fetching tour info sections:', error)
      throw new Error('Failed to fetch tour information sections')
    }
  },

  async createTourInfoSection(tourId: string, data: TourInfoSectionCreate): Promise<TourInfoSection> {
    try {
      const response = await toursApi.post(`/tours/${tourId}/info-sections`, data)
      return response.data
    } catch (error) {
      console.error('Error creating tour info section:', error)
      throw new Error('Failed to create tour information section')
    }
  },

  async updateTourInfoSection(sectionId: string, data: TourInfoSectionUpdate): Promise<TourInfoSection> {
    try {
      const response = await toursApi.put(`/info-sections/${sectionId}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating tour info section:', error)
      throw new Error('Failed to update tour information section')
    }
  },

  async deleteTourInfoSection(sectionId: string): Promise<void> {
    try {
      await toursApi.delete(`/info-sections/${sectionId}`)
    } catch (error) {
      console.error('Error deleting tour info section:', error)
      throw new Error('Failed to delete tour information section')
    }
  },

  async reorderTourInfoSections(tourId: string, orders: {id: string, display_order: number}[]): Promise<void> {
    try {
      await toursApi.post(`/tours/${tourId}/info-sections/reorder`, orders)
    } catch (error) {
      console.error('Error reordering tour info sections:', error)
      throw new Error('Failed to reorder tour information sections')
    }
  }
}