import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Upload, Image, BarChart3, Calendar, Eye, EyeOff, CheckCircle, XCircle, Clock, Mail, MessageSquare, Star, Settings, Tag, Users } from 'lucide-react'
import { toursApi } from '../api/config'
import { bookingsService, BookingResponse } from '../api/bookings'
import { messagingService, NotificationResponse } from '../api/messaging'
import toast from 'react-hot-toast'
import MultiImageTourForm from '../components/MultiImageTourForm'
import TourForm from '../components/TourForm'
import GroupPricingManager from '../components/GroupPricingManager'
import TagManager from '../components/TagManager'
import TourInfoSectionsManager from '../components/TourInfoSectionsManager'
import LanguageManager from '../components/LanguageManager'

interface TourImage {
  id?: string
  image_url: string
  is_main: boolean
  display_order: number
  alt_text?: string
}

interface Tour {
  id: string
  title: string
  description: string
  price: number
  duration: string
  location: string
  max_participants: number
  difficulty_level: string
  includes: string[]
  available_dates: string[]
  images: TourImage[]
}

interface TourFormData {
  title: string
  description: string
  price: number
  duration: string
  location: string
  max_participants: number
  difficulty_level: string
  includes: string
  available_dates: string
  images: TourImage[]
}

interface MediaItem {
  id: string
  url: string
  caption?: string
  file_size: number
  mime_type: string
  filename: string
  created_at: string
}

interface MediaStats {
  total_items: number
  storage_used: number
  storage_available: number
}

const AdminPage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'tours' | 'gallery' | 'bookings' | 'messages' | 'settings' | 'languages'>('tours')
  const [selectedTourForSettings, setSelectedTourForSettings] = useState<Tour | null>(null)
  const [tours, setTours] = useState<Tour[]>([])
  const [bookings, setBookings] = useState<BookingResponse[]>([])
  const [messages, setMessages] = useState<NotificationResponse[]>([])
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [mediaStats, setMediaStats] = useState<MediaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [mediaLoading, setMediaLoading] = useState(false)
  const [editingTour, setEditingTour] = useState<Tour | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [useMultilingual, setUseMultilingual] = useState(true)
  const [uploadingMedia, setUploadingMedia] = useState(false)


  useEffect(() => {
    fetchTours()
  }, [])

  useEffect(() => {
    if (activeTab === 'gallery') {
      fetchMediaItems()
      fetchMediaStats()
    } else if (activeTab === 'bookings') {
      fetchBookings()
    } else if (activeTab === 'messages') {
      fetchMessages()
    }
  }, [activeTab])

  const fetchTours = async () => {
    try {
      const response = await toursApi.get('/tours')
      setTours(response.data)
    } catch (error) {
      toast.error('Failed to fetch tours')
      console.error('Error fetching tours:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMediaItems = async () => {
    setMediaLoading(true)
    try {
      // Use API proxy for both development and production when running in Docker
      const baseUrl = '/api/media'
      const response = await fetch(`${baseUrl}/gallery`)
      if (!response.ok) throw new Error('Failed to fetch media items')
      const data = await response.json()
      setMediaItems(data)
    } catch (error) {
      toast.error('Failed to fetch gallery items')
      console.error('Error fetching media items:', error)
    } finally {
      setMediaLoading(false)
    }
  }

  const fetchMediaStats = async () => {
    try {
      const baseUrl = '/api/media'
      const response = await fetch(`${baseUrl}/stats`)
      if (!response.ok) throw new Error('Failed to fetch media stats')
      const data = await response.json()
      setMediaStats(data)
    } catch (error) {
      console.error('Error fetching media stats:', error)
    }
  }

  const fetchBookings = async () => {
    setBookingsLoading(true)
    try {
      const bookingsData = await bookingsService.getAllBookings()
      // Sort by created_at descending (newest first)
      const sortedBookings = bookingsData.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setBookings(sortedBookings)
    } catch (error) {
      toast.error('Failed to fetch bookings')
      console.error('Error fetching bookings:', error)
    } finally {
      setBookingsLoading(false)
    }
  }

  const fetchMessages = async () => {
    setMessagesLoading(true)
    try {
      const messagesData = await messagingService.getAllNotifications()
      // Sort by created_at descending (newest first)
      const sortedMessages = messagesData.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setMessages(sortedMessages)
    } catch (error) {
      toast.error('Failed to fetch messages')
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }



  const handleAddTour = async (data: TourFormData) => {
    try {
      const tourData = {
        ...data,
        includes: data.includes.split(',').map(item => item.trim()).filter(item => item),
        available_dates: data.available_dates.split(',').map(date => date.trim()).filter(date => date),
        images: data.images.map(img => ({
          image_url: img.image_url,
          is_main: img.is_main,
          display_order: img.display_order,
          alt_text: img.alt_text
        }))
      }

      await toursApi.post('/tours', tourData)
      toast.success('Tour added successfully!')
      setShowAddForm(false)
      fetchTours()
    } catch (error) {
      toast.error('Failed to add tour')
      console.error('Error adding tour:', error)
    }
  }

  const handleAddMultilingualTour = async (data: any) => {
    try {
      const tourData = {
        price: data.price,
        duration: data.duration,
        max_participants: data.max_participants,
        difficulty_level: data.difficulty_level,
        tour_type: data.tour_type,
        includes: [], // Empty array - managed through tags
        available_dates: [], // Empty array - managed through availability system
        translations: data.translations,
        // Use images array if available, otherwise fall back to single image_url
        images: data.images && data.images.length > 0 
          ? data.images 
          : (data.image_url ? [{
              image_url: data.image_url,
              is_main: true,
              display_order: 0,
              alt_text: data.translations[0]?.title || 'Tour image'
            }] : [])
      }

      await toursApi.post('/tours/v2', tourData)
      toast.success('Tour created successfully with multiple languages!')
      setShowAddForm(false)
      fetchTours()
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to create tour'
      toast.error(errorMessage)
      console.error('Error creating tour:', error)
    }
  }

  const handleEditTour = (tour: Tour) => {
    setEditingTour(tour)
  }

  const handleUpdateTour = async (data: TourFormData) => {
    if (!editingTour) return

    try {
      const tourData = {
        ...data,
        includes: data.includes.split(',').map(item => item.trim()).filter(item => item),
        available_dates: data.available_dates.split(',').map(date => date.trim()).filter(date => date),
        images: data.images.map(img => ({
          image_url: img.image_url,
          is_main: img.is_main,
          display_order: img.display_order,
          alt_text: img.alt_text
        }))
      }

      await toursApi.put(`/tours/${editingTour.id}`, tourData)
      toast.success('Tour updated successfully!')
      setEditingTour(null)
      fetchTours()
    } catch (error) {
      toast.error('Failed to update tour')
      console.error('Error updating tour:', error)
    }
  }

  const handleDeleteTour = async (tourId: string) => {
    if (!confirm('Are you sure you want to delete this tour?')) return

    try {
      await toursApi.delete(`/tours/${tourId}`)
      toast.success('Tour deleted successfully!')
      fetchTours()
    } catch (error) {
      toast.error('Failed to delete tour')
      console.error('Error deleting tour:', error)
    }
  }

  const handleCancel = useCallback(() => {
    setShowAddForm(false)
    setEditingTour(null)
  }, [])

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploadingMedia(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const caption = prompt('Enter a caption for this image (optional):')
      if (caption) {
        formData.append('caption', caption)
      }

      const baseUrl = '/api/media'
      const response = await fetch(`${baseUrl}/gallery/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Upload failed')
      }

      toast.success('Image uploaded successfully!')
      fetchMediaItems()
      fetchMediaStats()
    } catch (error) {
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Error uploading media:', error)
    } finally {
      setUploadingMedia(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleDeleteMedia = async (mediaId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return

    try {
      const baseUrl = '/api/media'
      const response = await fetch(`${baseUrl}/gallery/${mediaId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Delete failed')
      }

      toast.success('Image deleted successfully!')
      fetchMediaItems()
      fetchMediaStats()
    } catch (error) {
      toast.error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Error deleting media:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleMarkAsViewed = async (bookingId: string) => {
    try {
      await bookingsService.markAsViewed(bookingId)
      // Update local state
      setBookings(prev => prev.map(booking =>
        booking.id === bookingId
          ? { ...booking, admin_viewed: true }
          : booking
      ))
      toast.success('Booking marked as viewed')
    } catch (error) {
      toast.error('Failed to mark booking as viewed')
      console.error('Error marking booking as viewed:', error)
    }
  }

  const handleUpdateBookingStatus = async (bookingId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await bookingsService.updateBookingStatus(bookingId, status)
      // Update local state
      setBookings(prev => prev.map(booking =>
        booking.id === bookingId
          ? { ...booking, status }
          : booking
      ))
      toast.success(`Booking ${status} successfully`)
    } catch (error) {
      toast.error(`Failed to ${status} booking`)
      console.error('Error updating booking status:', error)
    }
  }

  const handleCompleteBooking = async (bookingId: string) => {
    if (!confirm('Mark this booking as completed? This will send a review request to the customer.')) {
      return
    }

    try {
      const result = await bookingsService.completeBooking(bookingId)

      // Update local state
      setBookings(prev => prev.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'completed' }
          : booking
      ))

      toast.success('Booking completed and review request sent!')
      console.log('Review token:', result.review_token)
    } catch (error) {
      toast.error('Failed to complete booking')
      console.error('Error completing booking:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'completed':
        return <Star className="w-4 h-4 text-blue-600" />
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard v2.0</h1>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('tours')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'tours'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Edit className="w-4 h-4 inline mr-2" />
              Tours
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'bookings'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Bookings
              {bookings.filter(b => !b.admin_viewed).length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {bookings.filter(b => !b.admin_viewed).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'messages'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Messages
              {messages.filter(m => m.status === 'failed').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {messages.filter(m => m.status === 'failed').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('languages')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'languages'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Languages
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'settings'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Settings
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'gallery'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Image className="w-4 h-4 inline mr-2" />
              Gallery
            </button>
          </div>
        </div>

        {/* Tours Management */}
        {activeTab === 'tours' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Tour Management</h2>
              <div className="flex items-center gap-3">
                {showAddForm && (
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={useMultilingual}
                      onChange={(e) => setUseMultilingual(e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span>Multilingual (EN/FR)</span>
                  </label>
                )}
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Tour
                </button>
              </div>
            </div>

            {showAddForm && (
              useMultilingual ? (
                <TourForm
                  onSubmit={handleAddMultilingualTour}
                  onCancel={handleCancel}
                  submitText="Create Tour"
                />
              ) : (
                <MultiImageTourForm
                  mode="add"
                  onSubmit={handleAddTour}
                  onCancel={handleCancel}
                  multilingual={false}
                />
              )
            )}

            {editingTour && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-800 mb-3">
                  <strong>Editing Tour:</strong> {editingTour.title}
                </p>
                <p className="text-sm text-blue-700 mb-4">
                  To edit this tour with multiple language support, please use the dedicated edit page or API.
                  The current interface supports creating new tours with multiple languages.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <a
                    href={`/admin/tours/${editingTour.id}/edit`}
                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 inline-block"
                  >
                    Edit with Full Language Support
                  </a>
                </div>
              </div>
            )}

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tour
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tours.map((tour) => (
                    <tr key={tour.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={tour.images?.find(img => img.is_main)?.image_url || tour.images?.[0]?.image_url || '/api/placeholder/40/40'}
                            alt={tour.title}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{tour.title}</div>
                            <div className="text-sm text-gray-500">{tour.difficulty_level}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tour.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{Number.isInteger(Number(tour.price)) ? Math.floor(Number(tour.price)) : Number(tour.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tour.duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditTour(tour)}
                          className="text-orange-600 hover:text-orange-900 mr-3"
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
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Bookings Management */}
        {activeTab === 'bookings' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Bookings Management</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {bookings.length} total bookings
                </span>
                <span className="flex items-center gap-1">
                  <EyeOff className="w-4 h-4" />
                  {bookings.filter(b => !b.admin_viewed).length} unviewed
                </span>
              </div>
            </div>

            {bookingsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading bookings...</p>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tour & Dates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participants & Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => {
                      const tour = tours.find(t => t.id === booking.tour_id)
                      return (
                        <tr key={booking.id} className={!booking.admin_viewed ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {!booking.admin_viewed && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.customer_name}
                                </div>
                                <div className="text-sm text-gray-500">{booking.email}</div>
                                {booking.phone && (
                                  <div className="text-sm text-gray-500">{booking.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {tour?.title || 'Unknown Tour'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.start_date && booking.end_date ? (
                                <>
                                  {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                                  <div className="text-xs text-gray-400">
                                    {Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                                  </div>
                                </>
                              ) : (
                                booking.travel_date ? new Date(booking.travel_date).toLocaleDateString() : 'No date'
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {booking.number_of_participants || 1} participant{(booking.number_of_participants || 1) > 1 ? 's' : ''}
                            </div>
                            <div className="text-sm text-gray-500">
                              €{booking.price_per_person || '0'}/day
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              Total: €{booking.total_price || '0'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1 capitalize">{booking.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {!booking.admin_viewed && (
                                <button
                                  onClick={() => handleMarkAsViewed(booking.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Mark as viewed"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}

                              {booking.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                    className="text-green-600 hover:text-green-900"
                                    title="Confirm booking"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                    className="text-red-600 hover:text-red-900"
                                    title="Cancel booking"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {booking.status === 'confirmed' && (
                                <>
                                  <button
                                    onClick={() => handleCompleteBooking(booking.id)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Mark as completed (sends review request)"
                                  >
                                    <Star className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                    className="text-red-600 hover:text-red-900"
                                    title="Cancel booking"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {booking.status === 'cancelled' && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Reconfirm booking"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {bookings.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No bookings yet</p>
                    <p className="text-sm text-gray-400">Bookings will appear here when customers make reservations</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Messages Management */}
        {activeTab === 'messages' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Messages & Notifications</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {messages.length} total messages
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {messages.filter(m => m.status === 'sent').length} sent
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  {messages.filter(m => m.status === 'failed').length} failed
                </span>
              </div>
            </div>

            {messagesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading messages...</p>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type & Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject & Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {messages.map((message) => (
                      <tr key={message.id} className={message.status === 'failed' ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Mail className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {message.type}
                              </div>
                              <div className="text-sm text-gray-500">{message.recipient}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">
                            {message.subject || 'No Subject'}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {message.message}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${message.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : message.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {message.status === 'sent' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {message.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                            {message.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            <span className="capitalize">{message.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{new Date(message.created_at).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </div>
                          {message.sent_at && (
                            <div className="text-xs text-green-600">
                              Sent: {new Date(message.sent_at).toLocaleTimeString()}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No messages yet</p>
                    <p className="text-sm text-gray-400">Messages and notifications will appear here</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Gallery Management */}
        {activeTab === 'gallery' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Gallery Management</h2>
              <div className="flex items-center gap-4">
                {mediaStats && (
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      {mediaStats.total_items} images
                    </span>
                    <span>Storage: {formatFileSize(mediaStats.storage_used)}</span>
                  </div>
                )}
                <label className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {uploadingMedia ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMediaUpload}
                    disabled={uploadingMedia}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {mediaLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading gallery...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {mediaItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="aspect-w-16 aspect-h-12">
                      <img
                        src={item.url}
                        alt={item.caption || item.filename}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.caption || item.filename}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(item.file_size)} • {item.mime_type}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                      <div className="mt-3 flex justify-between items-center">
                        <button
                          onClick={() => navigator.clipboard.writeText(item.url)}
                          className="text-xs text-orange-600 hover:text-orange-800"
                        >
                          Copy URL
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(item.id, item.filename)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!mediaLoading && mediaItems.length === 0 && (
              <div className="text-center py-12">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No images in gallery yet</p>
                <p className="text-sm text-gray-400">Upload your first image to get started</p>
              </div>
            )}
          </>
        )}

        {/* Languages Management */}
        {activeTab === 'languages' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Language Management</h2>
            </div>
            <LanguageManager />
          </div>
        )}

        {/* Settings Tab - Tour Pricing & Tags */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Tour Settings</h2>
            </div>

            {/* Tour Selector */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tour to Manage
              </label>
              <select
                value={selectedTourForSettings?.id || ''}
                onChange={(e) => {
                  const tour = tours.find(t => t.id === e.target.value)
                  setSelectedTourForSettings(tour || null)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-moroccan-terracotta focus:border-transparent"
              >
                <option value="">-- Select a tour --</option>
                {tours.map((tour) => (
                  <option key={tour.id} value={tour.id}>
                    {tour.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedTourForSettings && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Group Pricing Manager */}
                  <GroupPricingManager
                    tourId={selectedTourForSettings.id}
                    tourTitle={selectedTourForSettings.title}
                  />

                  {/* Tag Manager for Tour */}
                  <TagManager
                    tourId={selectedTourForSettings.id}
                    tourTitle={selectedTourForSettings.title}
                    mode="tour"
                  />
                </div>

                {/* Tour Info Sections Manager */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                  <TourInfoSectionsManager tourId={selectedTourForSettings.id} />
                </div>
              </>
            )}

            {/* Global Tag Manager */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Tag Management</h3>
              <TagManager mode="global" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage
