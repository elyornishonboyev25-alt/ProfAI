import { Navigate, useLocation } from 'react-router-dom'

// Existing bookmarks resolve directly to the library; the former Arena page is retired.
export default function IELTS() {
  const location = useLocation()
  return <Navigate to="/ielts/tests" replace state={location.state} />
}
