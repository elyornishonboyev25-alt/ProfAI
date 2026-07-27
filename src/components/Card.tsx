import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

export default function Card({ children, className = '', hover = false, padding = 'md' }: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div
      className={`
        profai-glass-panel rounded-2xl
        ${hover ? 'transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(220,38,38,0.12)]' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
