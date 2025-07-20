import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme } from '../styles/theme';
import { authService } from '../services/authService.compat';

// Import onboarding screens
import WelcomeScreen from './onboarding/WelcomeScreen';
import UsernameSelectionScreen from './onboarding/UsernameSelectionScreen';
import EmailSetupScreen from './onboarding/EmailSetupScreen';
import CameraCaptureScreen from './onboarding/CameraCaptureScreen';
import SnapTrackIntelligenceScreen from './onboarding/SnapTrackIntelligenceScreen';
import EntitySelectionScreen from './onboarding/EntitySelectionScreen';
import CompletionScreen from './onboarding/CompletionScreen';

// Import shared components
import ProgressIndicator from '../components/onboarding/ProgressIndicator';
import SkipButton from '../components/onboarding/SkipButton';
import OnboardingScreenLayout from '../components/onboarding/OnboardingScreenLayout';

interface OnboardingState {
  currentStep: number;
  completedSteps: boolean[];
  capturedReceiptUri?: string;
  extractedData?: any;
  userEmail: string;
  selectedUsername?: string;
  userEmailAddress?: string;
  selectedEntity?: string;
  selectedTags: string[];
  hasPermissions: {
    camera: boolean;
    photos: boolean;
  };
}

const ONBOARDING_STORAGE_KEY = 'onboarding_state';
const TOTAL_STEPS = 7;

interface OnboardingFlowProps {
  onComplete?: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    currentStep: 0,
    completedSteps: new Array(TOTAL_STEPS).fill(false),
    userEmail: '',
    selectedTags: [],
    hasPermissions: {
      camera: false,
      photos: false
    }
  });

  // Screen components array
  const screens = [
    WelcomeScreen,
    UsernameSelectionScreen,
    EmailSetupScreen,
    CameraCaptureScreen,
    SnapTrackIntelligenceScreen,
    EntitySelectionScreen,
    CompletionScreen
  ];

  useEffect(() => {
    initializeOnboarding();
  }, []);

  const initializeOnboarding = async () => {
    try {
      // Load saved onboarding state
      const savedState = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setOnboardingState(parsed);
        setCurrentStep(parsed.currentStep);
      }

      // Get user email for email setup screen
      const user = await authService.getCurrentUser();
      if (user?.email_address) {
        // Use new email format
        setOnboardingState(prev => ({
          ...prev,
          userEmail: user.email_address
        }));
      } else if (user?.email_username) {
        // Generate from username
        setOnboardingState(prev => ({
          ...prev,
          userEmail: `${user.email_username}@app.snaptrack.bot`
        }));
      } else if (user?.email) {
        // Legacy fallback
        const username = user.email.split('@')[0].replace(/[^a-z0-9-]/gi, '-');
        setOnboardingState(prev => ({
          ...prev,
          userEmail: `expense@${username}.snaptrack.bot`
        }));
      } else {
        // For email-optional users, we'll set this after username selection
        setOnboardingState(prev => ({
          ...prev,
          userEmail: 'Will be set after username selection'
        }));
      }
    } catch (error) {
      console.error('Error initializing onboarding:', error);
    }
  };

  const saveOnboardingState = async (state: OnboardingState) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  };

  const handleNext = () => {
    console.log(`➡️ handleNext called - currentStep: ${currentStep}, TOTAL_STEPS: ${TOTAL_STEPS}`);
    if (currentStep < TOTAL_STEPS - 1) {
      const newStep = currentStep + 1;
      console.log(`📈 Moving to step ${newStep}`);
      const newState = {
        ...onboardingState,
        currentStep: newStep,
        completedSteps: onboardingState.completedSteps.map((completed, index) => 
          index === currentStep ? true : completed
        )
      };
      
      setCurrentStep(newStep);
      setOnboardingState(newState);
      saveOnboardingState(newState);
    } else {
      console.log('🏁 Already at last step, not advancing');
    }
  };

  const handleSkip = () => {
    console.log('🚫 Skip button pressed');
    Alert.alert(
      'Skip Onboarding',
      'You can always access the tutorial from Settings later.',
      [
        { text: 'Continue Tutorial', style: 'cancel' },
        { text: 'Skip', onPress: completeOnboarding }
      ]
    );
  };

  const completeOnboarding = async () => {
    console.log('🏁 completeOnboarding called');
    try {
      // Clear onboarding state
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      console.log('🗑️ Onboarding state cleared from storage');
      
      // Call the onComplete callback if provided (from App.tsx)
      if (onComplete) {
        console.log('📞 Calling onComplete callback from App.tsx');
        onComplete();
      } else {
        console.log('🔄 No onComplete callback, using fallback navigation');
        // Fallback navigation
        navigation.navigate('Main' as never);
      }
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      // Navigate anyway
      if (onComplete) {
        onComplete();
      } else {
        navigation.navigate('Main' as never);
      }
    }
  };

  const updateOnboardingState = (updates: Partial<OnboardingState>) => {
    const newState = { ...onboardingState, ...updates };
    setOnboardingState(newState);
    saveOnboardingState(newState);
  };

  const handleReceiptCapture = (uri: string) => {
    updateOnboardingState({ capturedReceiptUri: uri });
  };

  const handleDataExtraction = (data: any) => {
    updateOnboardingState({ extractedData: data });
  };

  const handleEntitySelection = (entity: string, tags: string[]) => {
    updateOnboardingState({ 
      selectedEntity: entity,
      selectedTags: tags
    });
  };

  const handlePermissionUpdate = (permissions: { camera: boolean; photos: boolean }) => {
    updateOnboardingState({ hasPermissions: permissions });
  };

  const CurrentScreen = screens[currentStep];
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <OnboardingScreenLayout>
      <View style={styles.container}>
        <ProgressIndicator current={currentStep} total={TOTAL_STEPS} />
        
        <SkipButton 
          visible={!isLastStep} 
          onPress={handleSkip}
        />

        <View style={styles.screenContainer}>
          <CurrentScreen
            onNext={handleNext}
            onSkip={handleSkip}
            onComplete={completeOnboarding}
            onReceiptCapture={handleReceiptCapture}
            onDataExtraction={handleDataExtraction}
            onEntitySelection={handleEntitySelection}
            onPermissionUpdate={handlePermissionUpdate}
            state={onboardingState}
          />
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1
  },
  screenContainer: {
    flex: 1
  }
});