import { useCopy } from '@/i18n/interface'
﻿interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const { c: uiCopy } = useCopy()
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <span
      className={`relative inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={uiCopy("Loading")}
    >
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-red-100 border-t-red-600" />
      {size === 'lg' ? <BrandMark size={26} /> : null}
    </span>
  )
}

import { BrandMark } from '@/components/brand/BrandLogo'
