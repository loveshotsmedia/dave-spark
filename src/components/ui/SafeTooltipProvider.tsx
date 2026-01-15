import * as React from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // If Radix/React gets into a bad state, avoid blank-screening the whole app.
    console.error("Tooltip provider crashed; falling back without provider", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function SafeTooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<>{children}</>}>
      <TooltipProvider>{children}</TooltipProvider>
    </ErrorBoundary>
  );
}
