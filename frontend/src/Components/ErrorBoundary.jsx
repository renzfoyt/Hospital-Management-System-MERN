import React from "react";

/**
 * Catches render-time errors anywhere in its child tree (e.g. a malformed
 * data record causing a .map/.join crash) and shows a friendly fallback
 * instead of an unstyled blank page.
 *
 * Deliberately a class component — componentDidCatch/getDerivedStateFromError
 * have no hook equivalent yet, this is one of the few valid remaining uses
 * of a class in this codebase.
 *
 * Placement note: this must live INSIDE the route-keyed div in App.jsx
 * (the one with key={location.pathname}), not outside it. That way a route
 * change remounts this boundary along with everything else, automatically
 * clearing hasError — otherwise a crash would keep showing the fallback
 * even after the user navigates to a different, working page.
 */
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // No error-tracking service wired up yet — console is the only
    // record for now, which is fine at this project's scope.
    console.error("Render error caught by ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-bold text-green-900">
            Something went wrong
          </h1>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            We hit an unexpected error loading this page. Please try
            refreshing, or head back to the homepage.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-green-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              Refresh Page
            </button>
            <a
              href="/"
              className="rounded-md border border-green-700 px-5 py-2.5 text-sm font-semibold text-green-800 transition-colors hover:bg-green-700 hover:text-white"
            >
              Go Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;