import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            background: "rgba(255,59,59,0.04)",
            border: "1px solid rgba(255,59,59,0.15)",
            borderRadius: 16,
            padding: "24px 20px",
            margin: "12px 0",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#ff3b3b", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 16 }}>
            {this.state.error?.message || "An unexpected error occurred in this section."}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: "#ff3b3b12",
              border: "1px solid #ff3b3b44",
              color: "#ff3b3b",
              fontSize: 11,
              fontWeight: 500,
              padding: "8px 20px",
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
