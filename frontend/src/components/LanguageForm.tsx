import React, { useState, useEffect } from 'react'
import { Save, X } from 'lucide-react'
import { Language, LanguageCreate, LanguageUpdate } from '../api/languages'

interface LanguageFormProps {
  language?: Language | null
  onSubmit: (data: LanguageCreate | LanguageUpdate) => Promise<void>
  onCancel: () => void
  mode: 'create' | 'edit'
}

interface FormData {
  code: string
  name: string
  native_name: string
  flag_emoji: string
  is_active: boolean
}

interface ValidationErrors {
  code?: string
  name?: string
  native_name?: string
  flag_emoji?: string
}

// Common flag emojis for quick selection
const COMMON_FLAGS = [
  { code: 'es', emoji: '🇪🇸', name: 'Spanish' },
  { code: 'de', emoji: '🇩🇪', name: 'German' },
  { code: 'it', emoji: '🇮🇹', name: 'Italian' },
  { code: 'pt', emoji: '🇵🇹', name: 'Portuguese' },
  { code: 'ar', emoji: '🇸🇦', name: 'Arabic' },
  { code: 'zh', emoji: '🇨🇳', name: 'Chinese' },
  { code: 'ja', emoji: '🇯🇵', name: 'Japanese' },
  { code: 'ko', emoji: '🇰🇷', name: 'Korean' },
  { code: 'ru', emoji: '🇷🇺', name: 'Russian' },
  { code: 'nl', emoji: '🇳🇱', name: 'Dutch' },
  { code: 'pl', emoji: '🇵🇱', name: 'Polish' },
  { code: 'tr', emoji: '🇹🇷', name: 'Turkish' },
  { code: 'sv', emoji: '🇸🇪', name: 'Swedish' },
  { code: 'da', emoji: '🇩🇰', name: 'Danish' },
  { code: 'no', emoji: '🇳🇴', name: 'Norwegian' },
  { code: 'fi', emoji: '🇫🇮', name: 'Finnish' },
  { code: 'el', emoji: '🇬🇷', name: 'Greek' },
  { code: 'cs', emoji: '🇨🇿', name: 'Czech' },
  { code: 'hu', emoji: '🇭🇺', name: 'Hungarian' },
  { code: 'ro', emoji: '🇷🇴', name: 'Romanian' },
]

const LanguageForm: React.FC<LanguageFormProps> = ({
  language,
  onSubmit,
  onCancel,
  mode
}) => {
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    native_name: '',
    flag_emoji: '',
    is_active: true
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Initialize form data when editing
  useEffect(() => {
    if (mode === 'edit' && language) {
      setFormData({
        code: language.code,
        name: language.name,
        native_name: language.native_name,
        flag_emoji: language.flag_emoji,
        is_active: language.is_active
      })
    }
  }, [language, mode])

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validate code (only for create mode)
    if (mode === 'create') {
      if (!formData.code) {
        newErrors.code = 'Language code is required'
      } else if (!/^[a-z]{2}$/.test(formData.code)) {
        newErrors.code = 'Code must be exactly 2 lowercase letters (e.g., es, de, ar)'
      }
    }

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'English name is required'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less'
    }

    // Validate native_name
    if (!formData.native_name.trim()) {
      newErrors.native_name = 'Native name is required'
    } else if (formData.native_name.length > 100) {
      newErrors.native_name = 'Native name must be 100 characters or less'
    }

    // Validate flag_emoji
    if (!formData.flag_emoji.trim()) {
      newErrors.flag_emoji = 'Flag emoji is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    
    let processedValue = value
    
    // Auto-lowercase the code field
    if (name === 'code') {
      processedValue = value.toLowerCase()
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }))

    // Clear error for this field when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setFormData(prev => ({ ...prev, flag_emoji: emoji }))
    setShowEmojiPicker(false)
    if (errors.flag_emoji) {
      setErrors(prev => ({ ...prev, flag_emoji: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'create') {
        const createData: LanguageCreate = {
          code: formData.code,
          name: formData.name,
          native_name: formData.native_name,
          flag_emoji: formData.flag_emoji,
          is_active: formData.is_active
        }
        await onSubmit(createData)
      } else {
        const updateData: LanguageUpdate = {
          name: formData.name,
          native_name: formData.native_name,
          flag_emoji: formData.flag_emoji,
          is_active: formData.is_active
        }
        await onSubmit(updateData)
      }
    } catch (error) {
      // Error handling is done in parent component
      console.error('Form submission error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg border-2 border-moroccan-terracotta">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-lg">
          {mode === 'edit' ? 'Edit Language' : 'Add New Language'}
        </h4>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Language Code */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Language Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.code ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., es, de, ar"
              maxLength={2}
              disabled={mode === 'edit'}
            />
            {errors.code && (
              <p className="text-xs text-red-500 mt-1">{errors.code}</p>
            )}
            {!errors.code && (
              <p className="text-xs text-gray-500 mt-1">
                2 lowercase letters (ISO 639-1 standard)
              </p>
            )}
          </div>

          {/* Flag Emoji */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Flag Emoji <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="flag_emoji"
                value={formData.flag_emoji}
                onChange={handleInputChange}
                className={`flex-1 px-3 py-2 border rounded-md text-2xl ${
                  errors.flag_emoji ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="🇪🇸"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
              >
                {showEmojiPicker ? 'Hide' : 'Pick'}
              </button>
            </div>
            {errors.flag_emoji && (
              <p className="text-xs text-red-500 mt-1">{errors.flag_emoji}</p>
            )}
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="mt-2 p-3 bg-white border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                <p className="text-xs text-gray-600 mb-2 font-medium">Common Flags:</p>
                <div className="grid grid-cols-4 gap-2">
                  {COMMON_FLAGS.map((flag) => (
                    <button
                      key={flag.code}
                      type="button"
                      onClick={() => handleEmojiSelect(flag.emoji)}
                      className="p-2 hover:bg-gray-100 rounded text-2xl text-center"
                      title={flag.name}
                    >
                      {flag.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* English Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              English Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Spanish"
              maxLength={100}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Native Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Native Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="native_name"
              value={formData.native_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.native_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Español"
              maxLength={100}
            />
            {errors.native_name && (
              <p className="text-xs text-red-500 mt-1">{errors.native_name}</p>
            )}
          </div>
        </div>

        {/* Active Checkbox */}
        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="w-4 h-4 text-moroccan-terracotta rounded focus:ring-moroccan-terracotta"
            />
            <span className="text-sm font-medium">Active</span>
            <span className="text-xs text-gray-500">
              (Inactive languages won't appear in the language switcher)
            </span>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex gap-2 mt-6">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-sm flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {mode === 'edit' ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {mode === 'edit' ? 'Update' : 'Create'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default LanguageForm
