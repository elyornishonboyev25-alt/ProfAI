import { Navigate } from 'react-router-dom'

// Legacy section URLs now converge on the unified full-mock SAT command center.
export default function SATSection() {
  return <Navigate to="/sat" replace />
}
