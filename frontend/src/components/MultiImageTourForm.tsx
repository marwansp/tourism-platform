import React, { useState } from 'react'
import { Save, X, Plus, Trash2, Image as ImageIcon, Star, Upload, Loader2 } from 'lucide-react'
import { uploadTourImage } from '../api/media'
import toast from 'react-hot-toast'
import RichTextEditor from './RichTextEditor'

interface TourImage {
    image_url: string
    is_main: boolean
    display_order: number
    alt_text?: string
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
    // Multilingual fields
    title_fr?: string
    description_fr?: string
    location_fr?: string
    includes_fr?: string
}

interface MultiImageTourFormProps {
    mode: 'add' | 'edit'
    initialData?: TourFormData
    onSubmit: (data: TourFormData) => void
    onCancel: () => void
    multilingual?: boolean
}

const defaultFormData: TourFormData = {
    title: '',
    description: '',
    price: 0,
    duration: '',
    location: '',
    max_participants: 1,
    difficulty_level: 'Easy',
    includes: '',
    available_dates: '',
    images: [],
    title_fr: '',
    description_fr: '',
    location_fr: '',
    includes_fr: ''
}

const MultiImageTourForm: React.FC<MultiImageTourFormProps> = ({
    mode,
    initialData,
    onSubmit,
    onCancel,
    multilingual = false
}) => {
    const [formData, setFormData] = useState<TourFormData>(() => {
        return initialData || defaultFormData
    })
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
    const [activeLanguage, setActiveLanguage] = useState<'en' | 'fr'>('en')

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'max_participants' ? Number(value) : value
        }))
    }

    const handleDescriptionChange = (value: string) => {
        if (multilingual && activeLanguage === 'fr') {
            setFormData(prev => ({ ...prev, description_fr: value }))
        } else {
            setFormData(prev => ({ ...prev, description: value }))
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
        setFormData(prev => {
            const newImages = prev.images.filter((_, i) => i !== index)
            if (prev.images[index].is_main && newImages.length > 0) {
                newImages[0].is_main = true
            }
            return {
                ...prev,
                images: newImages.map((img, i) => ({ ...img, display_order: i }))
            }
        })
    }

    const updateImage = (index: number, field: keyof TourImage, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.map((img, i) => {
                if (i === index) {
                    if (field === 'is_main' && value === true) {
                        return { ...img, [field]: value }
                    }
                    return { ...img, [field]: value }
                } else if (field === 'is_main' && value === true) {
                    return { ...img, is_main: false }
                }
                return img
            })
        }))
    }

    const handleImageUpload = async (index: number, file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB')
            return
        }

        setUploadingIndex(index)
        try {
            const response = await uploadTourImage(file)
            updateImage(index, 'image_url', response.url)
            toast.success('Image uploaded successfully!')
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload image')
        } finally {
            setUploadingIndex(null)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validate multilingual fields
        if (multilingual) {
            if (!formData.title || !formData.title_fr) {
                toast.error('Please provide titles in both English and French')
                return
            }
            if (!formData.description || !formData.description_fr) {
                toast.error('Please provide descriptions in both English and French')
                return
            }
            if (!formData.location || !formData.location_fr) {
                toast.error('Please provide locations in both English and French')
                return
            }
        }

        // Filter out images with empty URLs
        const validImages = formData.images.filter(img => img.image_url && img.image_url.trim() !== '')

        if (validImages.length > 0) {
            const hasMain = validImages.some(img => img.is_main)
            if (!hasMain) {
                validImages[0].is_main = true
            }
        }

        // Submit with only valid images
        onSubmit({
            ...formData,
            images: validImages
        })
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4">
                {mode === 'add' ? 'Add New Tour' : 'Edit Tour'}
            </h3>

            {multilingual && (
                <div className="mb-6 flex gap-2 border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setActiveLanguage('en')}
                        className={`px-4 py-2 font-medium transition-colors ${
                            activeLanguage === 'en'
                                ? 'text-orange-600 border-b-2 border-orange-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        🇬🇧 English
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveLanguage('fr')}
                        className={`px-4 py-2 font-medium transition-colors ${
                            activeLanguage === 'fr'
                                ? 'text-orange-600 border-b-2 border-orange-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        🇫🇷 Français
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title {multilingual && `(${activeLanguage.toUpperCase()})`}
                        </label>
                        <input
                            type="text"
                            name={multilingual && activeLanguage === 'fr' ? "title_fr" : "title"}
                            value={multilingual && activeLanguage === 'fr' ? (formData.title_fr || '') : formData.title}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location {multilingual && `(${activeLanguage.toUpperCase()})`}
                        </label>
                        <input
                            type="text"
                            name={multilingual && activeLanguage === 'fr' ? "location_fr" : "location"}
                            value={multilingual && activeLanguage === 'fr' ? (formData.location_fr || '') : formData.location}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (EUR €)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            required
                            min="0"
                            step="0.01"
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
                            placeholder="e.g., 3 days / 2 nights"
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
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description {multilingual && `(${activeLanguage.toUpperCase()})`}
                    </label>
                    <RichTextEditor
                        value={multilingual && activeLanguage === 'fr' ? (formData.description_fr || '') : formData.description}
                        onChange={handleDescriptionChange}
                        placeholder="Write a detailed tour description with headings, bullet points, and formatting..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Includes (comma-separated) {multilingual && `(${activeLanguage.toUpperCase()})`}
                        </label>
                        <input
                            type="text"
                            name={multilingual && activeLanguage === 'fr' ? "includes_fr" : "includes"}
                            value={multilingual && activeLanguage === 'fr' ? (formData.includes_fr || '') : formData.includes}
                            onChange={handleInputChange}
                            placeholder="e.g., Meals, Transport, Guide"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Available Dates (comma-separated)</label>
                        <input
                            type="text"
                            name="available_dates"
                            value={formData.available_dates}
                            onChange={handleInputChange}
                            placeholder="e.g., 2024-12-01, 2024-12-15"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-700">Tour Images</h4>
                        <button
                            type="button"
                            onClick={addImage}
                            className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Image
                        </button>
                    </div>

                    {formData.images.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">No images added yet. Click "Add Image" to start.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {formData.images.map((image, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            {image.image_url ? (
                                                <img
                                                    src={image.image_url}
                                                    alt={image.alt_text || `Tour image ${index + 1}`}
                                                    className="w-20 h-20 object-cover rounded-md"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
                                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Image URL
                                                </label>
                                                
                                                {/* Upload Button */}
                                                <div className="mb-2">
                                                    <label className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-sm">
                                                        {uploadingIndex === index ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="w-4 h-4" />
                                                                Upload Image
                                                            </>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) {
                                                                    handleImageUpload(index, file)
                                                                }
                                                                e.target.value = ''
                                                            }}
                                                            disabled={uploadingIndex === index}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                    <span className="text-xs text-gray-500 ml-2">or enter URL below</span>
                                                </div>
                                                
                                                <input
                                                    type="text"
                                                    value={image.image_url}
                                                    onChange={(e) => updateImage(index, 'image_url', e.target.value)}
                                                    placeholder="https://example.com/image.jpg or upload above"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Alt Text (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={image.alt_text || ''}
                                                    onChange={(e) => updateImage(index, 'alt_text', e.target.value)}
                                                    placeholder="Description for accessibility"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                />
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={image.is_main}
                                                        onChange={(e) => updateImage(index, 'is_main', e.target.checked)}
                                                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                    />
                                                    <Star className={`w-4 h-4 ${image.is_main ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                                                    <span className="text-sm text-gray-700">Main Image</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="p-1 text-red-400 hover:text-red-600"
                                                title="Remove image"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {mode === 'add' ? 'Add Tour' : 'Update Tour'}
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
        </div>
    )
}

export default MultiImageTourForm