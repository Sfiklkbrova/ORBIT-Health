import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ORBIT Health Crash Intercepted by ErrorBoundary:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="alert-decagram" size={32} color={COLORS.statusAlert} />
            </View>

            <Text style={styles.title}>
              {this.props.fallbackTitle || 'BIO-LINK SUBSYSTEM RECOVERY'}
            </Text>
            <Text style={styles.subtitle}>
              An isolated rendering anomaly occurred. Local SQLite telemetry was preserved safely without data loss.
            </Text>

            {this.state.error && (
              <ScrollView style={styles.errorBox} contentContainerStyle={styles.errorContent}>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRestart}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="refresh" size={18} color="#0B132B" />
              <Text style={styles.retryButtonText}>RESTART SUBSYSTEM CONSOLE</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  errorBox: {
    maxHeight: 100,
    width: '100%',
    backgroundColor: 'rgba(3, 7, 18, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: SPACING.lg,
  },
  errorContent: {
    padding: SPACING.sm,
  },
  errorText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#FCA5A5',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cyan,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B132B',
    letterSpacing: 0.5,
  },
});
