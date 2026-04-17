import { Component, type ErrorInfo, type ReactNode } from 'react'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('North Shore Nautical frontend error boundary caught an exception.', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06131f] px-6 py-20">
        <div className="soft-panel max-w-2xl px-8 py-10 text-left">
          <span className="section-label w-fit">North Shore Nautical</span>
          <h1 className="mt-5 font-display text-4xl font-semibold text-ink md:text-5xl">
            We hit a page issue before it could affect your booking.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-slate">
            Reload the page to reconnect to your account. If the issue persists, North Shore
            Nautical can still help you directly while the site refreshes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="button-dark"
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
            <a
              className="rounded-full border border-ink/10 px-6 py-3.5 text-sm font-semibold tracking-[0.08em] text-ink transition duration-300 hover:-translate-y-0.5 hover:border-lake/40 hover:bg-white"
              href="/"
            >
              Return Home
            </a>
          </div>
        </div>
      </div>
    )
  }
}
