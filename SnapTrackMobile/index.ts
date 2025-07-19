import { registerRootComponent } from 'expo';

import App from './App';

// Initialize Sentry before registering the app
try {
  const { initSentry } = require('./src/services/sentryService');
  initSentry();
  console.log('✅ Sentry initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Sentry:', error);
  // Continue without Sentry rather than crashing the app
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
