import 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      math: React.HTMLAttributes<HTMLElement> & { display?: 'block' | 'inline' }
      mrow: React.HTMLAttributes<HTMLElement>
      mfrac: React.HTMLAttributes<HTMLElement>
      msqrt: React.HTMLAttributes<HTMLElement>
      mroot: React.HTMLAttributes<HTMLElement>
      msub: React.HTMLAttributes<HTMLElement>
      msup: React.HTMLAttributes<HTMLElement>
      msubsup: React.HTMLAttributes<HTMLElement>
      mover: React.HTMLAttributes<HTMLElement> & { accent?: string }
      mi: React.HTMLAttributes<HTMLElement> & { mathvariant?: string }
      mn: React.HTMLAttributes<HTMLElement>
      mo: React.HTMLAttributes<HTMLElement>
      mtext: React.HTMLAttributes<HTMLElement>
    }
  }
}
