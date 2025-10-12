import React, { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { toursService, GroupPricing } from '../api/tours'
import toast from 'react-hot-toast'

interface GroupPricingManagerProps {
  tourId: string
  tourTitle: string
}

const GroupPricingManager: React.FC<GroupPricingManagerProps> = ({ tourId, tourTitle }) => {
  const [pricingTiers, setPricingTiers] = useState<GroupPricing[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    min_participants: 1,
    max_participants: 2,
    price_per_person: 0
  })

  useEffect(() => {
    fetchPricing()
  }, [tourId])

  const fetchPricing = async () => {
    try {
      setLoading(true)
      const pricing = await toursService.getGroupPricing(tourId)
      setPricingTiers(pricing.sort((a, b) => a.min_participants - b.min_participants))
    } catch (error) {
      console.error('Error fetching pricing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      await toursService.createGroupPricing(tourId, formData)
      toast.success('Pricing tier added!')
      setShowAddForm(false)
      setFormData({ min_participants: 1, max_participants: 2, price_per_person: 0 })
      fetchPricing()
    } catch (error) {
      toast.error('Failed to add pricing tier')
      console.error(error)
    }
  }

  const handleUpdate = async (pricingId: string) => {
    try {
      await toursService.updateGroupPricing(pricingId, formData)
      toast.success('Pricing tier updated!')
      setEditingId(null)
      fetchPricing()
    } catch (error) {
      toast.error('Failed to update pricing tier')
      console.error(error)
    }
  }

  const handleDelete = async (pricingId: string) => {
    if (!confirm('Delete this pricing tier?')) return
    
    try {
      await toursService.deleteGroupPricing(pricingId)
      toast.success('Pricing tier deleted!')
      fetchPricing()
    } catch (error) {
      toast.error('Failed to delete pricing tier')
      console.error(error)
    }
  }

  const startEdit = (pricing: GroupPricing) => {
    setEditingId(pricing.id)
    setFormData({
      min_participants: pricing.min_participants,
      max_participants: pricing.max_participants,
      price_per_person: pricing.price_per_person
    })
  }

  if (loading) {
    return <div className="text-center py-4">Loading pricing...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-moroccan-terracotta" />
          Group Pricing for: {tourTitle}
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Tier
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-moroccan-terracotta">
          <h4 className="font-medium mb-3">New Pricing Tier</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Min People</label>
              <input
                type="number"
                min="1"
                value={formData.min_participants}
                onChange={(e) => setFormData({ ...formData, min_participants: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max People</label>
              <input
                type="number"
                min="1"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price/Person (MAD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price_per_person}
                onChange={(e) => setFormData({ ...formData, price_per_person: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="btn-primary text-sm">
              <Save className="w-4 h-4 inline mr-1" /> Save
            </button>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary text-sm">
              <X className="w-4 h-4 inline mr-1" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pricing Tiers Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Person</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pricingTiers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  No pricing tiers yet. Add one to get started!
                </td>
              </tr>
            ) : (
              pricingTiers.map((pricing) => (
                <tr key={pricing.id}>
                  <td className="px-4 py-3">
                    {editingId === pricing.id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={formData.min_participants}
                          onChange={(e) => setFormData({ ...formData, min_participants: Number(e.target.value) })}
                          className="w-20 px-2 py-1 border rounded text-sm"
                        />
                        <span className="py-1">-</span>
                        <input
                          type="number"
                          value={formData.max_participants}
                          onChange={(e) => setFormData({ ...formData, max_participants: Number(e.target.value) })}
                          className="w-20 px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    ) : (
                      <span className="font-medium">
                        {pricing.min_participants}-{pricing.max_participants} people
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === pricing.id ? (
                      <input
                        type="number"
                        value={formData.price_per_person}
                        onChange={(e) => setFormData({ ...formData, price_per_person: Number(e.target.value) })}
                        className="w-32 px-2 py-1 border rounded text-sm"
                      />
                    ) : (
                      <span className="text-moroccan-terracotta font-semibold">
                        {pricing.price_per_person} MAD
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === pricing.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleUpdate(pricing.id)}
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
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(pricing)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pricing.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default GroupPricingManager
