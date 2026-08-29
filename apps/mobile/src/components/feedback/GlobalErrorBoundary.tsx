import { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('GlobalErrorBoundary caught error', {
      message: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text variant="h3" color={colors.text} align="center" style={styles.title}>
            {this.props.fallbackTitle || 'Une erreur inattendue est survenue'}
          </Text>
          <Text variant="body" color={colors.textSecondary} align="center" style={styles.message}>
            {this.props.fallbackMessage || 'Vous pouvez réessayer ou revenir à l\'accueil.'}
          </Text>
          <View style={styles.actions}>
            <Button
              title="Réessayer"
              onPress={this.handleRetry}
              variant="outline"
              size="sm"
            />
            <Button
              title="Retour à l'accueil"
              onPress={this.handleGoHome}
              variant="primary"
              size="sm"
            />
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  title: {
    marginTop: spacing.sm,
  },
  message: {
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
