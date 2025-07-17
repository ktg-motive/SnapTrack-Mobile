import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

export default function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index <= current ? styles.activeDot : styles.inactiveDot
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: theme.colors.primary
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8
  },
  inactiveDot: {
    backgroundColor: '#E5E5E5'
  }
});