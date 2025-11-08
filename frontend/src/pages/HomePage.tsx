import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Star, Users, Shield } from 'lucide-react'
import TourCard from '../components/TourCard'
import SEO from '../components/SEO'
import { Tour, toursService } from '../api/tours'

const HomePage = () => {
  const { t, i18n } = useTranslation()
  const [featuredTours, setFeaturedTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [currentHeroImage, setCurrentHeroImage] = useState(0)

  // Hero images for slider
  const heroImages = [
    {
      url: 'https://images.pexels.com/photos/943510/pexels-photo-943510.jpeg',
      alt: 'Morocco Landscape'
    },
    {
      url: 'https://images.pexels.com/photos/30710070/pexels-photo-30710070.jpeg',
      alt: 'Moroccan Architecture'
    },
    {
      url: 'https://images.pexels.com/photos/1703312/pexels-photo-1703312.jpeg',
      alt: 'Desert Adventure'
    },
    {
      url: 'https://images.pexels.com/photos/32880206/pexels-photo-32880206.jpeg',
      alt: 'Moroccan Culture'
    }
  ]

  useEffect(() => {
    const fetchFeaturedTours = async () => {
      try {
        // Extract language code from i18n (e.g., 'en-US' -> 'en')
        const currentLang = i18n.language.split('-')[0].toLowerCase()
        const tours = await toursService.getFeaturedTours(currentLang)
        setFeaturedTours(tours)
      } catch (error) {
        console.error('Error fetching featured tours:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedTours()
  }, [i18n.language])

  // Auto-advance hero slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length)
    }, 3000) // Change image every 3 seconds

    return () => clearInterval(interval)
  }, [heroImages.length])

  const nextHeroImage = () => {
    setCurrentHeroImage((prev) => (prev + 1) % heroImages.length)
  }

  const prevHeroImage = () => {
    setCurrentHeroImage((prev) => (prev - 1 + heroImages.length) % heroImages.length)
  }

  const features = [
    {
      icon: Star,
      title: t('home.why.authentic.title'),
      description: t('home.why.authentic.description')
    },
    {
      icon: Users,
      title: t('home.why.comfort.title'),
      description: t('home.why.comfort.description')
    },
    {
      icon: Shield,
      title: t('home.why.support.title'),
      description: t('home.why.support.description')
    }
  ]

  // Structured Data for Organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "Morocco Tours",
    "description": "Authentic Morocco tours and Sahara desert adventures. Experience the magic of Morocco with our guided tours.",
    "url": window.location.origin,
    "telephone": "+212661708973",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "MA",
      "addressLocality": "Marrakech"
    },
    "priceRange": "€€",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "150"
    }
  }

  return (
    <>
      <SEO
        title="Morocco Tours & Sahara Desert Adventures"
        description="Discover authentic Morocco tours from Marrakech. Sahara desert tours, Atlas Mountains adventures, cultural experiences. Book your Morocco tour package today! Best prices guaranteed."
        keywords="Morocco tours, Sahara desert tour, Morocco tour packages, Marrakech tours, Morocco desert tours, tours to Morocco, Morocco travel, Morocco vacation, Morocco guided tours, Morocco camel trekking, Atlas Mountains tours, Morocco adventure tours"
        structuredData={organizationSchema}
      />

      {/* Hero Section with Slider */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Slider */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentHeroImage ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Slider Navigation */}
        <button
          onClick={prevHeroImage}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-200"
          aria-label="Previous image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextHeroImage}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-200"
          aria-label="Next image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Slider Indicators */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentHeroImage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentHeroImage ? 'bg-white w-8' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-shadow">
            {t('home.hero.title')}
          </h1>
          <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto text-shadow">
            {t('home.hero.subtitle')}
          </p>
          <Link
            to="/tours"
            className="inline-flex items-center space-x-2 btn-primary text-lg px-8 py-4"
          >
            <span>{t('home.hero.cta')}</span>
            <ArrowRight size={20} />
          </Link>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Featured Tours Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('home.featured.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('home.featured.subtitle')}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-48 bg-gray-300" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-gray-300 rounded" />
                    <div className="h-4 bg-gray-300 rounded w-3/4" />
                    <div className="h-4 bg-gray-300 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/tours"
              className="inline-flex items-center space-x-2 btn-secondary"
            >
              <span>View All Tours</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-padding bg-moroccan-sand">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('home.why.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 moroccan-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding moroccan-gradient">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready for Your Moroccan Adventure?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who have discovered the magic of Morocco with us
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/tours"
              className="bg-white text-moroccan-terracotta hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Browse Tours
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-moroccan-terracotta font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Ad Space */}
      <section className="py-8 bg-gray-100">
        <div className="container-custom">
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-2">Advertisement</div>
            <div className="h-24 bg-white rounded-lg shadow flex items-center justify-center">
              <span className="text-gray-400">Google Ads / Meta Ads Space</span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default HomePage