import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, DollarSign } from 'lucide-react'
import { Tour } from '../api/tours'

interface TourCardProps {
  tour: Tour
  showBookButton?: boolean
}

const TourCard = ({ tour, showBookButton = true }: TourCardProps) => {
  const { t } = useTranslation()

  // Get main image or first image, fallback to placeholder
  const mainImage = tour.images?.find(img => img.is_main) || tour.images?.[0]
  const imageUrl = mainImage?.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop&auto=format'

  return (
    <div className="card group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={mainImage?.alt_text || tour.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback to a placeholder if image fails to load
            const target = e.target as HTMLImageElement
            target.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop&auto=format'
          }}
        />
        
        {/* Image count indicator for multiple images */}
        {tour.images && tour.images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs">
            {tour.images.length} photos
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {tour.title}
        </h3>
        
        <div 
          className="text-gray-600 mb-4 line-clamp-3"
          dangerouslySetInnerHTML={{ 
            __html: tour.description.replace(/<[^>]*>/g, ' ').substring(0, 150) + '...' 
          }}
        />

        {/* Tour Details */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1 text-gray-500">
            <Clock size={16} />
            <span className="text-sm">{tour.duration}</span>
          </div>
          <div className="flex items-center space-x-1 text-moroccan-terracotta font-semibold">
            <span>From €{tour.price}/person</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Link
            to={`/tours/${tour.id}`}
            className="flex-1 text-center py-2 px-4 border border-moroccan-terracotta text-moroccan-terracotta hover:bg-moroccan-terracotta hover:text-white rounded-lg transition-colors duration-200"
          >
            {t('tours.viewDetails')}
          </Link>
          
          {showBookButton && (
            <Link
              to={`/booking?tour=${tour.id}`}
              className="flex-1 text-center btn-primary"
            >
              {t('tours.bookNow')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default TourCard