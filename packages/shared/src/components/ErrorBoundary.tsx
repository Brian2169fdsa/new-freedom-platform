import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { CRISIS_HOTLINE } from '../utils/constants';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
}

/**
 * Error boundary component that catches rendering errors in child components.
 * Displays a recovery-themed friendly error UI with amber accent colors.
 * Includes a crisis hotline link since this is a behavioral health platform.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const isDev = process.env.NODE_ENV === 'development';

    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-xl font-semibold text-stone-800">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              We hit an unexpected issue. Your data is safe — please try again.
            </p>
          </div>

          {/* Dev-only error details */}
          {isDev && this.state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <p className="text-xs font-mono text-red-700 break-words">
                {this.state.error.message}
              </p>
              {this.state.error.stack && (
                <pre className="mt-2 text-xs font-mono text-red-500 overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}

          {/* Try Again button */}
          <button
            onClick={this.handleReset}
            className="inline-flex items-center px-6 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>

          {/* Crisis hotline link */}
          <div className="pt-4 border-t border-stone-200">
            <p className="text-xs text-stone-400">
              If you are in crisis and need immediate help:
            </p>
            <a
              href={CRISIS_HOTLINE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 text-xs font-medium text-amber-600 hover:text-amber-700 underline underline-offset-2"
            >
              {CRISIS_HOTLINE.name} &mdash; Call {CRISIS_HOTLINE.phone}
            </a>
          </div>
        </div>
      </div>
    );
  }
}
