import Login from './Login'

// Keep existing /register links working while both auth modes share one design.
export default function Register() {
  return <Login />
}
