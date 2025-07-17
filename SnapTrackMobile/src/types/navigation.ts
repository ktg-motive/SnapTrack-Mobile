import { FeedbackType } from './feedback';

export type RootStackParamList = {
  Main: { screen?: string };
  Review: {
    imageUri: string;
    source: 'camera' | 'library';
  };
  Feedback: {
    initialType: FeedbackType;
    initialContext: string;
  };
  Onboarding: undefined;
  Auth: undefined;
  AccountTab: undefined;
  Settings: undefined;
  About: undefined;
  Contact: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  EditProfile: undefined;
  Help: undefined;
  // New onboarding screens
  NewWelcome: undefined;
  GetStarted: undefined;
  IAPWelcome: {
    receiptEmail: string;
    isProxyEmail: boolean;
    subdomain: string;
  };
  // Legacy screens (will be removed)
  PaidAccountRequired: undefined;
  AccountCreationInProgress: undefined;
  WelcomeBack: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  CaptureTab: undefined;
  ReceiptsTab: undefined;
  StatisticsTab: undefined;
  AccountTab: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
};

export type CaptureStackParamList = {
  CaptureMain: undefined;
};

export type ReceiptsStackParamList = {
  ReceiptsMain: undefined;
};

export type StatisticsStackParamList = {
  StatisticsMain: undefined;
};

export type AccountStackParamList = {
  AccountMain: undefined;
  Settings: undefined;
  About: undefined;
  Contact: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  EditProfile: undefined;
  Help: undefined;
};