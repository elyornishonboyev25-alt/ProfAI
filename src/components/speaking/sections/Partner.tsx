import LivePartnerSession from '@/components/speaking/LivePartnerSession'

// "Partner" section — one-to-one real-time voice practice with another learner.
export default function Partner({ onExit }: { onExit: () => void }) {
  return <div className="community-partner-surface"><LivePartnerSession onExit={onExit} /></div>
}
