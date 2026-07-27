import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button'
}: ButtonProps) {
  const baseClasses = 'inline-flex min-h-11 items-center justify-center rounded-xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] motion-reduce:transform-none'

  const variantClasses = {
    primary: 'profai-glossy-button text-white focus:ring-red-400',
    secondary: 'border border-red-200/80 bg-red-50/80 text-red-700 shadow-[0_8px_20px_rgba(220,38,38,0.08)] hover:-translate-y-0.5 hover:bg-red-100 focus:ring-red-300',
    outline: 'border border-red-200/90 bg-white/72 text-red-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-red-50 focus:ring-red-300',
    ghost: 'text-slate-600 hover:bg-red-50 hover:text-red-700 focus:ring-red-300',
    glass: 'profai-glass-panel text-slate-700 hover:-translate-y-0.5 hover:bg-white/80'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  )
}
