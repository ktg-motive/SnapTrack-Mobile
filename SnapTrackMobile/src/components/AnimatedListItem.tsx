import React, { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  delay?: number;
  staggerDelay?: number;
  duration?: number;
  useSlideIn?: boolean;
  useScaleIn?: boolean;
  useFadeIn?: boolean;
}

/**
 * AnimatedListItem - Provides staggered entrance animations for list items
 * 
 * Features:
 * - Configurable stagger delay between items
 * - Multiple animation types (slide, scale, fade)
 * - Smooth entrance effects with easing
 * - Optimized for 60fps performance
 */
export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index,
  delay = 0,
  staggerDelay = 50,
  duration = 300,
  useSlideIn = true,
  useScaleIn = false,
  useFadeIn = true
}) => {
  const translateY = useRef(new Animated.Value(useSlideIn ? 50 : 0)).current;
  const scale = useRef(new Animated.Value(useScaleIn ? 0.8 : 1)).current;
  const opacity = useRef(new Animated.Value(useFadeIn ? 0 : 1)).current;

  useEffect(() => {
    const totalDelay = delay + (index * staggerDelay);
    
    const animations = [];

    if (useSlideIn) {
      animations.push(
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          delay: totalDelay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      );
    }

    if (useScaleIn) {
      animations.push(
        Animated.timing(scale, {
          toValue: 1,
          duration,
          delay: totalDelay,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true
        })
      );
    }

    if (useFadeIn) {
      animations.push(
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          delay: totalDelay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      );
    }

    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  }, [index, delay, staggerDelay, duration, useSlideIn, useScaleIn, useFadeIn]);

  const animatedStyle = {
    transform: [
      ...(useSlideIn ? [{ translateY }] : []),
      ...(useScaleIn ? [{ scale }] : [])
    ],
    ...(useFadeIn ? { opacity } : {})
  };

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  initialDelay?: number;
  useSlideIn?: boolean;
  useScaleIn?: boolean;
  useFadeIn?: boolean;
}

/**
 * StaggeredList - Wrapper component for creating staggered list animations
 * 
 * Usage:
 * <StaggeredList>
 *   {items.map((item, index) => (
 *     <ItemComponent key={item.id} item={item} />
 *   ))}
 * </StaggeredList>
 */
export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 50,
  initialDelay = 0,
  useSlideIn = true,
  useScaleIn = false,
  useFadeIn = true
}) => {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <AnimatedListItem
          index={index}
          delay={initialDelay}
          staggerDelay={staggerDelay}
          useSlideIn={useSlideIn}
          useScaleIn={useScaleIn}
          useFadeIn={useFadeIn}
        >
          {child}
        </AnimatedListItem>
      ))}
    </>
  );
};