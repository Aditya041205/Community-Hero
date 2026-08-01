import React from "react";

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
    (this as any).setState({ error, errorInfo });
  }

  render() {
    if ((this as any).state.hasError) {
      if ((this as any).props.fallback) {
        return (this as any).props.fallback;
      }
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 p-6 rounded-2xl max-w-2xl w-full">
            <h2 className="text-red-400 font-bold text-xl mb-4">Something went wrong.</h2>
            <details className="whitespace-pre-wrap text-slate-300 text-xs bg-black/50 p-4 rounded-xl overflow-auto max-h-[60vh]">
              <summary className="cursor-pointer text-indigo-400 font-bold mb-2">View Error Details</summary>
              {(this as any).state.error && (this as any).state.error.toString()}
              <br />
              {(this as any).state.errorInfo?.componentStack}
            </details>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-500 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}
