export interface MediaItem {
  id: string;
  url: string;
  caption?: string;
  file_size: number;
  mime_type: string;
  filename: string;
  created_at: string;
}

export interface TourImageUploadResponse {
  url: string;
  filename: string;
  file_size: number;
  mime_type: string;
  message: string;
}

export const uploadTourImage = async (file: File): Promise<TourImageUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/media/upload/tour-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload image');
  }

  return response.json();
};

export const mediaService = {
  async getGalleryItems(): Promise<MediaItem[]> {
    const response = await fetch('/api/media/gallery');
    if (!response.ok) {
      throw new Error('Failed to fetch gallery items');
    }
    return response.json();
  },

  async uploadGalleryImage(file: File, caption?: string): Promise<MediaItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }

    const response = await fetch('/api/media/gallery/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload image');
    }

    return response.json();
  },

  async deleteGalleryImage(id: string): Promise<void> {
    const response = await fetch(`/api/media/gallery/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  },
};
