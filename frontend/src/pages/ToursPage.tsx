import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import TourCard from '../components/TourCard'
import SEO from '../components/SEO'
import { Tour, toursService } from '../api/tours'

const ToursPage = () => {
  const { t } = useTranslation()
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true)
        setError(null)
        const toursData = await toursService.getAllTours()
        setTours(toursData)
      } catch (err) {
        setError(t('tours.error'))
        console.error('Error fetching tours:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTours()
  }, [t])

  // Structured Data for Tours List
  const toursListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Morocco Tours",
    "description": "Browse our collection of authentic Morocco tours and desert adventures",
    "numberOfItems": tours.length,
    "itemListElement": tours.slice(0, 10).map((tour, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": tour.title,
        "description": tour.description,
        "offers": {
          "@type": "Offer",
          "price": tour.price,
          "priceCurrency": "EUR"
        }
      }
    }))
  }

  return (
    <>
      <SEO
        title="Morocco Tours & Desert Tour Packages"
        description="Explore Morocco with our authentic guided tours. Sahara desert tours from Marrakech, Fes tours, Atlas Mountains adventures, camel trekking. Book your Morocco tour package today!"
        keywords="Morocco tours, Morocco tour packages, Sahara desert tour, Marrakech tours, Fes tours, Morocco desert tours, Morocco guided tours, Morocco private tours, Morocco camel trekking, Atlas Mountains tours, Morocco adventure tours, Morocco cultural tours"
        structuredData={toursListSchema}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-moroccan-blue text-white section-padding">
          <div className="container-custom text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {t('tours.title')}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {t('tours.subtitle')}
            </p>
          </div>
        </section>

        {/* Tours Grid */}
        <section className="section-padding">
          <div className="container-custom">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-48 bg-gray-300" />
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-gray-300 rounded" />
                      <div className="h-4 bg-gray-300 rounded w-3/4" />
                      <div className="h-4 bg-gray-300 rounded w-1/2" />
                      <div className="flex space-x-2">
                        <div className="h-10 bg-gray-300 rounded flex-1" />
                        <div className="h-10 bg-gray-300 rounded flex-1" />
                      </div>
                    </div>
                  </div>
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
            ) : tours.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">{t('tours.noTours')}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Ad Space */}
        <section className="py-8 bg-white">
          <div className="container-custom">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2">Advertisement</div>
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Banner Ad Space</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default ToursPage