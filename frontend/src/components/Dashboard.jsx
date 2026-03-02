import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CATEGORY_ICONS = {
  Food: '🍕', Transport: '🚗', Shopping: '🛍️',
  Entertainment: '🎬', Health: '💊', Bills: '📄', Other: '📦'
}

const CATEGORY_COLORS = {
  Food: '#6366f1', Transport: '#f59e0b', Shopping: '#10b981',
  Entertainment: '#f43f5e', Health: '#3b82f6', Bills: '#8b5cf6', Other: '#6b7280'
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [budget, setBudget] = useState(null)
  const [recentExpenses, setRecentExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  const currentMonth = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [summaryRes, budgetRes, expensesRes, incomeRes] = await Promise.all([
        api.get(`/expenses/summary/${currentMonth}`),
        api.get(`/budget/${currentMonth}`),
        api.get(`/expenses/?month=${currentMonth}`),
        api.get(`/expenses/?month=${currentMonth}&type=income`)
      ])
      setSummary(summaryRes.data)
      setBudget(budgetRes.data)
      setRecentExpenses(expensesRes.data.slice(0, 5))
      const totalIncome = incomeRes.data.reduce((sum, e) => sum + e.amount, 0)
      setSummary(prev => ({ ...summaryRes.data, totalIncome }))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 animate-pulse">Loading dashboard...</div>
    </div>
  )

  const totalSpent = summary?.total || 0
  const totalIncome = summary?.totalIncome || 0
  const netBalance = totalIncome - totalSpent
  const totalLimit = budget?.total_limit || 0
  const budgetUsedPct = totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0
  const isOverBudget = totalLimit > 0 && totalSpent > totalLimit

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={`₹${totalIncome.toLocaleString('en-IN')}`}
          icon="💰"
          color="green"
          sub="This month"
        />
        <StatCard
          title="Total Spent"
          value={`₹${totalSpent.toLocaleString('en-IN')}`}
          icon="💸"
          color="red"
          sub="This month"
        />
        <StatCard
          title="Net Balance"
          value={`₹${Math.abs(netBalance).toLocaleString('en-IN')}`}
          icon={netBalance >= 0 ? '📈' : '📉'}
          color={netBalance >= 0 ? 'green' : 'red'}
          sub={netBalance >= 0 ? 'Saved this month' : 'Overspent this month'}
        />
        <StatCard
          title="Budget Limit"
          value={totalLimit > 0 ? `₹${totalLimit.toLocaleString('en-IN')}` : 'Not set'}
          icon="🎯"
          color="blue"
          sub={totalLimit > 0 ? `₹${Math.max(totalLimit - totalSpent, 0).toLocaleString('en-IN')} remaining` : 'Set in Budget page'}
        />
      </div>

      {/* Budget Progress */}
      {totalLimit > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-700">Monthly Budget</h3>
            <span className={`text-sm font-medium ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
              {isOverBudget ? '⚠️ Over Budget!' : `${budgetUsedPct.toFixed(0)}% used`}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${isOverBudget ? 'bg-red-500' : budgetUsedPct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${budgetUsedPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>₹0</span>
            <span>₹{totalLimit.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {summary?.by_category && Object.keys(summary.by_category).length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Spending by Category</h3>
          <div className="space-y-3">
            {Object.entries(summary.by_category)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([cat, data]) => {
                const catLimit = budget?.category_limits?.[cat]
                const catPct = catLimit ? Math.min((data.total / catLimit) * 100, 100) : 0
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm flex items-center gap-1.5">
                        {CATEGORY_ICONS[cat]} {cat}
                      </span>
                      <span className="text-sm font-medium">
                        ₹{data.total.toLocaleString('en-IN')}
                        {catLimit > 0 && <span className="text-gray-400 text-xs"> / ₹{catLimit.toLocaleString('en-IN')}</span>}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: catLimit ? `${catPct}%` : '100%',
                          backgroundColor: CATEGORY_COLORS[cat] || '#6b7280',
                          maxWidth: '100%'
                        }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">Recent Transactions</h3>
          <button onClick={() => navigate('/expenses')} className="text-indigo-600 text-sm hover:underline">
            View all
          </button>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p>No expenses yet this month</p>
            <button onClick={() => navigate('/add')} className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
              Add your first expense
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map((exp) => (
              <div key={exp.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{CATEGORY_ICONS[exp.category] || '📦'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{exp.title || exp.category}</p>
                    <p className="text-xs text-gray-400">{exp.category} · {new Date(exp.date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${exp.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {exp.type === 'income' ? '+' : '-'}₹{exp.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color, sub }) {
  const colors = {
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600'
  }
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}
