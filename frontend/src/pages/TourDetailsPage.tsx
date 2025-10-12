import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, Clock, DollarSign, ChevronLeft, ChevronRight, Star, Users, Tag } from 'lucide-react'
import { Tour, toursService, GroupPricing, TourTag } from '../api/tours'

interface Review {
    id: string;
    customer_name: string;
    rating: number;
    review_text: string;
    created_at: string;
    is_verified: boolean;
}

const TourDetailsPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [tour, setTour] = useState<Tour | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [reviews, setReviews] = useState<Review[]>([])
    const [averageRating, setAverageRating] = useState<number>(0)
    const [totalReviews, setTotalReviews] = useState<number>(0)
    const [groupPricing, setGroupPricing] = useState<GroupPricing[]>([])
    const [tourTags, setTourTags] = useState<TourTag[]>([])
    const [selectedParticipants, setSelectedParticipants] = useState(1)

    useEffect(() => {
        const fetchTour = async () => {
            if (!id) {
                setError(t('tourDetails.error'))
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError(null)
                const tourData = await toursService.getTourById(id)
                setTour(tourData)
                
                // Fetch group pricing
                try {
                    const pricing = await toursService.getGroupPricing(id)
                    setGroupPricing(pricing)
                } catch (err) {
                    console.log('No group pricing available')
                }
                
                // Fetch tour tags
                try {
                    const tags = await toursService.getTourTags(id)
                    setTourTags(tags)
                } catch (err) {
                    console.log('No tags available')
                }
                
                // Fetch reviews
                const reviewsResponse = await fetch(`/api/tours/tours/${id}/reviews`)
                if (reviewsResponse.ok) {
                    const reviewsData = await reviewsResponse.json()
                    setReviews(reviewsData)
                }
                
                // Fetch rating stats
                const statsResponse = await fetch(`/api/tours/tours/${id}/rating-stats`)
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json()
                    setAverageRating(statsData.average_rating)
                    setTotalReviews(statsData.total_reviews)
                }
            } catch (err) {
                setError(t('tourDetails.error'))
                console.error('Error fetching tour:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchTour()
    }, [id, t])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moroccan-terracotta mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('tourDetails.loading')}</p>
                </div>
            </div>
        )
    }

    if (error || !tour) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-lg mb-4">{error}</div>
                    <div className="space-x-4">
                        <button
                            onClick={() => navigate('/tours')}
                            className="btn-primary"
                        >
                            {t('tourDetails.backToTours')}
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-secondary"
                        >
                            {t('common.tryAgain')}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Get images from tour data, fallback to default if no images
    const images = tour.images && tour.images.length > 0
        ? tour.images.sort((a, b) => a.display_order - b.display_order)
        : [{
            image_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&auto=format',
            is_main: true,
            display_order: 0,
            alt_text: tour.title
        }]

    const currentImage = images[selectedImageIndex] || images[0]

    const nextImage = () => {
        setSelectedImageIndex((prev) => (prev + 1) % images.length)
    }

    const prevImage = () => {
        setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    return (
        <>
            <Helmet>
                <title>{tour.title} - Morocco Tourism</title>
                <meta name="description" content={tour.description} />
            </Helmet>

            <div className="min-h-screen bg-gray-50">
                {/* Back Button */}
                <div className="bg-white border-b">
                    <div className="container-custom py-4">
                        <Link
                            to="/tours"
                            className="inline-flex items-center space-x-2 text-moroccan-terracotta hover:text-moroccan-orange transition-colors duration-200"
                        >
                            <ArrowLeft size={20} />
                            <span>{t('tourDetails.backToTours')}</span>
                        </Link>
                    </div>
                </div>

                {/* Tour Details */}
                <div className="container-custom py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="relative aspect-w-16 aspect-h-12 rounded-xl overflow-hidden">
                                <img
                                    src={currentImage.image_url}
                                    alt={currentImage.alt_text || tour.title}
                                    className="w-full h-96 object-cover rounded-xl"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&auto=format'
                                    }}
                                />

                                {/* Navigation arrows for multiple images */}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                                        >
                                            <ChevronRight size={20} />
                                        </button>

                                        {/* Image counter */}
                                        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                                            {selectedImageIndex + 1} / {images.length}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Thumbnail Gallery */}
                            {images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImageIndex(index)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === selectedImageIndex
                                                ? 'border-moroccan-terracotta shadow-lg'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <img
                                                src={image.image_url}
                                                alt={image.alt_text || `${tour.title} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=80&h=80&fit=crop&auto=format'
                                                }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                                    {tour.title}
                                </h1>

                                {/* Tour Info */}
                                <div className="flex flex-wrap gap-6 mb-6">
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <Clock size={20} />
                                        <span className="font-medium">{t('tourDetails.duration')}: {tour.duration}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-moroccan-terracotta">
                                        <DollarSign size={20} />
                                        <span className="font-semibold text-xl">From ${tour.price}/person</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            {tourTags.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Tag size={20} className="text-moroccan-terracotta" />
                                        What's Included
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {tourTags.map((tourTag) => (
                                            <span
                                                key={tourTag.id}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-moroccan-sand text-gray-700 border border-moroccan-terracotta/20"
                                            >
                                                {tourTag.tag.icon && <span className="mr-1">{tourTag.tag.icon}</span>}
                                                {tourTag.tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Tour</h2>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {tour.description}
                                </p>
                            </div>

                            {/* Group Pricing */}
                            {groupPricing.length > 0 && (
                                <div className="bg-gradient-to-br from-moroccan-sand to-white p-6 rounded-xl border border-moroccan-terracotta/20">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Users size={20} className="text-moroccan-terracotta" />
                                        Group Pricing
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">Better prices for larger groups!</p>
                                    <div className="space-y-2">
                                        {groupPricing.map((pricing) => (
                                            <div
                                                key={pricing.id}
                                                className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-moroccan-terracotta transition-colors"
                                            >
                                                <span className="text-gray-700 font-medium">
                                                    {pricing.min_participants === pricing.max_participants
                                                        ? `${pricing.min_participants} person${pricing.min_participants > 1 ? 's' : ''}`
                                                        : `${pricing.min_participants}-${pricing.max_participants} people`
                                                    }
                                                </span>
                                                <span className="text-moroccan-terracotta font-bold">
                                                    {pricing.price_per_person} MAD/person
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Booking Section */}
                            <div className="bg-white p-6 rounded-xl shadow-lg border">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to Book?</h3>
                                <p className="text-gray-600 mb-6">
                                    Secure your spot on this amazing adventure. We'll contact you to confirm all details.
                                </p>
                                <Link
                                    to={`/booking?tour=${tour.id}`}
                                    className="w-full btn-primary text-center block"
                                >
                                    {t('tourDetails.bookTour')}
                                </Link>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-moroccan-sand p-6 rounded-xl">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions?</h3>
                                <p className="text-gray-700 mb-4">
                                    Need more information or have special requests? We're here to help!
                                </p>
                                <Link
                                    to="/contact"
                                    className="text-moroccan-terracotta hover:text-moroccan-orange font-medium"
                                >
                                    Contact Us →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <section className="py-12 bg-white border-t">
                    <div className="container-custom">
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
                                {totalReviews > 0 ? (
                                    <div className="flex items-center justify-center space-x-4">
                                        <div className="flex items-center space-x-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-6 h-6 ${
                                                        star <= Math.round(averageRating)
                                                            ? 'text-yellow-400 fill-current'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xl font-semibold text-gray-900">
                                            {averageRating.toFixed(1)}
                                        </span>
                                        <span className="text-gray-600">
                                            ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-gray-600">No reviews yet. Be the first to review this tour!</p>
                                )}
                            </div>

                            {/* Reviews List */}
                            {reviews.length > 0 && (
                                <div className="space-y-6">
                                    {reviews.slice(0, 6).map((review) => (
                                        <div key={review.id} className="bg-gray-50 rounded-lg p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{review.customer_name}</h4>
                                                    <div className="flex items-center space-x-1 mt-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`w-4 h-4 ${
                                                                    star <= review.rating
                                                                        ? 'text-yellow-400 fill-current'
                                                                        : 'text-gray-300'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            {review.review_text && (
                                                <p className="text-gray-700 leading-relaxed">{review.review_text}</p>
                                            )}
                                            {review.is_verified && (
                                                <div className="mt-3">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        ✓ Verified Review
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {reviews.length > 6 && (
                                        <div className="text-center">
                                            <p className="text-gray-600">
                                                Showing 6 of {reviews.length} reviews
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Ad Space */}
                <section className="py-8 bg-white border-t">
                    <div className="container-custom">
                        <div className="text-center">
                            <div className="text-xs text-gray-400 mb-2">Advertisement</div>
                            <div className="h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400">Related Tours Ad Space</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}

export default TourDetailsPage