import { useState, useEffect } from 'react'
import api from '../api/axios'

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Bills', 'Other']
const CATEGORY_ICONS = {
  Food: '🍕', Transport: '🚗', Shopping: '🛍️',
  Entertainment: '🎬', Health: '💊', Bills: '📄', Other: '📦'
}

export default function BudgetSettings() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [totalLimit, setTotalLimit] = useState('')
  const [categoryLimits, setCategoryLimits] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [summary, setSummary] = useState(null)

  useEffect(() => { fetchBudget() }, [month])

  const fetchBudget = async () => {
    try {
      const [budgetRes, summaryRes] = await Promise.all([
        api.get(`/budget/${month}`),
        api.get(`/expenses/summary/${month}`)
      ])
      setTotalLimit(budgetRes.data.total_limit || '')
      setCategoryLimits(budgetRes.data.category_limits || {})
      setSummary(summaryRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.post(`/budget/${month}`, {
        total_limit: parseFloat(totalLimit) || 0,
        category_limits: Object.fromEntries(
          Object.entries(categoryLimits).filter(([_, v]) => v > 0)
        )
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      alert('Failed to save budget')
    } finally {
      setLoading(false)
    }
  }

  const setCatLimit = (cat, val) => {
    setCategoryLimits(prev => ({ ...prev, [cat]: parseFloat(val) || 0 }))
  }

  const totalSpent = summary?.total || 0

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Budget Settings</h2>
      <p className="text-gray-500 text-sm mb-5">Set spending limits for the month</p>

      {/* Month Picker */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm text-center">
          ✅ Budget saved successfully!
        </div>
      )}

      {/* Total Budget */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h3 className="font-semibold text-gray-700 mb-3">Total Monthly Budget</h3>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
          <input
            type="number"
            value={totalLimit}
            onChange={e => setTotalLimit(e.target.value)}
            className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="0"
          />
        </div>
        {totalLimit > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Spent: ₹{totalSpent.toLocaleString('en-IN')}</span>
              <span>Limit: ₹{parseFloat(totalLimit).toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${totalSpent > totalLimit ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min((totalSpent / totalLimit) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Budgets */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h3 className="font-semibold text-gray-700 mb-4">Category Limits</h3>
        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const limit = categoryLimits[cat] || 0
            const spent = summary?.by_category?.[cat]?.total || 0
            const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm flex items-center gap-1.5 font-medium text-gray-700">
                    {CATEGORY_ICONS[cat]} {cat}
                  </label>
                  <span className="text-xs text-gray-400">Spent: ₹{spent.toLocaleString('en-IN')}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={categoryLimits[cat] || ''}
                    onChange={e => setCatLimit(cat, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="No limit"
                  />
                </div>
                {limit > 0 && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                    <div
                      className={`h-1.5 rounded-full ${spent > limit ? 'bg-red-500' : pct > 80 ? 'bg-yellow-400' : 'bg-green-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Budget'}
      </button>
    </div>
  )
}
