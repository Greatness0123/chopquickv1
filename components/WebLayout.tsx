import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useColors } from '../hooks/useColors';

interface WebLayoutProps {
  children: React.ReactNode;
}

export const WebLayout: React.FC<WebLayoutProps> = ({ children }) => {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width > 1024;

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 1280,
    height: '100%',
    maxHeight: 1000,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
});
