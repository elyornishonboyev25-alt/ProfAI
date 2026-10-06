import CoachMascot, { type CoachMascotProps } from './CoachMascot'

// Existing chat and voice surfaces share the same living companion.
export function VoiceOrb(props: CoachMascotProps) { return <CoachMascot {...props} /> }
export default VoiceOrb