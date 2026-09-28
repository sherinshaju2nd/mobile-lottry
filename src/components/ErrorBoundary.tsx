import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { AlertOctagon, RotateCcw, Home, ChevronDown, ChevronUp } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { triggerMediumHaptic } from "../utils/haptics";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    try {
      triggerMediumHaptic();
    } catch {}
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Icon */}
            <View style={styles.iconCircle}>
              <AlertOctagon size={44} color="#EF4444" strokeWidth={2.2} />
            </View>

            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.subtitle}>
              An unexpected error occurred. Don't worry, your data is safe and we've caught it before it could crash the app.
            </Text>

            {/* Actions */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.primaryButton}
                onPress={this.handleReset}
              >
                <RotateCcw size={18} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.primaryButtonText}>Reload & Try Again</Text>
              </TouchableOpacity>
            </View>

            {/* Debugging details in development or toggleable */}
            <View style={styles.detailsBox}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.detailsHeader}
                onPress={this.toggleDetails}
              >
                <Text style={styles.detailsHeaderText}>Technical Diagnostic Details</Text>
                {this.state.showDetails ? (
                  <ChevronUp size={16} color="#64748B" />
                ) : (
                  <ChevronDown size={16} color="#64748B" />
                )}
              </TouchableOpacity>

              {this.state.showDetails && (
                <View style={styles.detailsContent}>
                  <Text style={styles.errorMessage}>
                    {this.state.error ? this.state.error.toString() : "Unknown Error"}
                  </Text>
                  {this.state.errorInfo?.componentStack && (
                    <Text style={styles.componentStack}>
                      {this.state.errorInfo.componentStack.trim()}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "90%",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  actionContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  detailsBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F1F5F9",
  },
  detailsHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  detailsContent: {
    padding: 12,
  },
  errorMessage: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
    marginBottom: 8,
    fontFamily: "monospace",
  },
  componentStack: {
    fontSize: 10.5,
    color: "#64748B",
    fontFamily: "monospace",
    lineHeight: 15,
  },
});
