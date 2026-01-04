import { Component, type ErrorInfo, type ReactNode } from 'react'
import { analytics } from 'app/analytics'

interface Props {
  children: ReactNode
  fallback?: ReactNode | ((props: { error?: Error; resetError: () => void }) => ReactNode)
  componentName?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    analytics.captureException(error, {
      source: this.props.componentName ?? 'ErrorBoundary',
      handled: true,
      context: {
        componentStack: errorInfo.componentStack,
      },
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props
      if (typeof fallback === 'function') {
        return fallback({ error: this.state.error, resetError: this.resetError })
      }
      return fallback ?? null
    }
    return this.props.children
  }
}
