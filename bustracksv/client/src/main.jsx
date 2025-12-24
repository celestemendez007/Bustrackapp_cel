import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { GoogleMapsProvider } from './contexts/GoogleMapsContext'
import { router } from './router'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AuthProvider>
      <GoogleMapsProvider>
        <RouterProvider router={router} />
      </GoogleMapsProvider>
    </AuthProvider>
  </ErrorBoundary>,
)
