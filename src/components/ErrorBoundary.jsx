import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0a0a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Arial Narrow', Arial, sans-serif",
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: 420,
              padding: 40,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: "#E24B4A",
                marginBottom: 12,
                lineHeight: 1,
              }}
            >
              Error
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                marginBottom: 8,
              }}
            >
              Algo ha salido mal.
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.3)",
                marginBottom: 28,
                wordBreak: "break-word",
              }}
            >
              {this.state.error?.message || "Error desconocido"}
            </div>
            <button
              onClick={this.handleRetry}
              style={{
                background: "#c8ff00",
                color: "#0a0a0a",
                border: "none",
                padding: "10px 28px",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
