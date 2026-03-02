import { useState } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Bills', 'Other']
const CATEGORY_ICONS = {
  Food: '🍕', Transport: '🚗', Shopping: '🛍️',
  Entertainment: '🎬', Health: '💊', Bills: '📄', Other: '📦'
}

export default function AddExpense() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Food',
    type: 'expense',
    note: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/expenses/', { ...form, amount: parseFloat(form.amount) })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setForm({ title: '', amount: '', category: 'Food', type: 'expense', note: '', date: new Date().toISOString().split('T')[0] })
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Transaction</h2>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm text-center">
          ✅ Transaction added successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Type Toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        {['expense', 'income'].map((t) => (
          <button
            key={t}
            onClick={() => setForm({ ...form, type: t })}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              form.type === t
                ? t === 'expense' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                : 'text-gray-500'
            }`}
          >
            {t === 'expense' ? '💸 Expense' : '💰 Income'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="0.00"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Lunch at restaurant"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, category: cat })}
                className={`flex flex-col items-center p-2 rounded-xl border text-xs transition ${
                  form.category === cat
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="text-xl mb-1">{CATEGORY_ICONS[cat]}</span>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Any extra details..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-semibold text-base transition disabled:opacity-50 ${
            form.type === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {loading ? 'Adding...' : `Add ${form.type === 'expense' ? 'Expense' : 'Income'}`}
        </button>
      </form>
    </div>
  )
}
