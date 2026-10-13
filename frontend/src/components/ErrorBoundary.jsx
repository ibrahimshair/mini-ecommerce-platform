import React, { Component } from "react";
import "./ErrorBoundary.css";

/**
 * Global Error Boundary Component for React
 * Catches uncaught runtime errors in child component trees, logs them,
 * and displays an accessible, user-friendly fallback view to prevent blank screen crashes.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Store detailed error stack and log for debugging
    this.setState({ errorInfo });
    console.error("[ErrorBoundary] Uncaught rendering exception:", error, errorInfo);

    if (typeof this.props.onError === "function") {
      try {
        this.props.onError(error, errorInfo);
      } catch (callbackErr) {
        console.error("[ErrorBoundary] onError callback failed:", callbackErr);
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });

    if (typeof this.props.onReset === "function") {
      try {
        this.props.onReset();
      } catch (err) {
        console.error("[ErrorBoundary] onReset callback failed:", err);
      }
    }
  };

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  toggleDetails = () => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    const { hasError, error, errorInfo, showDetails } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // If a custom fallback is provided as a render function or element
      if (typeof fallback === "function") {
        return fallback(error, this.handleReset);
      }
      if (fallback) {
        return fallback;
      }

      // Default high-fidelity Turkish fallback UI
      return (
        <div className="error-boundary-container" role="alert" aria-live="assertive">
          <div className="error-boundary-card">
            <div className="error-boundary-icon-wrapper">
              <span className="error-boundary-icon" aria-hidden="true">⚠️</span>
            </div>

            <h1 className="error-boundary-title">Bir Şeyler Ters Gitti</h1>
            <p className="error-boundary-description">
              Sayfa bileşenleri yüklenirken beklenmeyen bir hata ile karşılaşıldı.
              Lütfen işlemi yeniden deneyin veya ana sayfaya dönün.
            </p>

            <div className="error-boundary-actions">
              <button
                type="button"
                className="error-boundary-btn error-boundary-btn-primary"
                onClick={this.handleReset}
                id="error-boundary-retry-btn"
              >
                <span className="btn-icon">🔄</span> Yeniden Dene
              </button>

              <button
                type="button"
                className="error-boundary-btn error-boundary-btn-secondary"
                onClick={this.handleReload}
                id="error-boundary-reload-btn"
              >
                <span className="btn-icon">↻</span> Sayfayı Yenile
              </button>

              <button
                type="button"
                className="error-boundary-btn error-boundary-btn-outline"
                onClick={this.handleGoHome}
                id="error-boundary-home-btn"
              >
                <span className="btn-icon">🏠</span> Ana Sayfaya Dön
              </button>
            </div>

            {error && (
              <div className="error-boundary-accordion">
                <button
                  type="button"
                  className="error-boundary-toggle-btn"
                  onClick={this.toggleDetails}
                  aria-expanded={showDetails}
                >
                  {showDetails ? "▲ Teknik Detayları Gizle" : "▼ Teknik Detayları Göster"}
                </button>

                {showDetails && (
                  <div className="error-boundary-details-box">
                    <div className="error-boundary-message">
                      <strong>Hata Mesajı:</strong> {error.toString()}
                    </div>
                    {errorInfo && errorInfo.componentStack && (
                      <pre className="error-boundary-stack">
                        {errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
