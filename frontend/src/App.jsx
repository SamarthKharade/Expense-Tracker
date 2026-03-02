import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import AddExpense from './components/AddExpense'
import ExpenseList from './components/ExpenseList'
import Charts from './components/Charts'
import BudgetSettings from './components/BudgetSettings'
import MLInsights from './components/MLInsights'
import Login from './pages/Login'
import Register from './pages/Register'

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/add" element={<ProtectedLayout><AddExpense /></ProtectedLayout>} />
      <Route path="/expenses" element={<ProtectedLayout><ExpenseList /></ProtectedLayout>} />
      <Route path="/analytics" element={<ProtectedLayout><Charts /></ProtectedLayout>} />
      <Route path="/insights" element={<ProtectedLayout><MLInsights /></ProtectedLayout>} />
      <Route path="/budget" element={<ProtectedLayout><BudgetSettings /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
