import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Image,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  NewWelcome: undefined;
  GetStarted: undefined;
  SignIn: undefined;
  Auth: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

const NewWelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();
  }, []);

  const handleSignUp = () => {
    navigation.navigate('GetStarted');
  };

  const handleSignIn = () => {
    navigation.navigate('Auth');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>SnapTrack</Text>
        </View>

        <View style={styles.headlineContainer}>
          <Text style={styles.headline}>Snap. Track. Done.</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleSignUp}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleSignIn}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: width * 0.1, // 10% of screen width
  },
  logoContainer: {
    marginTop: 120,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 12,
  },
  headlineContainer: {
    marginTop: 80,
    alignItems: 'center',
  },
  headline: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    lineHeight: 38,
  },
  buttonContainer: {
    marginTop: 60,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#009f86',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
  },
  secondaryButton: {
    marginTop: 16,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#009f86',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#009f86',
    fontSize: 17,
    fontWeight: '500',
  },
});

export default NewWelcomeScreen;