import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Tour } from '../api/tours'
import { Language, languagesService } from '../api/languages'

interface TourCardProps {
  tour: Tour
  showBookButton?: boolean
}

const TourCard = ({ tour, showBookButton = true }: TourCardProps) => {
  const { t } = useTranslation()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [languages, setLanguages] = useState<Language[]>([])

  // Fetch languages to get flag emojis
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const langs = await languagesService.getActiveLanguages()
        setLanguages(langs)
      } catch (error) {
        console.error('Error fetching languages:', error)
      }
    }
    fetchLanguages()
  }, [])

  // Get all images or use placeholder
  const images = tour.images && tour.images.length > 0 
    ? tour.images 
    : [{ image_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop&auto=format', alt_text: tour.title }]

  const nextImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Handle touch/swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextImage()
    }
    if (isRightSwipe) {
      prevImage()
    }

    // Reset
    setTouchStart(0)
    setTouchEnd(0)
  }

  // Handle mouse drag for desktop
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setTouchEnd(e.clientX)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const distance = dragStart - (touchEnd || e.clientX)
    const isLeftDrag = distance > 50
    const isRightDrag = distance < -50

    if (isLeftDrag) {
      nextImage()
    }
    if (isRightDrag) {
      prevImage()
    }

    setIsDragging(false)
    setDragStart(0)
    setTouchEnd(0)
  }

  return (
    <Link to={`/tours/${tour.id}`} className="card group block hover:shadow-xl transition-shadow duration-300">
      {/* Image Slider */}
      <div 
        className="relative h-48 overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={(e) => {
          // Prevent navigation when clicking on image slider
          e.preventDefault()
          e.stopPropagation()
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDragging) {
            setIsDragging(false)
            setDragStart(0)
            setTouchEnd(0)
          }
        }}
      >
        <img
          src={images[currentImageIndex].image_url}
          alt={images[currentImageIndex].alt_text || tour.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop&auto=format'
          }}
          draggable={false}
        />

        {/* Navigation Arrows - Show only if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>

            {/* Image indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    index === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>

            {/* Image count */}
            <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
              {currentImageIndex + 1}/{images.length}
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {tour.title}
        </h3>

        {/* Language Availability Indicators */}
        <div className="flex items-center gap-2 mb-2">
          {tour.available_languages && tour.available_languages.length > 0 && (
            <div className="flex items-center gap-1">
              {tour.available_languages.map((langCode) => {
                const language = languages.find(l => l.code === langCode)
                return language ? (
                  <span
                    key={langCode}
                    className="text-lg"
                    title={`Available in ${language.name}`}
                  >
                    {language.flag_emoji}
                  </span>
                ) : null
              })}
            </div>
          )}
          
          {/* Fallback Badge */}
          {tour.is_fallback && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
              {t('tours.translatedFromEnglish', 'Translated from English')}
            </span>
          )}
        </div>

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
            <span>From €{Number.isInteger(Number(tour.price)) ? Math.floor(Number(tour.price)) : Number(tour.price).toFixed(2)} per person</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Link
            to={`/tours/${tour.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-center py-2 px-4 border border-moroccan-terracotta text-moroccan-terracotta hover:bg-moroccan-terracotta hover:text-white rounded-lg transition-colors duration-200"
          >
            {t('tours.viewDetails')}
          </Link>

          {showBookButton && (
            <Link
              to={`/booking?tour=${tour.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-center btn-primary"
            >
              {t('tours.bookNow')}
            </Link>
          )}
        </div>
      </div>
    </Link>
  )
}

export default TourCard