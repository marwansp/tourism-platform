import React, { useState, useEffect } from 'react'
import { toursService, TourInfoSection, TourInfoSectionCreate, TourInfoSectionUpdate } from '../api/tours'
import RichTextEditor from './RichTextEditor'
import { Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown } from 'lucide-react'

interface TourInfoSectionsManagerProps {
    tourId: string
}

const TourInfoSectionsManager: React.FC<TourInfoSectionsManagerProps> = ({ tourId }) => {
    const [sections, setSections] = useState<TourInfoSection[]>([])
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [activeTab, setActiveTab] = useState<'en' | 'fr'>('en')
    
    const [formData, setFormData] = useState({
        title_en: '',
        title_fr: '',
        content_en: '',
        content_fr: '',
        display_order: 0
    })

    useEffect(() => {
        if (tourId) {
            fetchSections()
        }
    }, [tourId])

    const fetchSections = async () => {
        try {
            setLoading(true)
            const data = await toursService.getTourInfoSections(tourId)
            setSections(data)
        } catch (error) {
            console.error('Error fetching sections:', error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            title_en: '',
            title_fr: '',
            content_en: '',
            content_fr: '',
            display_order: sections.length
        })
        setEditingId(null)
        setIsAdding(false)
        setActiveTab('en')
    }

    const handleEdit = (section: TourInfoSection) => {
        setFormData({
            title_en: section.title_en,
            title_fr: section.title_fr,
            content_en: section.content_en,
            content_fr: section.content_fr,
            display_order: section.display_order
        })
        setEditingId(section.id)
        setIsAdding(false)
    }

    const handleSave = async () => {
        try {
            if (editingId) {
                await toursService.updateTourInfoSection(editingId, formData)
            } else {
                await toursService.createTourInfoSection(tourId, formData)
            }
            await fetchSections()
            resetForm()
        } catch (error) {
            console.error('Error saving section:', error)
            alert('Failed to save section')
        }
    }

    const handleDelete = async (sectionId: string) => {
        if (!confirm('Are you sure you want to delete this section?')) return
        
        try {
            await toursService.deleteTourInfoSection(sectionId)
            await fetchSections()
        } catch (error) {
            console.error('Error deleting section:', error)
            alert('Failed to delete section')
        }
    }

    const handleMoveUp = async (index: number) => {
        if (index === 0) return
        
        const newSections = [...sections]
        const temp = newSections[index]
        newSections[index] = newSections[index - 1]
        newSections[index - 1] = temp
        
        const orders = newSections.map((s, i) => ({ id: s.id, display_order: i }))
        
        try {
            await toursService.reorderTourInfoSections(tourId, orders)
            await fetchSections()
        } catch (error) {
            console.error('Error reordering sections:', error)
        }
    }

    const handleMoveDown = async (index: number) => {
        if (index === sections.length - 1) return
        
        const newSections = [...sections]
        const temp = newSections[index]
        newSections[index] = newSections[index + 1]
        newSections[index + 1] = temp
        
        const orders = newSections.map((s, i) => ({ id: s.id, display_order: i }))
        
        try {
            await toursService.reorderTourInfoSections(tourId, orders)
            await fetchSections()
        } catch (error) {
            console.error('Error reordering sections:', error)
        }
    }

    if (loading) {
        return <div className="text-center py-4">Loading sections...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Tour Information Sections</h3>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => {
                            setIsAdding(true)
                            setFormData({ ...formData, display_order: sections.length })
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Section
                    </button>
                )}
            </div>

            {/* Add/Edit Form */}
            {(isAdding || editingId) && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-semibold text-gray-900">
                            {editingId ? 'Edit Section' : 'Add New Section'}
                        </h4>
                        <button
                            onClick={resetForm}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Language Tabs */}
                    <div className="flex gap-2 mb-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('en')}
                            className={`px-4 py-2 font-medium ${
                                activeTab === 'en'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => setActiveTab('fr')}
                            className={`px-4 py-2 font-medium ${
                                activeTab === 'fr'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Français
                        </button>
                    </div>

                    {/* English Fields */}
                    {activeTab === 'en' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title (English)
                                </label>
                                <input
                                    type="text"
                                    value={formData.title_en}
                                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Driver Information"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Content (English)
                                </label>
                                <RichTextEditor
                                    value={formData.content_en}
                                    onChange={(value) => setFormData({ ...formData, content_en: value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* French Fields */}
                    {activeTab === 'fr' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Titre (Français)
                                </label>
                                <input
                                    type="text"
                                    value={formData.title_fr}
                                    onChange={(e) => setFormData({ ...formData, title_fr: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Informations sur le Chauffeur"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contenu (Français)
                                </label>
                                <RichTextEditor
                                    value={formData.content_fr}
                                    onChange={(value) => setFormData({ ...formData, content_fr: value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Save className="w-4 h-4" />
                            Save Section
                        </button>
                    </div>
                </div>
            )}

            {/* Sections List */}
            <div className="space-y-3">
                {sections.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No information sections yet. Click "Add Section" to create one.
                    </div>
                ) : (
                    sections.map((section, index) => (
                        <div
                            key={section.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{section.title_en}</h4>
                                    <p className="text-sm text-gray-500 mt-1">{section.title_fr}</p>
                                    <div className="text-xs text-gray-400 mt-2">
                                        Order: {section.display_order}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {/* Move Up/Down */}
                                    <button
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                        className={`p-1 rounded ${
                                            index === 0
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === sections.length - 1}
                                        className={`p-1 rounded ${
                                            index === sections.length - 1
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                    
                                    {/* Edit */}
                                    <button
                                        onClick={() => handleEdit(section)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    
                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(section.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default TourInfoSectionsManager
