import { useState, useEffect } from 'react'
import api from '../api/axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Cell } from 'recharts'

export default function MLInsights() {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchInsights() }, [])

  const fetchInsights = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/insights/')
      setInsights(res.data)
    } catch (err) {
      setError('Could not load AI insights. Make sure you have expense data for the current and previous month.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <div className="text-4xl mb-3 animate-pulse">🤖</div>
      <p className="animate-pulse">Analyzing your spending patterns...</p>
    </div>
  )

  if (error) return (
    <div className="p-6">
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-5 text-center">
        <p className="text-3xl mb-2">⚠️</p>
        <p>{error}</p>
        <button onClick={fetchInsights} className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm">
          Retry
        </button>
      </div>
    </div>
  )

  const comparisonChartData = insights?.comparison
    ? Object.entries(insights.comparison).map(([cat, data]) => ({
        category: cat.slice(0, 5),
        'This Month': data.current,
        'Last Month': data.previous,
        change: data.change_pct
      }))
    : []

  const predictionData = insights?.predictions
    ? Object.entries(insights.predictions).map(([cat, val]) => ({
        category: cat.slice(0, 5),
        predicted: val
      }))
    : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🤖 AI Insights</h2>
          <p className="text-gray-500 text-sm mt-1">ML-powered analysis of your spending habits</p>
        </div>
        <button onClick={fetchInsights} className="text-sm text-indigo-600 hover:underline">↻ Refresh</button>
      </div>

      {/* Alerts */}
      {insights?.alerts?.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">🚨 Alerts</h3>
          {insights.alerts.map((alert, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 border text-sm ${
                alert.severity === 'high'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-orange-50 border-orange-200 text-orange-700'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Positive Insights */}
      {insights?.insights?.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">💡 Insights</h3>
          {insights.insights.map((item, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 border text-sm ${
                item.type === 'positive'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              {item.message}
            </div>
          ))}
        </div>
      )}

      {/* Month Comparison Chart */}
      {comparisonChartData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-1">This Month vs Last Month</h3>
          <p className="text-xs text-gray-400 mb-4">Comparing spending by category</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={comparisonChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              <Legend />
              <Bar dataKey="Last Month" fill="#d1d5db" radius={[4, 4, 0, 0]} />
              <Bar dataKey="This Month" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Change Table */}
      {insights?.comparison && Object.keys(insights.comparison).length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Category Changes</h3>
          <div className="space-y-3">
            {Object.entries(insights.comparison)
              .sort((a, b) => Math.abs(b[1].change_pct) - Math.abs(a[1].change_pct))
              .map(([cat, data]) => (
                <div key={cat} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{cat}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">₹{data.current.toLocaleString('en-IN')}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      data.change_pct > 0 ? 'bg-red-100 text-red-600' : data.change_pct < 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {data.change_pct > 0 ? '↑' : data.change_pct < 0 ? '↓' : '='} {Math.abs(data.change_pct).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* End-of-Month Predictions */}
      {predictionData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-1">Predicted End-of-Month Spending</h3>
          <p className="text-xs text-gray-400 mb-4">Based on your current spending pace this month</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={predictionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              <Bar dataKey="predicted" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Predicted" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!insights?.alerts?.length && !insights?.insights?.length && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p>Add more expense data across multiple months to get AI insights!</p>
        </div>
      )}
    </div>
  )
}
