import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI render error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoDashboard = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-sm">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-semibold text-foreground">
              Temporary Render Notice
            </h3>
            <p className="text-xs text-muted-foreground">
              A view update was interrupted during navigation. The application navigation remains active and responsive.
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono text-muted-foreground/80 bg-muted p-2 rounded-lg break-all mt-2">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleReset}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
            <Button
              size="sm"
              onClick={this.handleGoDashboard}
              className="text-xs gap-1.5"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
