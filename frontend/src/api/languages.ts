import { toursApi } from './config'

// Language interfaces
export interface Language {
  id: string
  code: string
  name: string
  native_name: string
  flag_emoji: string
  is_active: boolean
  is_default: boolean
  created_at: string
}

export interface LanguageCreate {
  code: string
  name: string
  native_name: string
  flag_emoji: string
  is_active?: boolean
}

export interface LanguageUpdate {
  name?: string
  native_name?: string
  flag_emoji?: string
  is_active?: boolean
}

export interface LanguagesResponse {
  languages: Language[]
}

export interface TourLanguagesResponse {
  tour_id: string
  available_languages: string[]
}

// Languages service
export const languagesService = {
  /**
   * Get all active languages
   * @returns Promise<Language[]> - Array of active languages
   */
  async getActiveLanguages(): Promise<Language[]> {
    try {
      const response = await toursApi.get<Language[]>('/languages', {
        params: { active_only: true }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching active languages:', error)
      throw new Error('Failed to fetch active languages')
    }
  },

  /**
   * Get all languages (active and inactive)
   * @returns Promise<Language[]> - Array of all languages
   */
  async getAllLanguages(): Promise<Language[]> {
    try {
      const response = await toursApi.get<Language[]>('/languages', {
        params: { active_only: false }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching all languages:', error)
      throw new Error('Failed to fetch all languages')
    }
  },

  /**
   * Create a new language (Admin only)
   * @param data - Language creation data
   * @returns Promise<Language> - Created language object
   */
  async createLanguage(data: LanguageCreate): Promise<Language> {
    try {
      const response = await toursApi.post<Language>('/languages', data)
      return response.data
    } catch (error) {
      console.error('Error creating language:', error)
      throw new Error('Failed to create language')
    }
  },

  /**
   * Update an existing language (Admin only)
   * @param id - Language ID
   * @param data - Language update data
   * @returns Promise<Language> - Updated language object
   */
  async updateLanguage(id: string, data: LanguageUpdate): Promise<Language> {
    try {
      const response = await toursApi.put<Language>(`/languages/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating language:', error)
      throw new Error('Failed to update language')
    }
  },

  /**
   * Delete a language (Admin only)
   * @param id - Language ID
   * @returns Promise<void>
   */
  async deleteLanguage(id: string): Promise<void> {
    try {
      await toursApi.delete(`/languages/${id}`)
    } catch (error) {
      console.error('Error deleting language:', error)
      throw new Error('Failed to delete language')
    }
  },

  /**
   * Get available languages for a specific tour
   * @param tourId - Tour ID
   * @returns Promise<string[]> - Array of language codes
   */
  async getTourLanguages(tourId: string): Promise<string[]> {
    try {
      const response = await toursApi.get<TourLanguagesResponse>(`/tours/${tourId}/available-languages`)
      return response.data.available_languages
    } catch (error) {
      console.error('Error fetching tour languages:', error)
      throw new Error('Failed to fetch tour languages')
    }
  }
}
