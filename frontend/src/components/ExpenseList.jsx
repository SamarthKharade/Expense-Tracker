import { useState, useEffect } from 'react'
import api from '../api/axios'

const CATEGORY_ICONS = {
  Food: '🍕', Transport: '🚗', Shopping: '🛍️',
  Entertainment: '🎬', Health: '💊', Bills: '📄', Other: '📦'
}
const CATEGORIES = ['All', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Bills', 'Other']

export default function ExpenseList() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [filterCat, setFilterCat] = useState('All')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => { fetchExpenses() }, [month, filterCat])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = { month }
      if (filterCat !== 'All') params.category = filterCat
      const res = await api.get('/expenses/', { params })
      setExpenses(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    try {
      await api.delete(`/expenses/${id}`)
      setExpenses(expenses.filter(e => e.id !== id))
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const handleEdit = (exp) => {
    setEditingId(exp.id)
    setEditForm({
      title: exp.title,
      amount: exp.amount,
      category: exp.category,
      note: exp.note
    })
  }

  const handleUpdate = async (id) => {
    try {
      const res = await api.put(`/expenses/${id}`, editForm)
      setExpenses(expenses.map(e => e.id === id ? res.data : e))
      setEditingId(null)
    } catch (err) {
      alert('Failed to update')
    }
  }

  const total = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Transactions</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                filterCat === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat !== 'All' ? CATEGORY_ICONS[cat] + ' ' : ''}{cat}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-indigo-50 rounded-xl px-4 py-3 mb-4 flex justify-between items-center">
        <span className="text-sm text-indigo-600">{expenses.length} transactions</span>
        <span className="font-bold text-indigo-700">Total spent: ₹{total.toLocaleString('en-IN')}</span>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 animate-pulse">Loading...</div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>No transactions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <div key={exp.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              {editingId === exp.id ? (
                <div className="space-y-2">
                  <input
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                    placeholder="Title"
                  />
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                  />
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                  >
                    {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(exp.id)} className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm">Save</button>
                    <button onClick={() => setEditingId(null)} className="bg-gray-200 text-gray-600 px-3 py-1 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_ICONS[exp.category] || '📦'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{exp.title || exp.category}</p>
                      <p className="text-xs text-gray-400">
                        {exp.category} · {new Date(exp.date).toLocaleDateString('en-IN')}
                        {exp.note && ` · ${exp.note}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${exp.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {exp.type === 'income' ? '+' : '-'}₹{exp.amount.toLocaleString('en-IN')}
                    </span>
                    <button onClick={() => handleEdit(exp)} className="text-gray-400 hover:text-blue-500 text-xs">✏️</button>
                    <button onClick={() => handleDelete(exp.id)} className="text-gray-400 hover:text-red-500 text-xs">🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
