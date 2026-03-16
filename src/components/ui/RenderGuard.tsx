"use client";

import React from 'react';

type RenderGuardProps = {
  name: string;
  children: React.ReactNode;
};

type RenderGuardState = {
  error: Error | null;
};

export default class RenderGuard extends React.Component<RenderGuardProps, RenderGuardState> {
  state: RenderGuardState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): RenderGuardState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[RenderGuard:${this.props.name}]`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm">
        <div className="text-sm font-semibold">Component failed: {this.props.name}</div>
        <div className="mt-2 text-xs leading-5 opacity-80">{this.state.error.message}</div>
        <button
          type="button"
          onClick={this.handleReset}
          className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
        >
          Retry
        </button>
      </div>
    );
  }
}
