import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { Tour, toursService } from '../api/tours'
import TourCard from '../components/TourCard'

const ExcursionsPage = () => {
  const { t, i18n } = useTranslation()
  const [excursions, setExcursions] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExcursions = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get current language code
        const currentLang = i18n.language.split('-')[0]
        
        // Fetch only excursions
        const data = await toursService.getTours(currentLang, 'excursion')
        setExcursions(data)
      } catch (err) {
        setError(t('excursions.error') || 'Failed to load excursions')
        console.error('Error fetching excursions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchExcursions()
  }, [t, i18n.language])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moroccan-terracotta mx-auto mb-4"></div>
          <p className="text-gray-600">{t('excursions.loading') || 'Loading excursions...'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            {t('common.tryAgain') || 'Try Again'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{t('excursions.title') || 'Day Excursions'} - Morocco Tourism</title>
        <meta name="description" content={t('excursions.description') || 'Discover amazing day trips and excursions in Morocco'} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-moroccan-terracotta to-moroccan-orange text-white py-16">
          <div className="container-custom">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                🎯 {t('excursions.heroTitle') || 'Day Excursions'}
              </h1>
              <p className="text-xl text-white/90">
                {t('excursions.heroSubtitle') || 'Explore Morocco with our carefully curated day trips and short excursions'}
              </p>
            </div>
          </div>
        </section>

        {/* Excursions Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {excursions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  {t('excursions.noExcursions') || 'No excursions available at the moment.'}
                </p>
                <p className="text-gray-500 mt-2">
                  {t('excursions.checkBackLater') || 'Please check back later for new day trips!'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('excursions.availableExcursions') || 'Available Excursions'}
                  </h2>
                  <p className="text-gray-600">
                    {excursions.length} {excursions.length === 1 ? t('excursions.excursion') || 'excursion' : t('excursions.excursions') || 'excursions'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {excursions.map((excursion) => (
                    <TourCard key={excursion.id} tour={excursion} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 bg-white">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t('excursions.whyChooseTitle') || 'Why Choose Our Excursions?'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="p-6">
                  <div className="text-4xl mb-3">⏱️</div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t('excursions.flexibleTitle') || 'Flexible Duration'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {t('excursions.flexibleDesc') || 'Perfect for travelers with limited time'}
                  </p>
                </div>
                <div className="p-6">
                  <div className="text-4xl mb-3">💰</div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t('excursions.affordableTitle') || 'Affordable Prices'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {t('excursions.affordableDesc') || 'Great value day trips for all budgets'}
                  </p>
                </div>
                <div className="p-6">
                  <div className="text-4xl mb-3">🎯</div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t('excursions.focusedTitle') || 'Focused Experience'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {t('excursions.focusedDesc') || 'Discover specific attractions in depth'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default ExcursionsPage
