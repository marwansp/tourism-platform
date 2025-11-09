import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toursApi } from '../api/config'
import { languagesService } from '../api/languages'
import TourForm from '../components/TourForm'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

interface TourTranslation {
  language_code: string
  title: string
  description: string
  location: string
  itinerary: string
}

interface TourImage {
  image_url: string
  is_main: boolean
  display_order: number
  alt_text?: string
}

interface TourData {
  price: number
  duration: string
  max_participants: number
  difficulty_level: string
  tour_type: 'tour' | 'excursion'
  image_url: string
  images?: TourImage[]
  translations: TourTranslation[]
}

const EditTourPage: React.FC = () => {
  const { tourId } = useParams<{ tourId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tourData, setTourData] = useState<TourData | null>(null)
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([])

  useEffect(() => {
    const fetchTourData = async () => {
      if (!tourId) return

      try {
        setLoading(true)

        // Fetch available languages for this tour
        const langResponse = await toursApi.get(`/tours/${tourId}/available-languages`)
        const languages = langResponse.data.available_languages
        console.log('EditTourPage - Available languages from API:', languages)
        setAvailableLanguages(languages)

        // Fetch tour data in all available languages
        const translations: TourTranslation[] = []
        let tourInfo: any = null

        for (const lang of languages) {
          console.log('EditTourPage - Fetching tour for language:', lang)
          const response = await toursApi.get(`/tours/${tourId}`, {
            params: { lang }
          })
          const tour = response.data
          console.log('EditTourPage - Received tour data for', lang, ':', tour.title)

          if (!tourInfo) {
            tourInfo = tour
          }

          translations.push({
            language_code: lang,
            title: tour.title,
            description: tour.description,
            location: tour.location,
            itinerary: Array.isArray(tour.includes) 
              ? tour.includes.join('\n') 
              : (tour.includes || '')
          })
        }

        const tourDataToSet = {
          price: tourInfo.price,
          duration: tourInfo.duration,
          max_participants: tourInfo.max_participants,
          difficulty_level: tourInfo.difficulty_level,
          tour_type: tourInfo.tour_type || 'tour',
          image_url: tourInfo.images?.[0]?.image_url || '',
          images: tourInfo.images || [],
          translations
        }
        
        console.log('EditTourPage - Setting tour data:', tourDataToSet)
        console.log('EditTourPage - Translations count:', translations.length)
        console.log('EditTourPage - Languages:', translations.map(t => t.language_code))
        
        setTourData(tourDataToSet)

        setLoading(false)
      } catch (error) {
        console.error('Error fetching tour:', error)
        toast.error('Failed to load tour data')
        setLoading(false)
      }
    }

    fetchTourData()
  }, [tourId])

  const handleSubmit = async (data: any) => {
    try {
      // Clean images array - only keep fields expected by TourImageCreate schema
      const cleanImages = data.images && data.images.length > 0 
        ? data.images.map((img: any) => ({
            image_url: img.image_url,
            is_main: img.is_main,
            display_order: img.display_order,
            alt_text: img.alt_text || ''
          }))
        : (data.image_url ? [{
            image_url: data.image_url,
            is_main: true,
            display_order: 0,
            alt_text: data.translations[0]?.title || 'Tour image'
          }] : undefined)

      const updateData = {
        price: data.price,
        duration: data.duration,
        max_participants: data.max_participants,
        difficulty_level: data.difficulty_level,
        tour_type: data.tour_type,
        includes: [], // Empty array - managed through tags
        available_dates: [], // Empty array - managed through availability system
        translations: data.translations,
        images: cleanImages
      }

      await toursApi.put(`/tours/v2/${tourId}`, updateData)
      toast.success('Tour updated successfully!')
      navigate('/admin')
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to update tour'
      toast.error(errorMessage)
      console.error('Error updating tour:', error)
    }
  }

  const handleCancel = () => {
    navigate('/admin')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tour data...</p>
        </div>
      </div>
    )
  }

  if (!tourData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load tour data</p>
          <button
            onClick={() => navigate('/admin')}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
          >
            Back to Admin
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Tour</h1>
          <p className="text-gray-600 mt-2">
            Update tour information and translations
          </p>
        </div>

        <TourForm
          initialData={tourData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitText="Update Tour"
        />
      </div>
    </div>
  )
}

export default EditTourPage
