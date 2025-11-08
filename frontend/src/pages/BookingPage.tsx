import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Calendar, User, Mail, Phone } from 'lucide-react'
import { Tour, toursService } from '../api/tours'
import { BookingRequest, bookingsService, PriceCalculationResponse } from '../api/bookings'

interface BookingFormData {
  customer_name: string
  email: string
  phone?: string
  tour_id: string
  start_date: string
  end_date: string
  number_of_participants: number
}

const BookingPage = () => {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [priceInfo, setPriceInfo] = useState<PriceCalculationResponse | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [availability, setAvailability] = useState<{ available: boolean; message: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<BookingFormData>()

  const selectedTourId = watch('tour_id')
  const startDate = watch('start_date')
  const endDate = watch('end_date')
  const participants = watch('number_of_participants')
  const selectedTour = tours.find(tour => tour.id === selectedTourId)

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true)
        // Extract language code from i18n (e.g., 'en-US' -> 'en')
        const currentLang = i18n.language.split('-')[0].toLowerCase()
        const toursData = await toursService.getAllTours(currentLang)
        setTours(toursData)
      } catch (error) {
        console.error('Error fetching tours:', error)
        toast.error('Failed to load tours')
      } finally {
        setLoading(false)
      }
    }

    fetchTours()
  }, [i18n.language])

  // Separate effect to handle tour pre-selection after tours are loaded
  useEffect(() => {
    const tourParam = searchParams.get('tour')
    if (tourParam && tours.length > 0 && tours.some(tour => tour.id === tourParam)) {
      setValue('tour_id', tourParam)
    }
  }, [tours, searchParams, setValue])

  // Calculate price when form data changes
  useEffect(() => {
    const calculatePrice = async () => {
      if (selectedTourId && startDate && endDate && participants && participants > 0) {
        try {
          setCalculating(true)

          // Check availability first
          const availabilityResult = await bookingsService.checkAvailability({
            tour_id: selectedTourId,
            start_date: startDate,
            end_date: endDate,
            number_of_participants: participants
          })
          setAvailability(availabilityResult)

          // Calculate price if available
          if (availabilityResult.available) {
            const priceResult = await bookingsService.calculatePrice({
              tour_id: selectedTourId,
              start_date: startDate,
              end_date: endDate,
              number_of_participants: participants
            })
            setPriceInfo(priceResult)
          } else {
            setPriceInfo(null)
          }
        } catch (error) {
          console.error('Error calculating price:', error)
          setPriceInfo(null)
          setAvailability({ available: false, message: 'Unable to check availability' })
        } finally {
          setCalculating(false)
        }
      } else {
        setPriceInfo(null)
        setAvailability(null)
      }
    }

    // Debounce the calculation
    const timeoutId = setTimeout(calculatePrice, 500)
    return () => clearTimeout(timeoutId)
  }, [selectedTourId, startDate, endDate, participants])

  const onSubmit = async (data: BookingFormData) => {
    try {
      setSubmitting(true)

      const bookingRequest: BookingRequest = {
        customer_name: data.customer_name,
        email: data.email,
        phone: data.phone || undefined,
        tour_id: data.tour_id,
        start_date: data.start_date,
        end_date: data.end_date,
        number_of_participants: data.number_of_participants
      }

      await bookingsService.createBooking(bookingRequest)

      toast.success(t('booking.success'))

      // Reset form
      setValue('customer_name', '')
      setValue('email', '')
      setValue('phone', '')
      setValue('start_date', '')
      setValue('end_date', '')
      setValue('number_of_participants', 1)

    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error(t('booking.error'))
    } finally {
      setSubmitting(false)
    }
  }

  // Get minimum date (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <>
      <Helmet>
        <title>{t('booking.title')} - Morocco Tourism</title>
        <meta name="description" content={t('booking.subtitle')} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-moroccan-terracotta text-white section-padding">
          <div className="container-custom text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {t('booking.title')}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {t('booking.subtitle')}
            </p>
          </div>
        </section>

        {/* Booking Form */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-2" />
                    {t('booking.form.name')} *
                  </label>
                  <input
                    type="text"
                    {...register('customer_name', {
                      required: t('booking.validation.nameRequired'),
                      minLength: {
                        value: 2,
                        message: t('booking.validation.nameMin')
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-terracotta focus:border-transparent"
                    placeholder={t('booking.form.namePlaceholder')}
                  />
                  {errors.customer_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} className="inline mr-2" />
                    {t('booking.form.email')} *
                  </label>
                  <input
                    type="email"
                    {...register('email', {
                      required: t('booking.validation.emailRequired'),
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: t('booking.validation.emailInvalid')
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-terracotta focus:border-transparent"
                    placeholder={t('booking.form.emailPlaceholder')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="inline mr-2" />
                    {t('booking.form.phone')}
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-terracotta focus:border-transparent"
                    placeholder={t('booking.form.phonePlaceholder')}
                  />
                </div>

                {/* Tour Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.form.tourId')} *
                  </label>
                  <select
                    {...register('tour_id', {
                      required: t('booking.validation.tourRequired')
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-terracotta focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="">{t('booking.form.tourPlaceholder')}</option>
                    {tours.map((tour) => (
                      <option key={tour.id} value={tour.id}>
                        {tour.title} - ${tour.price}
                      </option>
                    ))}
                  </select>
                  {errors.tour_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.tour_id.message}</p>
                  )}
                </div>

                {/* Number of Participants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-2" />
                    {t('booking.form.participants')} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    {...register('number_of_participants', {
                      required: t('booking.validation.participantsRequired'),
                      min: { value: 1, message: t('booking.validation.participantsMin') },
                      max: { value: 50, message: t('booking.validation.participantsMax') }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-terracotta focus:border-transparent"
                    placeholder="1"
                    defaultValue={1}
                  />
                  {errors.number_of_participants && (
                    <p className="mt-1 text-sm text-red-600">{errors.number_of_participants.message}</p>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar size={16} className="inline mr-2" />
                      {t('booking.form.startDate')} *
                    </label>
                    <input
                      type="date"
                      min={minDate}
                      {...register('start_date', {
                        required: t('booking.validation.startDateRequired'),
                        validate: (value) => {
                          const selectedDate = new Date(value)
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          return selectedDate > today || t('booking.validation.dateFuture')
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-terracotta focus:border-transparent"
                    />
                    {errors.start_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar size={16} className="inline mr-2" />
                      {t('booking.form.endDate')} *
                    </label>
                    <input
                      type="date"
                      min={startDate || minDate}
                      {...register('end_date', {
                        required: t('booking.validation.endDateRequired'),
                        validate: (value) => {
                          if (!startDate) return true
                          const start = new Date(startDate)
                          const end = new Date(value)
                          return end >= start || t('booking.validation.endDateAfterStart')
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-terracotta focus:border-transparent"
                    />
                    {errors.end_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
                    )}
                  </div>
                </div>

                {/* Availability Status */}
                {availability && (
                  <div className={`p-4 rounded-lg ${availability.available ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className={`text-sm font-medium ${availability.available ? 'text-green-800' : 'text-red-800'}`}>
                      {availability.message}
                    </div>
                  </div>
                )}

                {/* Price Information */}
                {calculating && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">{t('booking.calculating')}</div>
                  </div>
                )}

                {priceInfo && availability?.available && (
                  <div className="bg-moroccan-sand p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">{t('booking.priceBreakdown')}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{t('booking.basePricePerDay')}:</span>
                        <span>${priceInfo.base_price_per_person}</span>
                      </div>
                      {priceInfo.seasonal_multiplier !== 1 && (
                        <div className="flex justify-between">
                          <span>{t('booking.seasonalAdjustment')} ({priceInfo.season_name}):</span>
                          <span>{priceInfo.seasonal_multiplier}x</span>
                        </div>
                      )}
                      {priceInfo.group_discount_percentage > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>{t('booking.groupDiscount')}:</span>
                          <span>-{priceInfo.group_discount_percentage}%</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>{t('booking.finalPricePerDay')}:</span>
                        <span className="font-semibold">${priceInfo.price_per_person}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('booking.duration')}:</span>
                        <span>{priceInfo.duration_days} {priceInfo.duration_days > 1 ? t('booking.days') : t('booking.day')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('booking.participants')}:</span>
                        <span>{priceInfo.number_of_participants}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between text-lg font-bold text-moroccan-terracotta">
                        <span>{t('booking.totalPrice')}:</span>
                        <span>${priceInfo.total_price}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        ${priceInfo.price_per_person} × {priceInfo.duration_days} {t('booking.days')} × {priceInfo.number_of_participants} {t('booking.participants').toLowerCase()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Tour Info */}
                {selectedTour && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">{selectedTour.title}</h3>
                    <div className="text-sm text-gray-600">
                      <p>Location: {selectedTour.location}</p>
                      <p>Difficulty: {selectedTour.difficulty_level}</p>
                      <p>Max participants: {selectedTour.max_participants}</p>
                    </div>
                  </div>
                )}



                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || loading || !availability?.available || calculating}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t('booking.form.submitting') :
                    calculating ? 'Calculating...' :
                      !availability?.available ? 'Not Available' :
                        `${t('booking.form.submit')} - $${priceInfo?.total_price || '0'}`}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Ad Space */}
        <section className="py-8 bg-white border-t">
          <div className="container-custom">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2">Advertisement</div>
              <div className="h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Travel Insurance Ad Space</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default BookingPage