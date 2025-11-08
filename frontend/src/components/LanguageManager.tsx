import React, { useState, useEffect } from 'react'
import { Globe, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { languagesService, Language, LanguageCreate, LanguageUpdate } from '../api/languages'
import toast from 'react-hot-toast'

const LanguageManager: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<LanguageCreate>({
    code: '',
    name: '',
    native_name: '',
    flag_emoji: '',
    is_active: true
  })

  useEffect(() => {
    fetchLanguages()
  }, [])

  const fetchLanguages = async () => {
    try {
      setLoading(true)
      const data = await languagesService.getAllLanguages()
      setLanguages(data)
    } catch (error) {
      console.error('Error fetching languages:', error)
      toast.error('Failed to load languages')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      native_name: '',
      flag_emoji: '',
      is_active: true
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const startEdit = (language: Language) => {
    setEditingId(language.id)
    setFormData({
      code: language.code,
      name: language.name,
      native_name: language.native_name,
      flag_emoji: language.flag_emoji,
      is_active: language.is_active
    })
    setShowAddForm(false)
  }

  const handleAddLanguage = async () => {
    // Validate code format
    if (!/^[a-z]{2}$/.test(formData.code)) {
      toast.error('Language code must be exactly 2 lowercase letters')
      return
    }

    if (!formData.name || !formData.native_name || !formData.flag_emoji) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await languagesService.createLanguage(formData)
      toast.success('Language created successfully!')
      resetForm()
      fetchLanguages()
    } catch (error: any) {
      console.error('Error creating language:', error)
      if (error.response?.status === 409) {
        toast.error('Language code already exists')
      } else {
        toast.error('Failed to create language')
      }
    }
  }

  const handleUpdateLanguage = async (id: string) => {
    if (!formData.name || !formData.native_name || !formData.flag_emoji) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const updateData: LanguageUpdate = {
        name: formData.name,
        native_name: formData.native_name,
        flag_emoji: formData.flag_emoji,
        is_active: formData.is_active
      }
      await languagesService.updateLanguage(id, updateData)
      toast.success('Language updated successfully!')
      resetForm()
      fetchLanguages()
    } catch (error: any) {
      console.error('Error updating language:', error)
      if (error.response?.status === 400) {
        toast.error('Cannot deactivate the default language')
      } else {
        toast.error('Failed to update language')
      }
    }
  }

  const handleDeleteLanguage = async (id: string, language: Language) => {
    if (language.is_default) {
      toast.error('Cannot delete the default language')
      return
    }

    if (!confirm(`Delete ${language.name}? This action cannot be undone.`)) {
      return
    }

    try {
      await languagesService.deleteLanguage(id)
      toast.success('Language deleted successfully!')
      fetchLanguages()
    } catch (error: any) {
      console.error('Error deleting language:', error)
      if (error.response?.status === 409) {
        toast.error('Cannot delete: Tours are using this language')
      } else if (error.response?.status === 400) {
        toast.error('Cannot delete the default language')
      } else {
        toast.error('Failed to delete language')
      }
    }
  }

  const handleToggleActive = async (id: string, language: Language, newStatus: boolean) => {
    if (language.is_default && !newStatus) {
      toast.error('Cannot deactivate the default language')
      return
    }

    try {
      const updateData: LanguageUpdate = {
        is_active: newStatus
      }
      await languagesService.updateLanguage(id, updateData)
      toast.success(`Language ${newStatus ? 'activated' : 'deactivated'}`)
      fetchLanguages()
    } catch (error) {
      console.error('Error toggling language status:', error)
      toast.error('Failed to update language status')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8 text-gray-500">Loading languages...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5 text-moroccan-terracotta" />
          Language Management
        </h3>
        {!showAddForm && !editingId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Language
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-moroccan-terracotta">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">
              {editingId ? 'Edit Language' : 'Add New Language'}
            </h4>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Language Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., es, de, ar"
                maxLength={2}
                disabled={!!editingId}
              />
              <p className="text-xs text-gray-500 mt-1">
                2 lowercase letters (ISO 639-1)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Flag Emoji <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.flag_emoji}
                onChange={(e) => setFormData({ ...formData, flag_emoji: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-2xl"
                placeholder="🇪🇸"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                English Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Spanish"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Native Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.native_name}
                onChange={(e) => setFormData({ ...formData, native_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Español"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-moroccan-terracotta rounded"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>

          <div className="flex gap-2 mt-4">
            {editingId ? (
              <button
                onClick={() => handleUpdateLanguage(editingId)}
                className="btn-primary text-sm"
              >
                <Save className="w-4 h-4 inline mr-1" /> Update
              </button>
            ) : (
              <button
                onClick={handleAddLanguage}
                className="btn-primary text-sm"
              >
                <Save className="w-4 h-4 inline mr-1" /> Create
              </button>
            )}
            <button
              onClick={resetForm}
              className="btn-secondary text-sm"
            >
              <X className="w-4 h-4 inline mr-1" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Languages Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Flag</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Native Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {languages.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No languages available. Create one to get started!
                </td>
              </tr>
            ) : (
              languages.map((language) => (
                <tr
                  key={language.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    language.is_default ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-2xl">{language.flag_emoji}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-medium">{language.code.toUpperCase()}</span>
                    {language.is_default && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">{language.name}</td>
                  <td className="py-3 px-4">{language.native_name}</td>
                  <td className="py-3 px-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={language.is_active}
                        onChange={(e) => handleToggleActive(language.id, language, e.target.checked)}
                        className="sr-only peer"
                        disabled={language.is_default}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {language.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(language)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLanguage(language.id, language)}
                        className={`p-1 ${
                          language.is_default
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-red-600 hover:text-red-800'
                        }`}
                        title="Delete"
                        disabled={language.is_default}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Message */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> The default language (English) cannot be deleted or deactivated.
          Languages with existing tour translations cannot be deleted.
        </p>
      </div>
    </div>
  )
}

export default LanguageManager
