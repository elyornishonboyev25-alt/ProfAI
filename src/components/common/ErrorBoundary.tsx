import React from 'react'
import { isStaleBuildError, recoverFromStaleBuild } from '@/utils/staleBuildRecovery'

type ErrorBoundaryProps = {
  children: React.ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  message: string
  staleBuild: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, message: '', staleBuild: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Unexpected UI error',
      staleBuild: isStaleBuildError(error),
    }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an exception', error, errorInfo)
    if (isStaleBuildError(error)) void recoverFromStaleBuild(error)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto my-16 w-full max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-2xl font-semibold text-red-700">
            {this.state.staleBuild ? 'Updating ProfAI' : 'Something went wrong'}
          </h2>
          <p className="mt-3 text-sm text-red-600">
            {this.state.staleBuild
              ? 'The latest version is being loaded. This page will refresh automatically.'
              : this.state.message}
          </p>
          <button
            className="mt-6 rounded-xl bg-primary-600 px-4 py-2 text-white"
            onClick={() => {
              if (this.state.staleBuild) void recoverFromStaleBuild(undefined, true)
              else window.location.reload()
            }}
          >
            {this.state.staleBuild ? 'Update now' : 'Reload page'}
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
