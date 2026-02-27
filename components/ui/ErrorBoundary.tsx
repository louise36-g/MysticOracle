import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  compact?: boolean;
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  console.error('Uncaught error:', error);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="bg-slate-900/80 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-heading text-red-200 mb-2">
          Something went wrong
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          The spirits encountered an unexpected disturbance. Please try again.
        </p>
        <button
          onClick={resetErrorBoundary}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function CompactErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  console.error('Uncaught error:', error);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="bg-slate-900/80 border border-red-500/30 rounded-xl p-6 max-w-sm text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-base font-heading text-red-200 mb-1">
          Something went wrong
        </h3>
        <p className="text-slate-400 text-xs mb-4">
          This section encountered an error.
        </p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default function ErrorBoundary({ children, fallback, compact }: Props) {
  const FallbackComponent = compact ? CompactErrorFallback : ErrorFallback;

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback ? () => <>{fallback}</> : FallbackComponent}
      onReset={() => {
        // Reset application state here if needed
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
