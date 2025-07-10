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
};

export type MainTabParamList = {
  HomeTab: undefined;
  CaptureTab: undefined;
  ReceiptsTab: undefined;
  HelpTab: undefined;
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

export type HelpStackParamList = {
  HelpMain: undefined;
};

export type AccountStackParamList = {
  AccountMain: undefined;
  Settings: undefined;
  About: undefined;
  Contact: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  EditProfile: undefined;
};