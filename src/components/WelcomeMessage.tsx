import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, typography } from '../styles/theme';

interface WelcomeMessageProps {
  userName: string;
}

const VEGAS_GREETINGS = [
  {
    title: "Welcome to the show, {name}!",
    subtitle: "Tonight's main event: organizing receipts like a Vegas pro"
  },
  {
    title: "Hey there, high roller {name}!",
    subtitle: "Ready to hit the jackpot on expense organization?"
  },
  {
    title: "Ladies and gentlemen... {name} has entered the building!",
    subtitle: "The house always wins, but tonight you're beating those receipts"
  },
  {
    title: "Ring-a-ding-ding! {name} is back!",
    subtitle: "The Rat Pack of receipt management is ready to perform"
  },
  {
    title: "Welcome to fabulous SnapTrack, {name}!",
    subtitle: "Where every receipt is a winner and the drinks are... virtual"
  },
  {
    title: "Step right up, {name}!",
    subtitle: "The greatest expense show on earth is about to begin"
  },
  {
    title: "Viva Las {name}!",
    subtitle: "Your receipts are about to get the five-star treatment"
  }
];

export default function WelcomeMessage({ userName }: WelcomeMessageProps) {
  const [greeting, setGreeting] = useState({ title: '', subtitle: '' });
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Select random greeting
    const randomGreeting = VEGAS_GREETINGS[Math.floor(Math.random() * VEGAS_GREETINGS.length)];
    const personalizedGreeting = {
      title: randomGreeting.title.replace('{name}', userName),
      subtitle: randomGreeting.subtitle
    };
    
    setGreeting(personalizedGreeting);

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [userName]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>{greeting.title}</Text>
      <Text style={styles.subtitle}>{greeting.subtitle}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 4,
  },
  title: {
    ...typography.title2,
    color: colors.neonGold,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: colors.neonGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});