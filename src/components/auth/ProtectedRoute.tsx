import { Navigate, useLocation } from 'react-router-dom'
import BrandPageLoader from '@/components/common/BrandPageLoader'
import { useAuthStore } from '@/store/authStore'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const user = useAuthStore(state => state.user)
  const accessToken = useAuthStore(state => state.accessToken)
  const hydrated = useAuthStore(state => state.hydrated)

  if (!hydrated) return <BrandPageLoader compact label="Loading session..." />
  if (!user || !accessToken) return <Navigate to="/login" replace state={{ from: { pathname: location.pathname, search: location.search, hash: location.hash } }} />
  return <>{children}</>
}
