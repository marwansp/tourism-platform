import React, { useState } from 'react'
import { Save, X, Plus, Trash2, Upload, Loader2, Globe } from 'lucide-react'
import { uploadTourImage } from '../api/media'
import toast from 'react-hot-toast'
import RichTextEditor from './RichTextEditor'
import { useTranslation } from 'react-i18next'

interface TourImage {
    image_url: string
    is_main: boolean
    display_order: number
    alt_text?: string
}

interface Translation {
    title: string
    description: string
    location: string
    includes: string
}

interface MultilingualTourFormData {
    price: number
    duration: string
    max_participants: number
    difficulty_level: string
    available_dates: string
    translations: {
        en: Translation
        fr: Translation
    }
    images: TourImage[]
}

interface MultilingualTourFormProps {
    mode: 'add' | 'edit'
    initialData?: MultilingualTourFormData
    onSubmit: (data: MultilingualTourFormData) => void
    onCancel: () => void
}

const defaultTranslation: Translation = {
    title: '',
    description: '',
    location: '',
    includes: ''
}

const defaultFormData: MultilingualTourFormData = {
    price: 0,
    duration: '',
    max_participants: 1,
    difficulty_level: 'Easy',
    available_dates: '',
    translations: {
        en: { ...defaultTranslation },
        fr: { ...defaultTranslation }
    },
    images: []
}

const MultilingualTourForm: React.FC<MultilingualTourFormProps> = ({
    mode,
    initialData,
    onSubmit,
    onCancel
}) => {
    const { t } = useTranslation()
    const [formData, setFormData] = useState<MultilingualTourFormData>(() => {
        return initialData || defaultFormData
    })
    const [activeLanguage, setActiveLanguage] = useState<'en' | 'fr'>('en')
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'max_participants' ? Number(value) : value
        }))
    }

    const handleTranslationChange = (field: keyof Translation, value: string) => {
        setFormData(prev => ({
            ...prev,
            translations: {
                ...prev.translations,
                [activeLanguage]: {
                    ...prev.translations[activeLanguage],
                    [field]: value
                }
            }
        }))
    }

    const handleDescriptionChange = (value: string) => {
        handleTranslationChange('description', value)
    }

    const copyToOtherLanguage = () => {
        const sourceLang = activeLanguage
        const targetLang = activeLanguage === 'en' ? 'fr' : 'en'
        
        if (window.confirm(`Copy ${sourceLang.toUpperCase()} content to ${targetLang.toUpperCase()}? This will overwrite existing ${targetLang.toUpperCase()} content.`)) {
            setFormData(prev => ({
                ...prev,
                translations: {
                    ...prev.translations,
                    [targetLang]: { ...prev.translations[sourceLang] }
                }
            }))
            toast.success(`Content copied to ${targetLang.toUpperCase()}`)
        }
    }

    const addImage = () => {
        const newImage: TourImage = {
            image_url: '',
            is_main: formData.images.length === 0,
            display_order: formData.images.length,
            alt_text: ''
        }
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, newImage]
        }))
    }

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    const updateImage = (index: number, field: keyof TourImage, value: string | boolean | number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.map((img, i) => 
                i === index ? { ...img, [field]: value } : img
            )
        }))
    }

    const setMainImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.map((img, i) => ({
                ...img,
                is_main: i === index
            }))
        }))
    }

    const handleImageUpload = async (index: number, file: File) => {
        try {
            setUploadingIndex(index)
            const response = await uploadTourImage(file)
            updateImage(index, 'image_url', response.url)
            toast.success('Image uploaded successfully!')
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error('Failed to upload image')
        } finally {
            setUploadingIndex(null)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        // Validation
        if (!formData.translations.en.title || !formData.translations.fr.title) {
            toast.error('Please provide titles in both languages')
            return
        }
        
        if (!formData.translations.en.description || !formData.translations.fr.description) {
            toast.error('Please provide descriptions in both languages')
            return
        }
        
        if (!formData.translations.en.location || !formData.translations.fr.location) {
            toast.error('Please provide locations in both languages')
            return
        }
        
        if (formData.images.length === 0) {
            toast.error('Please add at least one image')
            return
        }
        
        onSubmit(formData)
    }

    const currentTranslation = formData.translations[activeLanguage]

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Language Tabs */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-moroccan-blue" />
                        <h3 className="text-lg font-semibold text-gray-900">Language</h3>
                    </div>
                    <button
                        type="button"
                        onClick={copyToOtherLanguage}
                        className="text-sm text-moroccan-blue hover:text-moroccan-terracotta transition-colors"
                    >
                        Copy to {activeLanguage === 'en' ? 'French' : 'English'}
                    </button>
                </div>
                
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveLanguage('en')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                            activeLanguage === 'en'
                                ? 'bg-moroccan-blue text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        🇬🇧 English
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveLanguage('fr')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                            activeLanguage === 'fr'
                                ? 'bg-moroccan-blue text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        🇫🇷 Français
                    </button>
                </div>
            </div>

            {/* Translatable Fields */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Content ({activeLanguage.toUpperCase()})
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                    </label>
                    <input
                        type="text"
                        value={currentTranslation.title}
                        onChange={(e) => handleTranslationChange('title', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-blue focus:border-transparent"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                    </label>
                    <RichTextEditor
                        value={currentTranslation.description}
                        onChange={handleDescriptionChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                    </label>
                    <input
                        type="text"
                        value={currentTranslation.location}
                        onChange={(e) => handleTranslationChange('location', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-blue focus:border-transparent"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Includes (comma-separated)
                    </label>
                    <textarea
                        value={currentTranslation.includes}
                        onChange={(e) => handleTranslationChange('includes', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-blue focus:border-transparent"
                        rows={3}
                        placeholder="Transportation, Guide, Meals, etc."
                    />
                </div>
            </div>

            {/* Non-translatable Fields */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tour Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price (MAD) *
                        </label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-blue focus:border-transparent"
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration *
                        </label>
                        <input
                            type="text"
                            name="duration"
                            value={formData.duration}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-blue focus:border-transparent"
                            placeholder="e.g., 3 days / 2 nights"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Participants *
                        </label>
                        <input
                            type="number"
                            name="max_participants"
                            value={formData.max_participants}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-blue focus:border-transparent"
                            required
                            min="1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Difficulty Level *
                        </label>
                        <select
                            name="difficulty_level"
                            value={formData.difficulty_level}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-blue focus:border-transparent"
                            required
                        >
                            <option value="Easy">Easy</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Challenging">Challenging</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Dates (comma-separated)
                    </label>
                    <input
                        type="text"
                        name="available_dates"
                        value={formData.available_dates}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-blue focus:border-transparent"
                        placeholder="2025-11-01, 2025-11-15, 2025-12-01"
                    />
                </div>
            </div>

            {/* Images Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Tour Images</h3>
                    <button
                        type="button"
                        onClick={addImage}
                        className="flex items-center gap-2 px-4 py-2 bg-moroccan-blue text-white rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Image
                    </button>
                </div>

                <div className="space-y-4">
                    {formData.images.map((image, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start gap-4">
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Image URL or Upload
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={image.image_url}
                                                onChange={(e) => updateImage(index, 'image_url', e.target.value)}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-blue focus:border-transparent"
                                                placeholder="https://example.com/image.jpg"
                                            />
                                            <label className="relative cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) handleImageUpload(index, file)
                                                    }}
                                                    className="hidden"
                                                    disabled={uploadingIndex === index}
                                                />
                                                <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                                                    {uploadingIndex === index ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Upload className="w-4 h-4" />
                                                    )}
                                                    Upload
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Alt Text
                                            </label>
                                            <input
                                                type="text"
                                                value={image.alt_text || ''}
                                                onChange={(e) => updateImage(index, 'alt_text', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-blue focus:border-transparent"
                                                placeholder="Image description"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Display Order
                                            </label>
                                            <input
                                                type="number"
                                                value={image.display_order}
                                                onChange={(e) => updateImage(index, 'display_order', Number(e.target.value))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-blue focus:border-transparent"
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={image.is_main}
                                                onChange={() => setMainImage(index)}
                                                className="w-4 h-4 text-moroccan-blue border-gray-300 rounded focus:ring-moroccan-blue"
                                            />
                                            <span className="text-sm text-gray-700">Main Image</span>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            {image.image_url && (
                                <div className="mt-3">
                                    <img
                                        src={image.image_url}
                                        alt={image.alt_text || 'Tour image'}
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    {formData.images.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No images added yet. Click "Add Image" to get started.
                        </div>
                    )}
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                    <X className="w-4 h-4" />
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-moroccan-terracotta text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {mode === 'add' ? 'Create Tour' : 'Update Tour'}
                </button>
            </div>
        </form>
    )
}

export default MultilingualTourForm
