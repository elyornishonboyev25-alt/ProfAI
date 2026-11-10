import { Navigate, useLocation } from 'react-router-dom'

// Existing bookmarks resolve directly to the library; the former Arena page is retired.
export default function SAT() {
  const location = useLocation()
  return <Navigate to="/sat/mocks" replace state={location.state} />
}
