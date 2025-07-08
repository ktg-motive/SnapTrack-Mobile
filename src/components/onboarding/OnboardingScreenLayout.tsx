import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { theme } from '../../styles/theme';

interface OnboardingScreenLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingScreenLayout({ children }: OnboardingScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
});