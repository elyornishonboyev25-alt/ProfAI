export default function LoadingSpinner({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const pixels = { sm: 16, md: 24, lg: 40 }[size]
  return (
    <span
      className={className}
      role="status"
      aria-label="Loading"
      aria-busy="true"
    >
      <img src="/logo.svg" alt="" width={pixels} height={pixels} />
    </span>
  )
}
