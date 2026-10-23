import BrandPageLoader from './BrandPageLoader'

type TestLaunchOverlayProps = { title?: string; subtitle?: string }

export default function TestLaunchOverlay({ title = 'Your test will begin shortly', subtitle }: TestLaunchOverlayProps) {
  return <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white" role="presentation">
    <BrandPageLoader compact label={title} detail={subtitle} />
  </div>
}
