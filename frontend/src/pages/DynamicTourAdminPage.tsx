import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Calendar, MessageSquare, Settings as SettingsIcon, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import TourForm from '../components/TourForm'
import { toursService } from '../api/tours'
import type { Tour } from '../api/tours'
import { bookingsService, BookingResponse } from '../api/bookings'
import { messagingService, NotificationResponse } from '../api/messaging'
import LanguageManager from '../components/LanguageManager'

interface TourImage {
  image_url: string
  is_main: boolean
  display_order: number
  alt_text?: string
}

interface TourFormData {
  price: number
  duration: string
  max_participants: number
  difficulty_level: string
  tour_type: 'tour' | 'excursion'
  image_url: string
  images?: TourImage[]
  translations: Array<{
    language_code: string
    title: string
    description: string
    location: string
    itinerary: string
  }>
}

const DynamicTourAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tours' | 'bookings' | 'messages' | 'languages'>('tours')
  const [tours, setTours] = useState<Tour[]>([])
  const [bookings, setBookings] = useState<BookingResponse[]>([])
  const [messages, setMessages] = useState<NotificationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [editingTour, setEditingTour] = useState<Tour | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchTours()
  }, [])

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings()
    } else if (activeTab === 'messages') {
      fetchMessages()
    }
  }, [activeTab])

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true)
      const data = await bookingsService.getAllBookings()
      setBookings(data)
    } catch (error) {
      toast.error('Failed to fetch bookings')
      console.error('Error fetching bookings:', error)
    } finally {
      setBookingsLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true)
      const data = await messagingService.getAllNotifications()
      setMessages(data)
    } catch (error) {
      toast.error('Failed to fetch messages')
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const fetchTours = async () => {
    try {
      setLoading(true)
      const toursData = await toursService.getAllTours('en')
      setTours(toursData)
    } catch (error) {
      toast.error('Failed to fetch tours')
      console.error('Error fetching tours:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTour = async (data: TourFormData) => {
    try {
      // Debug logging
      console.log('📸 DynamicTourAdminPage received data:', data)
      console.log('📸 Images in data:', data.images)
      console.log('📸 Image URL in data:', data.image_url)
      
      // Prepare tour data for v2 API
      const tourData = {
        price: data.price,
        duration: data.duration,
        max_participants: data.max_participants,
        difficulty_level: data.difficulty_level,
        tour_type: data.tour_type,
        includes: [],
        available_dates: [],
        translations: data.translations,
        // Use images array if available, otherwise fall back to single image_url
        images: data.images && data.images.length > 0 
          ? data.images 
          : (data.image_url ? [{
              image_url: data.image_url,
              is_main: true,
              display_order: 0,
              alt_text: data.translations.find(t => t.language_code === 'en')?.title || ''
            }] : [])
      }

      console.log('📤 Sending to API:', tourData)
      console.log('📤 Images being sent:', tourData.images)

      await toursService.createTourDynamic(tourData)
      toast.success('Tour created successfully!')
      setShowAddForm(false)
      fetchTours()
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create tour'
      toast.error(errorMessage)
      console.error('Error creating tour:', error)
    }
  }

  const handleUpdateTour = async (data: TourFormData) => {
    if (!editingTour) return

    try {
      // Prepare tour data for v2 API
      const tourData = {
        price: data.price,
        duration: data.duration,
        max_participants: data.max_participants,
        difficulty_level: data.difficulty_level,
        tour_type: data.tour_type,
        includes: [],
        available_dates: [],
        translations: data.translations,
        // Use images array if available, otherwise fall back to single image_url
        images: data.images && data.images.length > 0 
          ? data.images 
          : (data.image_url ? [{
              image_url: data.image_url,
              is_main: true,
              display_order: 0,
              alt_text: data.translations.find(t => t.language_code === 'en')?.title || ''
            }] : [])
      }

      await toursService.updateTourDynamic(editingTour.id, tourData)
      toast.success('Tour updated successfully!')
      setEditingTour(null)
      fetchTours()
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update tour'
      toast.error(errorMessage)
      console.error('Error updating tour:', error)
    }
  }

  const handleEditTour = async (tour: Tour) => {
    try {
      // Fetch available languages for this tour using toursApi
      const langResponse = await toursService.getTourAvailableLanguages(tour.id)
      const availableLanguages = langResponse.available_languages || ['en']
      
      console.log('Fetching translations for languages:', availableLanguages)
      
      // Fetch tour data in all available languages
      const translations = []
      for (const lang of availableLanguages) {
        try {
          const tourData = await toursService.getTourById(tour.id, lang)
          translations.push({
            language_code: lang,
            title: tourData.title,
            description: tourData.description,
            location: tourData.location,
            itinerary: Array.isArray(tourData.includes) 
              ? tourData.includes.join('\n') 
              : (tourData.includes || '')
          })
        } catch (langError) {
          console.error(`Failed to fetch ${lang} translation:`, langError)
          // Continue with other languages
        }
      }
      
      // If no translations were fetched, use the tour data we have
      if (translations.length === 0) {
        translations.push({
          language_code: 'en',
          title: tour.title || '',
          description: tour.description || '',
          location: tour.location || '',
          itinerary: Array.isArray(tour.includes) 
            ? tour.includes.join('\n') 
            : (tour.includes || '')
        })
      }
      
      console.log('Fetched translations:', translations)
      
      // Create tour with all translations
      const tourWithTranslations = {
        ...tour,
        allTranslations: translations
      }
      
      setEditingTour(tourWithTranslations as any)
    } catch (error) {
      console.error('Error fetching tour translations:', error)
      toast.error('Failed to load tour translations')
      
      // Fallback: create minimal translation from tour data
      const fallbackTour = {
        ...tour,
        allTranslations: [{
          language_code: 'en',
          title: tour.title || '',
          description: tour.description || '',
          location: tour.location || '',
          itinerary: ''
        }]
      }
      setEditingTour(fallbackTour as any)
    }
  }

  const handleDeleteTour = async (tourId: string) => {
    if (!confirm('Are you sure you want to delete this tour?')) return

    try {
      await toursService.deleteTour(tourId)
      toast.success('Tour deleted successfully!')
      fetchTours()
    } catch (error) {
      toast.error('Failed to delete tour')
      console.error('Error deleting tour:', error)
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingTour(null)
  }

  // Convert tour data to form format for editing
  const convertTourToFormData = (tour: Tour & { allTranslations?: any[] }): TourFormData => {
    return {
      price: Number(tour.price),
      duration: tour.duration,
      max_participants: tour.max_participants,
      difficulty_level: tour.difficulty_level,
      tour_type: tour.tour_type || 'tour',
      image_url: tour.images?.[0]?.image_url || '',
      images: tour.images || [],
      // Use all translations if available, otherwise fallback to English only
      translations: tour.allTranslations || [
        {
          language_code: 'en',
          title: tour.title,
          description: tour.description,
          location: tour.location,
          itinerary: ''
        }
      ]
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage tours, bookings, messages, and languages</p>
          
          {/* Tab Navigation */}
          <div className="mt-6 flex space-x-1 bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('tours')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'tours'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Edit className="w-4 h-4" />
              Tours
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'bookings'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Bookings
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'messages'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Messages
            </button>
            <button
              onClick={() => setActiveTab('languages')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'languages'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              Languages
            </button>
          </div>
        </div>

        {/* Tours Tab */}
        {activeTab === 'tours' && (
          <>
            {!showAddForm && !editingTour && (
          <button
            onClick={() => setShowAddForm(true)}
            className="mb-6 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Tour
          </button>
        )}

        {showAddForm && (
          <TourForm
            onSubmit={handleAddTour}
            onCancel={handleCancel}
            submitText="Create Tour"
          />
        )}

        {editingTour && (
          <TourForm
            initialData={convertTourToFormData(editingTour)}
            onSubmit={handleUpdateTour}
            onCancel={handleCancel}
            submitText="Update Tour"
          />
        )}

        {!showAddForm && !editingTour && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tour
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Languages
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Loading tours...
                    </td>
                  </tr>
                ) : tours.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No tours found. Create your first tour!
                    </td>
                  </tr>
                ) : (
                  tours.map((tour) => (
                    <tr key={tour.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {tour.images?.[0] && (
                            <img
                              src={tour.images[0].image_url}
                              alt={tour.title}
                              className="w-12 h-12 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{tour.title}</div>
                            <div className="text-sm text-gray-500">{tour.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tour.price}€</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tour.duration}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tour.available_languages?.join(', ') || 'en'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditTour(tour)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTour(tour.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Bookings Management</h2>
            </div>
            {bookingsLoading ? (
              <div className="p-6 text-center text-gray-500">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No bookings yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{booking.tour_id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{booking.customer_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(booking.start_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{booking.total_price}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Messages & Notifications</h2>
            </div>
            {messagesLoading ? (
              <div className="p-6 text-center text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No messages yet</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {messages.map((message) => (
                  <div key={message.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{message.recipient}</p>
                        <p className="text-sm text-gray-500 mt-1">{message.message}</p>
                        <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                          message.status === 'sent' ? 'bg-green-100 text-green-800' :
                          message.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {message.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Languages Tab */}
        {activeTab === 'languages' && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
            <LanguageManager />
          </div>
        )}
      </div>
    </div>
  )
}

export default DynamicTourAdminPage
