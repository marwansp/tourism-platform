import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, Clock, ChevronLeft, ChevronRight, Star, Users, Tag, ChevronDown, ChevronUp, Globe } from 'lucide-react'
import { Tour, toursService, GroupPricing, TourTag, TourInfoSection } from '../api/tours'
import { languagesService, Language } from '../api/languages'

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
    const { t, i18n } = useTranslation()
    const [tour, setTour] = useState<Tour | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [reviews, setReviews] = useState<Review[]>([])
    const [averageRating, setAverageRating] = useState<number>(0)
    const [totalReviews, setTotalReviews] = useState<number>(0)
    const [groupPricing, setGroupPricing] = useState<GroupPricing[]>([])
    const [tourTags, setTourTags] = useState<TourTag[]>([])
    const [infoSections, setInfoSections] = useState<TourInfoSection[]>([])
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([])

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
                
                // Get current language code from i18n
                const currentLang = i18n.language.split('-')[0] // Handle cases like 'en-US'
                
                // Fetch tour data with current language
                const tourData = await toursService.getTourById(id, currentLang)
                setTour(tourData)
                
                // Fetch available languages for this tour
                try {
                    const langCodes = await languagesService.getTourLanguages(id)
                    
                    // Fetch full language details for available languages
                    const allLanguages = await languagesService.getActiveLanguages()
                    const tourLangs = allLanguages.filter(lang => langCodes.includes(lang.code))
                    setAvailableLanguages(tourLangs)
                } catch (err) {
                    console.log('Error fetching tour languages:', err)
                }
                
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
                
                // Fetch tour info sections
                try {
                    const sections = await toursService.getTourInfoSections(id)
                    setInfoSections(sections)
                } catch (err) {
                    console.log('No info sections available')
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
    }, [id, t, i18n.language])

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev)
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId)
            } else {
                newSet.add(sectionId)
            }
            return newSet
        })
    }

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
                    <div className="container-custom py-4 px-4 sm:px-6 lg:px-8">
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
                <div className="container-custom py-8 px-4 sm:px-6 lg:px-8">
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

                            {/* Tour Info Sections */}
                            {infoSections.length > 0 && (
                                <div className="space-y-3 mt-6">
                                    {infoSections.map((section) => {
                                        const isExpanded = expandedSections.has(section.id)
                                        const title = i18n.language.startsWith('fr') ? section.title_fr : section.title_en
                                        const content = i18n.language.startsWith('fr') ? section.content_fr : section.content_en
                                        
                                        return (
                                            <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleSection(section.id)}
                                                    className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                                                >
                                                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-5 h-5 text-gray-500" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                                    )}
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-6 py-4 bg-white border-t border-gray-200">
                                                        <div 
                                                            className="prose prose-sm max-w-none text-gray-700"
                                                            dangerouslySetInnerHTML={{ __html: content }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                                    {tour.title}
                                </h1>

                                {/* Fallback Language Indicator */}
                                {tour.is_fallback && (
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                                        <Globe size={18} className="text-blue-600 flex-shrink-0" />
                                        <span className="text-sm text-blue-800">
                                            {t('tourDetails.translatedFromEnglish') || 'This tour is displayed in English as a translation is not available in your selected language.'}
                                        </span>
                                    </div>
                                )}

                                {/* Available Languages */}
                                {availableLanguages.length > 0 && (
                                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Globe size={18} className="text-gray-600 flex-shrink-0" />
                                            <span className="text-sm text-gray-700 font-medium">
                                                {t('tourDetails.availableIn') || 'Available in'}:
                                            </span>
                                            <div className="flex gap-2 flex-wrap">
                                                {availableLanguages.map((lang) => (
                                                    <span
                                                        key={lang.code}
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm ${
                                                            tour.current_language === lang.code
                                                                ? 'bg-moroccan-terracotta text-white font-medium'
                                                                : 'bg-white border border-gray-300 text-gray-700'
                                                        }`}
                                                        title={lang.name}
                                                    >
                                                        <span>{lang.flag_emoji}</span>
                                                        <span>{lang.code.toUpperCase()}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tour Info */}
                                <div className="flex flex-wrap gap-6 mb-6">
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <Clock size={20} />
                                        <span className="font-medium">{t('tourDetails.duration')}: {tour.duration}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-moroccan-terracotta">
                                        <span className="font-semibold text-xl">{t('tourDetails.from')} €{Number.isInteger(Number(tour.price)) ? Math.floor(Number(tour.price)) : Number(tour.price).toFixed(2)} {t('tourDetails.perPerson')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tags - What's Included */}
                            {tourTags.filter(tt => tt.tag.category === 'included').length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Tag size={20} className="text-green-600" />
                                        ✅ {t('tags.whatsIncluded')}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {tourTags
                                            .filter(tt => tt.tag.category === 'included')
                                            .map((tourTag) => (
                                                <span
                                                    key={tourTag.id}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-800 border border-green-200"
                                                >
                                                    {tourTag.tag.icon && <span className="mr-1">{tourTag.tag.icon}</span>}
                                                    {tourTag.tag.name}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Tags - What's NOT Included */}
                            {tourTags.filter(tt => tt.tag.category === 'not_included').length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Tag size={20} className="text-red-600" />
                                        ❌ {t('tags.whatsNotIncluded')}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {tourTags
                                            .filter(tt => tt.tag.category === 'not_included')
                                            .map((tourTag) => (
                                                <span
                                                    key={tourTag.id}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-800 border border-red-200"
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
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('tourDetails.aboutThisTour')}</h2>
                                <div 
                                    className="tour-description text-gray-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: tour.description }}
                                />
                            </div>

                            {/* Group Pricing */}
                            {groupPricing.length > 0 && (
                                <div className="bg-gradient-to-br from-moroccan-sand to-white p-6 rounded-xl border border-moroccan-terracotta/20">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Users size={20} className="text-moroccan-terracotta" />
                                        {t('tourDetails.groupPricing')}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">{t('tourDetails.betterPricesForGroups')}</p>
                                    <div className="space-y-2">
                                        {groupPricing.map((pricing) => (
                                            <div
                                                key={pricing.id}
                                                className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-moroccan-terracotta transition-colors"
                                            >
                                                <span className="text-gray-700 font-medium">
                                                    {pricing.min_participants === pricing.max_participants
                                                        ? `${pricing.min_participants} ${pricing.min_participants > 1 ? t('tourDetails.people') : t('tourDetails.person')}`
                                                        : `${pricing.min_participants}-${pricing.max_participants} ${t('tourDetails.people')}`
                                                    }
                                                </span>
                                                <span className="text-moroccan-terracotta font-bold">
                                                    €{Number.isInteger(Number(pricing.price_per_person)) ? Math.floor(Number(pricing.price_per_person)) : Number(pricing.price_per_person).toFixed(2)} {t('tourDetails.perPerson')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Booking Section */}
                            <div className="bg-white p-6 rounded-xl shadow-lg border">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('tourDetails.readyToBook')}</h3>
                                <p className="text-gray-600 mb-6">
                                    {t('tourDetails.bookingDescription')}
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
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('tourDetails.questions')}</h3>
                                <p className="text-gray-700 mb-4">
                                    {t('tourDetails.questionsDescription')}
                                </p>
                                <Link
                                    to="/contact"
                                    className="text-moroccan-terracotta hover:text-moroccan-orange font-medium"
                                >
                                    {t('tourDetails.contactUs')}
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
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('tourDetails.customerReviews')}</h2>
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
                                    <p className="text-gray-600">{t('tourDetails.noReviews')}</p>
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