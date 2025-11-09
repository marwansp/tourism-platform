import React, { useState, useEffect } from 'react'
import { Save, X, Upload, Loader2, Trash2, Star } from 'lucide-react'
import { uploadTourImage } from '../api/media'
import RichTextEditor from './RichTextEditor'
import { languagesService, Language } from '../api/languages'

interface TranslationData {
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

interface TourFormData {
  price: number
  duration: string
  max_participants: number
  difficulty_level: string
  tour_type: 'tour' | 'excursion'
  image_url: string
  images?: TourImage[]
  translations: TranslationData[]
}

interface TourFormProps {
  initialData?: TourFormData
  onSubmit: (data: TourFormData) => void
  onCancel: () => void
  submitText: string
}

const defaultFormData: TourFormData = {
  price: 0,
  duration: '',
  max_participants: 1,
  difficulty_level: 'Easy',
  tour_type: 'tour',
  image_url: '',
  images: [],
  translations: []
}

const TourForm: React.FC<TourFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitText
}) => {
  const [formData, setFormData] = useState<TourFormData>(() => initialData || defaultFormData)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image_url || '')
  const [images, setImages] = useState<TourImage[]>(initialData?.images || [])
  const [activeLanguages, setActiveLanguages] = useState<Language[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en'])
  const [loadingLanguages, setLoadingLanguages] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('en')
  const [translations, setTranslations] = useState<Record<string, TranslationData>>({
    en: { language_code: 'en', title: '', description: '', location: '', itinerary: '' }
  })

  // Fetch active languages on component mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoadingLanguages(true)
        const languages = await languagesService.getActiveLanguages()
        setActiveLanguages(languages)
        
        // Only set default English if no initialData translations exist
        if (!initialData?.translations || initialData.translations.length === 0) {
          if (!selectedLanguages.includes('en')) {
            setSelectedLanguages(['en'])
          }
        }
      } catch (error) {
        console.error('Failed to fetch languages:', error)
        // Fallback to English if fetch fails
        setActiveLanguages([
          {
            id: 'default-en',
            code: 'en',
            name: 'English',
            native_name: 'English',
            flag_emoji: '🇺🇸',
            is_active: true,
            is_default: true,
            created_at: new Date().toISOString()
          }
        ])
      } finally {
        setLoadingLanguages(false)
      }
    }

    fetchLanguages()
  }, [])

  // Load existing translations and images when editing
  useEffect(() => {
    if (initialData?.translations && initialData.translations.length > 0) {
      const translationsMap: Record<string, TranslationData> = {}
      const langCodes: string[] = []
      
      initialData.translations.forEach(trans => {
        translationsMap[trans.language_code] = trans
        langCodes.push(trans.language_code)
      })
      
      setTranslations(translationsMap)
      setSelectedLanguages(langCodes)
      setActiveTab(langCodes[0] || 'en')
    }
    
    // Load images if provided
    if (initialData?.images && initialData.images.length > 0) {
      setImages(initialData.images)
      // Set preview to main image or first image
      const mainImage = initialData.images.find(img => img.is_main)
      const previewImage = mainImage || initialData.images[0]
      if (previewImage) {
        setImagePreview(previewImage.image_url)
        setFormData(prev => ({ ...prev, image_url: previewImage.image_url }))
      }
    }
  }, [initialData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'max_participants' ? Number(value) : value
    }))

    // Update preview when URL changes
    if (name === 'image_url') {
      setImagePreview(value)
    }
  }

  const handleLanguageToggle = (languageCode: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(languageCode)) {
        // Don't allow deselecting English (default language)
        if (languageCode === 'en') {
          return prev
        }
        // Remove translation data for deselected language
        const newTranslations = { ...translations }
        delete newTranslations[languageCode]
        setTranslations(newTranslations)
        
        // Switch to English tab if current tab is being removed
        if (activeTab === languageCode) {
          setActiveTab('en')
        }
        
        return prev.filter(code => code !== languageCode)
      } else {
        // Add empty translation for newly selected language
        setTranslations(prev => ({
          ...prev,
          [languageCode]: {
            language_code: languageCode,
            title: '',
            description: '',
            location: '',
            itinerary: ''
          }
        }))
        return [...prev, languageCode]
      }
    })
  }

  const handleTranslationChange = (languageCode: string, field: keyof TranslationData, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [languageCode]: {
        ...prev[languageCode],
        [field]: value
      }
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      const response = await uploadTourImage(file)
      
      // Convert relative URL to absolute URL
      const imageUrl = response.url.startsWith('http') 
        ? response.url 
        : `${window.location.origin}${response.url}`
      
      // Add to images array
      const newImage: TourImage = {
        image_url: imageUrl,
        is_main: images.length === 0, // First image is main by default
        display_order: images.length,
        alt_text: ''
      }
      setImages(prev => [...prev, newImage])
      
      // Also set as legacy image_url for backward compatibility
      if (images.length === 0) {
        setFormData(prev => ({ ...prev, image_url: imageUrl }))
        setImagePreview(imageUrl)
      }
      
      alert('Image uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleAddImageUrl = () => {
    if (!formData.image_url.trim()) {
      alert('Please enter an image URL')
      return
    }

    const newImage: TourImage = {
      image_url: formData.image_url,
      is_main: images.length === 0,
      display_order: images.length,
      alt_text: ''
    }
    setImages(prev => [...prev, newImage])
    
    // Set preview for first image
    if (images.length === 0) {
      setImagePreview(formData.image_url)
    }
    
    // Clear the input
    setFormData(prev => ({ ...prev, image_url: '' }))
  }

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    
    // Reorder remaining images
    const reorderedImages = updatedImages.map((img, i) => ({
      ...img,
      display_order: i,
      is_main: i === 0 // First image becomes main
    }))
    
    setImages(reorderedImages)
    
    // Update preview
    if (reorderedImages.length > 0) {
      setImagePreview(reorderedImages[0].image_url)
      setFormData(prev => ({ ...prev, image_url: reorderedImages[0].image_url }))
    } else {
      setImagePreview('')
      setFormData(prev => ({ ...prev, image_url: '' }))
    }
  }

  const handleSetMainImage = (index: number) => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      is_main: i === index
    }))
    setImages(updatedImages)
    setImagePreview(updatedImages[index].image_url)
    setFormData(prev => ({ ...prev, image_url: updatedImages[index].image_url }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert translations object to array
    const translationsArray = Object.values(translations).filter(t => 
      t.title.trim() !== '' && t.description.trim() !== ''
    )
    
    // Validate that at least English translation is provided
    if (!translationsArray.some(t => t.language_code === 'en')) {
      alert('English translation is required')
      return
    }
    
    // Validate that all selected languages have translations
    const missingTranslations = selectedLanguages.filter(langCode => 
      !translationsArray.some(t => t.language_code === langCode)
    )
    
    if (missingTranslations.length > 0) {
      const missingLangNames = missingTranslations
        .map(code => activeLanguages.find(l => l.code === code)?.name || code)
        .join(', ')
      alert(`Please provide translations for: ${missingLangNames}`)
      return
    }
    
    const submitData = {
      ...formData,
      translations: translationsArray,
      images: images.length > 0 ? images : undefined
    }
    
    // Debug logging
    console.log('📋 TourForm submitting data:', submitData)
    console.log('📋 Images array:', images)
    console.log('📋 Images count:', images.length)
    
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
      {/* Language Selection Section */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Languages for Translation</h3>
        {loadingLanguages ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading languages...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {activeLanguages.map(language => (
              <label
                key={language.code}
                className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedLanguages.includes(language.code)
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${language.code === 'en' ? 'opacity-100' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(language.code)}
                  onChange={() => handleLanguageToggle(language.code)}
                  disabled={language.code === 'en'}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-2xl">{language.flag_emoji}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800">{language.name}</span>
                  <span className="text-xs text-gray-500">{language.code.toUpperCase()}</span>
                </div>
                {language.code === 'en' && (
                  <span className="ml-auto text-xs text-orange-600 font-medium">Required</span>
                )}
              </label>
            ))}
          </div>
        )}
        {selectedLanguages.length > 0 && (
          <p className="mt-3 text-sm text-gray-600">
            Selected: {selectedLanguages.length} language{selectedLanguages.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Translation Tabs */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Tour Translations</h3>
        
        {/* Tab Headers */}
        <div className="flex gap-2 border-b border-gray-200 mb-4">
          {selectedLanguages.map(langCode => {
            const language = activeLanguages.find(l => l.code === langCode)
            if (!language) return null
            
            return (
              <button
                key={langCode}
                type="button"
                onClick={() => setActiveTab(langCode)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === langCode
                    ? 'border-orange-500 text-orange-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="text-xl">{language.flag_emoji}</span>
                <span>{language.name}</span>
                {langCode === 'en' && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">Required</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {selectedLanguages.map(langCode => {
          if (activeTab !== langCode) return null
          
          const translation = translations[langCode] || {
            language_code: langCode,
            title: '',
            description: '',
            location: '',
            itinerary: ''
          }

          return (
            <div key={langCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={translation.title}
                  onChange={(e) => handleTranslationChange(langCode, 'title', e.target.value)}
                  required={langCode === 'en'}
                  placeholder={`Enter tour title in ${activeLanguages.find(l => l.code === langCode)?.name}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={translation.location}
                  onChange={(e) => handleTranslationChange(langCode, 'location', e.target.value)}
                  required={langCode === 'en'}
                  placeholder={`Enter location in ${activeLanguages.find(l => l.code === langCode)?.name}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  value={translation.description}
                  onChange={(value) => handleTranslationChange(langCode, 'description', value)}
                  placeholder={`Write a detailed tour description in ${activeLanguages.find(l => l.code === langCode)?.name}...`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Itinerary
                </label>
                <textarea
                  value={translation.itinerary}
                  onChange={(e) => handleTranslationChange(langCode, 'itinerary', e.target.value)}
                  placeholder={`Enter itinerary details in ${activeLanguages.find(l => l.code === langCode)?.name}`}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Non-translatable fields */}
      <div className="mb-6 pb-6 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Tour Details (Non-translatable)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (EUR €)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              required
              placeholder="e.g., 3 days"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
            <input
              type="number"
              name="max_participants"
              value={formData.max_participants}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
            <select
              name="difficulty_level"
              value={formData.difficulty_level}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Challenging">Challenging</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tour Type</label>
            <select
              name="tour_type"
              value={formData.tour_type || 'tour'}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="tour">🗺️ Multi-Day Tour</option>
              <option value="excursion">🎯 Day Excursion</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Tours: Multi-day packages • Excursions: Day trips
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tour Images</label>

        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={img.image_url}
                  alt={`Tour image ${index + 1}`}
                  className={`w-full h-32 object-cover rounded-md border-2 ${
                    img.is_main ? 'border-orange-500' : 'border-gray-300'
                  }`}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Image+Error'
                  }}
                />
                {img.is_main && (
                  <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Main
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-md flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {!img.is_main && (
                    <button
                      type="button"
                      onClick={() => handleSetMainImage(index)}
                      className="bg-white text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-100"
                      title="Set as main image"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File Upload Button */}
        <div className="mb-3">
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload from Computer
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">Max 10MB • JPG, PNG, WEBP</p>
        </div>

        {/* OR Divider */}
        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-sm text-gray-500">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* URL Input */}
        <div className="flex gap-2">
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="button"
            onClick={handleAddImageUrl}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {images.length === 0 ? 'Add at least one image' : `${images.length} image(s) added`}
        </p>
      </div>



      <div className="flex gap-2 mt-6">
        <button
          type="submit"
          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {submitText}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  )
}

export default TourForm