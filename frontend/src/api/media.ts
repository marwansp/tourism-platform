import { mediaApi } from './config'

export interface MediaItem {
  id: string
  url: string
  caption: string | null
  file_size: number | null
  mime_type: string | null
  filename: string | null
  created_at: string
}

export const mediaService = {
  // Get all media items for gallery
  async getGalleryItems(): Promise<MediaItem[]> {
    try {
      const response = await mediaApi.get('/gallery')
      return response.data
    } catch (error) {
      console.error('Error fetching gallery items:', error)
      throw new Error('Failed to fetch gallery items')
    }
  },

  // Get media item by ID
  async getMediaItemById(id: string): Promise<MediaItem> {
    try {
      const response = await mediaApi.get(`/gallery/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching media item:', error)
      throw new Error('Failed to fetch media item')
    }
  }
}