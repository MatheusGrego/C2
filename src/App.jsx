import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'

// Layouts
import MainLayout from './layouts/MainLayout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AgentDetails from './pages/AgentDetails'
import Settings from './pages/Settings'

// Components
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      {/* Toast Notifications */}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1f1942',
            border: '1px solid #463f6a',
            color: '#ffffff',
            fontFamily: 'Rajdhani, sans-serif',
          },
          className: 'sentinel-toast',
        }}
        closeButton
        richColors
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="agent/:hwid" element={<AgentDetails />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
