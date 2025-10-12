import React, { useState, useEffect } from 'react'
import { Tag as TagIcon, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { toursService, Tag, TourTag } from '../api/tours'
import toast from 'react-hot-toast'

interface TagManagerProps {
  tourId?: string
  tourTitle?: string
  mode: 'global' | 'tour'
}

const TagManager: React.FC<TagManagerProps> = ({ tourId, tourTitle, mode }) => {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [tourTags, setTourTags] = useState<TourTag[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    icon: ''
  })

  useEffect(() => {
    fetchData()
  }, [tourId, mode])

  const fetchData = async () => {
    try {
      setLoading(true)
      const tags = await toursService.getAllTags()
      setAllTags(tags)
      
      if (mode === 'tour' && tourId) {
        const tTags = await toursService.getTourTags(tourId)
        setTourTags(tTags)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = async () => {
    try {
      await toursService.createTag(formData)
      toast.success('Tag created!')
      setShowAddForm(false)
      setFormData({ name: '', icon: '' })
      fetchData()
    } catch (error) {
      toast.error('Failed to create tag')
      console.error(error)
    }
  }

  const handleUpdateTag = async (tagId: string) => {
    try {
      await toursService.updateTag(tagId, formData)
      toast.success('Tag updated!')
      setEditingId(null)
      fetchData()
    } catch (error) {
      toast.error('Failed to update tag')
      console.error(error)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Delete this tag? It will be removed from all tours.')) return
    
    try {
      await toursService.deleteTag(tagId)
      toast.success('Tag deleted!')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete tag')
      console.error(error)
    }
  }

  const handleAddToTour = async (tagId: string) => {
    if (!tourId) return
    
    try {
      await toursService.addTagToTour(tourId, tagId)
      toast.success('Tag added to tour!')
      fetchData()
    } catch (error) {
      toast.error('Failed to add tag to tour')
      console.error(error)
    }
  }

  const handleRemoveFromTour = async (tagId: string) => {
    if (!tourId) return
    
    try {
      await toursService.removeTagFromTour(tourId, tagId)
      toast.success('Tag removed from tour!')
      fetchData()
    } catch (error) {
      toast.error('Failed to remove tag from tour')
      console.error(error)
    }
  }

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setFormData({
      name: tag.name,
      icon: tag.icon || ''
    })
  }

  const isTagInTour = (tagId: string) => {
    return tourTags.some(tt => tt.tag_id === tagId)
  }

  if (loading) {
    return <div className="text-center py-4">Loading tags...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TagIcon className="w-5 h-5 text-moroccan-terracotta" />
          {mode === 'global' ? 'All Tags' : `Tags for: ${tourTitle}`}
        </h3>
        {mode === 'global' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Tag
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && mode === 'global' && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-moroccan-terracotta">
          <h4 className="font-medium mb-3">New Tag</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tag Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Free Wi-Fi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icon (emoji)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="🌐"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAddTag} className="btn-primary text-sm">
              <Save className="w-4 h-4 inline mr-1" /> Save
            </button>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary text-sm">
              <X className="w-4 h-4 inline mr-1" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tags List */}
      <div className="space-y-2">
        {allTags.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tags available. Create one to get started!
          </div>
        ) : (
          allTags.map((tag) => (
            <div
              key={tag.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                mode === 'tour' && isTagInTour(tag.id)
                  ? 'bg-moroccan-sand border-moroccan-terracotta'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                {editingId === tag.id ? (
                  <>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-16 px-2 py-1 border rounded text-center"
                      placeholder="🌐"
                    />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="flex-1 px-2 py-1 border rounded"
                    />
                  </>
                ) : (
                  <>
                    <span className="text-2xl">{tag.icon}</span>
                    <span className="font-medium">{tag.name}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {mode === 'global' && (
                  <>
                    {editingId === tag.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateTag(tag.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                )}

                {mode === 'tour' && tourId && (
                  <>
                    {isTagInTour(tag.id) ? (
                      <button
                        onClick={() => handleRemoveFromTour(tag.id)}
                        className="btn-secondary text-sm"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddToTour(tag.id)}
                        className="btn-primary text-sm"
                      >
                        Add
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TagManager
