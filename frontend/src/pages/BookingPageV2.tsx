import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Calendar, User, Mail, Phone, Users, DollarSign } from 'lucide-react'
import { Tour, toursService } from '../api/tours'
import { bookingsService } from '../api/bookings'

interface BookingFormData {
    customer_name: string
    email: string
    phone?: string
    tour_id: string
    start_date: string
    number_of_participants: number
    special_requests?: string
}

interface PriceCalculation {
    price_per_person: number
    total_price: number
    participants: number
    pricing_tier: string
}

const BookingPageV2 = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [tours, setTours] = useState<Tour[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [priceInfo, setPriceInfo] = useState<PriceCalculation | null>(null)
    const [calculating, setCalculating] = useState(false)
    const [calculatedEndDate, setCalculatedEndDate] = useState<string>('')

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm<BookingFormData>({
        defaultValues: {
            number_of_participants: 1
        }
    })

    const selectedTourId = watch('tour_id')
    const startDate = watch('start_date')
    const participants = watch('number_of_participants')
    const selectedTour = tours.find(tour => tour.id === selectedTourId)

    useEffect(() => {
        const fetchTours = async () => {
            try {
                setLoading(true)
                const toursData = await toursService.getAllTours()
                setTours(toursData)
            } catch (error) {
                console.error('Error fetching tours:', error)
                toast.error('Failed to load tours')
            } finally {
                setLoading(false)
            }
        }

        fetchTours()
    }, [])

    // Pre-select tour from URL
    useEffect(() => {
        const tourParam = searchParams.get('tour')
        if (tourParam && tours.length > 0 && tours.some(tour => tour.id === tourParam)) {
            setValue('tour_id', tourParam)
        }
    }, [tours, searchParams, setValue])

    // Calculate end date and price when inputs change
    useEffect(() => {
        const calculatePriceAndDate = async () => {
            if (selectedTourId && startDate && participants && participants > 0) {
                try {
                    setCalculating(true)

                    // Calculate end date based on tour duration
                    if (selectedTour) {
                        const start = new Date(startDate)
                        // Extract days from duration (e.g., "3 days / 2 nights" -> 3)
                        const durationMatch = selectedTour.duration.match(/(\d+)\s*day/i)
                        const durationDays = durationMatch ? parseInt(durationMatch[1]) : 1
                        const end = new Date(start)
                        end.setDate(end.getDate() + durationDays - 1)
                        setCalculatedEndDate(end.toISOString().split('T')[0])
                    }

                    // Calculate price based on group size only
                    const priceResult = await toursService.calculatePrice(selectedTourId, participants)
                    setPriceInfo(priceResult)
                } catch (error) {
                    console.error('Error calculating price:', error)
                    setPriceInfo(null)
                } finally {
                    setCalculating(false)
                }
            } else {
                setPriceInfo(null)
                setCalculatedEndDate('')
            }
        }

        calculatePriceAndDate()
    }, [selectedTourId, startDate, participants, selectedTour])

    const onSubmit = async (data: BookingFormData) => {
        if (!calculatedEndDate) {
            toast.error('Please select a start date')
            return
        }

        try {
            setSubmitting(true)

            // Create booking with calculated end date
            await bookingsService.createBooking({
                customer_name: data.customer_name,
                email: data.email,
                phone: data.phone,
                tour_id: data.tour_id,
                start_date: data.start_date,
                end_date: calculatedEndDate,
                number_of_participants: data.number_of_participants,
                special_requests: data.special_requests
            })

            toast.success('Booking request submitted successfully!')
            navigate('/')
        } catch (error) {
            console.error('Error creating booking:', error)
            toast.error('Failed to create booking. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moroccan-terracotta mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <Helmet>
                <title>Book Your Tour - Morocco Tourism</title>
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-moroccan-sand via-white to-moroccan-sand py-12 px-4">
                <div className="container-custom">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                                Book Your <span className="text-moroccan-terracotta">Moroccan Adventure</span>
                            </h1>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Complete the form below to reserve your unforgettable journey through Morocco
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            {/* Tour Selection */}
                            <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-moroccan-terracotta">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-moroccan-terracotta to-moroccan-gold rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        1
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Select Your Tour</h2>
                                </div>
                                <select
                                    {...register('tour_id', { required: 'Please select a tour' })}
                                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-moroccan-terracotta focus:border-moroccan-terracotta transition-all text-lg bg-white hover:border-moroccan-terracotta"
                                >
                                    <option value="">Choose your adventure...</option>
                                    {tours.map((tour) => (
                                        <option key={tour.id} value={tour.id}>
                                            {tour.title} - {tour.duration}
                                        </option>
                                    ))}
                                </select>
                                {errors.tour_id && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                        <span>⚠️</span> {errors.tour_id.message}
                                    </p>
                                )}
                            </div>

                            {/* Date and Participants */}
                            {selectedTour && (
                                <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-moroccan-blue">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-br from-moroccan-blue to-moroccan-terracotta rounded-full flex items-center justify-center text-white font-bold text-xl">
                                            2
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">Tour Details</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {/* Start Date */}
                                        <div>
                                            <label className="block text-base font-semibold text-gray-800 mb-3">
                                                <Calendar className="inline w-5 h-5 mr-2 text-moroccan-terracotta" />
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                {...register('start_date', { required: 'Start date is required' })}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-moroccan-terracotta focus:border-moroccan-terracotta transition-all text-lg hover:border-moroccan-terracotta"
                                            />
                                            {errors.start_date && (
                                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                    <span>⚠️</span> {errors.start_date.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Number of Participants */}
                                        <div>
                                            <label className="block text-base font-semibold text-gray-800 mb-3">
                                                <Users className="inline w-5 h-5 mr-2 text-moroccan-blue" />
                                                Number of Participants
                                            </label>
                                            <input
                                                type="number"
                                                {...register('number_of_participants', {
                                                    required: 'Number of participants is required',
                                                    min: { value: 1, message: 'At least 1 participant required' },
                                                    max: { value: selectedTour.max_participants, message: `Maximum ${selectedTour.max_participants} participants` }
                                                })}
                                                min="1"
                                                max={selectedTour.max_participants}
                                                className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-moroccan-terracotta focus:border-moroccan-terracotta transition-all text-lg hover:border-moroccan-terracotta"
                                            />
                                            {errors.number_of_participants && (
                                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                    <span>⚠️</span> {errors.number_of_participants.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Calculated End Date */}
                                    {calculatedEndDate && (
                                        <div className="bg-gradient-to-r from-moroccan-sand to-moroccan-gold/20 p-6 rounded-xl border-l-4 border-moroccan-gold">
                                            <div className="flex items-start gap-3">
                                                <Calendar className="w-6 h-6 text-moroccan-terracotta mt-1 flex-shrink-0" />
                                                <div className="space-y-2">
                                                    <p className="text-base text-gray-800">
                                                        <strong className="font-semibold">Tour Duration:</strong> {selectedTour.duration}
                                                    </p>
                                                    <p className="text-base text-gray-800">
                                                        <strong className="font-semibold">End Date:</strong>{' '}
                                                        <span className="text-moroccan-terracotta font-medium">
                                                            {new Date(calculatedEndDate).toLocaleDateString('en-US', { 
                                                                weekday: 'long', 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric' 
                                                            })}
                                                        </span>
                                                        <span className="text-sm text-gray-600 ml-2">(automatically calculated)</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Price Calculation */}
                            {priceInfo && (
                                <div className="bg-gradient-to-br from-moroccan-terracotta via-moroccan-gold to-moroccan-terracotta p-1 rounded-2xl shadow-2xl">
                                    <div className="bg-white rounded-xl p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 bg-gradient-to-br from-moroccan-gold to-moroccan-terracotta rounded-full flex items-center justify-center text-white font-bold text-xl">
                                                <DollarSign className="w-7 h-7" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900">Price Breakdown</h2>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                                <span className="text-gray-700 font-medium">Pricing Tier:</span>
                                                <span className="font-bold text-moroccan-terracotta text-lg">{priceInfo.pricing_tier}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                                <span className="text-gray-700 font-medium">Price per Person:</span>
                                                <span className="font-bold text-gray-900 text-lg">€{priceInfo.price_per_person}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                                <span className="text-gray-700 font-medium">Number of Participants:</span>
                                                <span className="font-bold text-gray-900 text-lg">{priceInfo.participants}</span>
                                            </div>
                                            <div className="bg-gradient-to-r from-moroccan-sand to-moroccan-gold/30 p-5 rounded-xl mt-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xl font-bold text-gray-900">Total Price:</span>
                                                    <span className="text-3xl font-bold text-moroccan-terracotta">
                                                        €{priceInfo.total_price}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {calculating && (
                                            <div className="mt-4 flex items-center gap-2 text-moroccan-terracotta">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-moroccan-terracotta"></div>
                                                <p className="text-sm font-medium">Calculating...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Customer Information */}
                            <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-moroccan-gold">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-moroccan-gold to-moroccan-terracotta rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        3
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Your Information</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-base font-semibold text-gray-800 mb-3">
                                            <User className="inline w-5 h-5 mr-2 text-moroccan-terracotta" />
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            {...register('customer_name', { required: 'Name is required' })}
                                            className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-moroccan-terracotta focus:border-moroccan-terracotta transition-all text-lg hover:border-moroccan-terracotta"
                                            placeholder="John Doe"
                                        />
                                        {errors.customer_name && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                <span>⚠️</span> {errors.customer_name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-base font-semibold text-gray-800 mb-3">
                                            <Mail className="inline w-5 h-5 mr-2 text-moroccan-blue" />
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            {...register('email', {
                                                required: 'Email is required',
                                                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                                            })}
                                            className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-moroccan-terracotta focus:border-moroccan-terracotta transition-all text-lg hover:border-moroccan-terracotta"
                                            placeholder="john@example.com"
                                        />
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                <span>⚠️</span> {errors.email.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-base font-semibold text-gray-800 mb-3">
                                            <Phone className="inline w-5 h-5 mr-2 text-moroccan-gold" />
                                            Phone <span className="text-gray-500 text-sm font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="tel"
                                            {...register('phone')}
                                            className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-moroccan-terracotta focus:border-moroccan-terracotta transition-all text-lg hover:border-moroccan-terracotta"
                                            placeholder="+212 600 000 000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base font-semibold text-gray-800 mb-3">
                                            Special Requests <span className="text-gray-500 text-sm font-normal">(optional)</span>
                                        </label>
                                        <textarea
                                            {...register('special_requests')}
                                            rows={4}
                                            className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-moroccan-terracotta focus:border-moroccan-terracotta transition-all text-lg hover:border-moroccan-terracotta resize-none"
                                            placeholder="Any special requirements or requests..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="bg-white rounded-2xl shadow-xl p-8">
                                <button
                                    type="submit"
                                    disabled={submitting || !priceInfo}
                                    className="w-full bg-gradient-to-r from-moroccan-terracotta to-moroccan-gold text-white py-5 px-8 rounded-xl text-xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-3"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                            Processing Your Booking...
                                        </>
                                    ) : (
                                        <>
                                            <DollarSign className="w-6 h-6" />
                                            Confirm Booking
                                        </>
                                    )}
                                </button>
                                {!priceInfo && selectedTourId && (
                                    <p className="text-center text-gray-600 mt-4 text-sm">
                                        Please select a start date and number of participants to see pricing
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

export default BookingPageV2
