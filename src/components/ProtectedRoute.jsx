import { Navigate, useLocation } from 'react-router-dom'
import { authService } from '../services/api'

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }) {
  const location = useLocation()

  if (!authService.isAuthenticated()) {
    // Redirect to login, preserving the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
