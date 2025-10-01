import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { MediaItem, mediaService } from '../api/media'

const GalleryPage = () => {
  const { t } = useTranslation()
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null)

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true)
        setError(null)
        const items = await mediaService.getGalleryItems()
        setMediaItems(items)
      } catch (err) {
        setError('Failed to load gallery images')
        console.error('Error fetching gallery:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchGallery()
  }, []) // Remove 't' dependency to prevent continuous requests

  const getImageUrl = (item: MediaItem) => {
    // Return the actual media URL - images are now properly served through nginx
    return item.url
  }

  return (
    <>
      <Helmet>
        <title>{t('gallery.title')} - Morocco Tourism</title>
        <meta name="description" content={t('gallery.subtitle')} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-moroccan-gold text-white section-padding">
          <div className="container-custom text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {t('gallery.title')}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {t('gallery.subtitle')}
            </p>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="section-padding">
          <div className="container-custom">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="aspect-square bg-gray-300 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 text-lg mb-4">{error}</div>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  {t('common.tryAgain')}
                </button>
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">{t('gallery.noImages')}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {mediaItems.map((item) => (
                  <div
                    key={item.id}
                    className="group cursor-pointer"
                    onClick={() => setSelectedImage(item)}
                  >
                    <div className="aspect-square overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <img
                        src={getImageUrl(item)}
                        alt={item.caption || 'Gallery image'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          console.error('Failed to load image:', item.url)
                        }}
                      />
                    </div>
                    {item.caption && (
                      <p className="mt-2 text-sm text-gray-600 text-center line-clamp-2">
                        {item.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="max-w-4xl max-h-full">
              <img
                src={getImageUrl(selectedImage)}
                alt={selectedImage.caption || 'Gallery image'}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              {selectedImage.caption && (
                <p className="text-white text-center mt-4 text-lg">
                  {selectedImage.caption}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>
        )}

        {/* Ad Space */}
        <section className="py-8 bg-white border-t">
          <div className="container-custom">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2">Advertisement</div>
              <div className="h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Photography Equipment Ad Space</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default GalleryPage