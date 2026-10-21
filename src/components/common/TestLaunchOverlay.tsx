import BrandPageLoader from './BrandPageLoader'
export default function TestLaunchOverlay({
  title = 'Loading',
  subtitle: _subtitle,
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <div className="profai-launch-loading">
      <BrandPageLoader label={title} />
    </div>
  )
}
