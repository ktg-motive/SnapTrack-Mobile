import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { uuidAuthService } from '../services/authService.uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TestAuthScreen() {
  const [authState, setAuthState] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = uuidAuthService.addAuthStateListener((state) => {
      setAuthState(state);
      addLog(`Auth state updated: ${JSON.stringify(state, null, 2)}`);
    });

    return unsubscribe;
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const testGoogleSignIn = async () => {
    try {
      addLog('Starting Google Sign In...');
      const result = await uuidAuthService.signInWithGoogle();
      addLog(`Google Sign In Success: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      addLog(`Google Sign In Error: ${error.message}`);
    }
  };

  const testAppleSignIn = async () => {
    try {
      addLog('Starting Apple Sign In...');
      const result = await uuidAuthService.signInWithApple();
      addLog(`Apple Sign In Success: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      addLog(`Apple Sign In Error: ${error.message}`);
    }
  };

  const testSignOut = async () => {
    try {
      addLog('Signing out...');
      await uuidAuthService.signOut();
      addLog('Sign out successful');
    } catch (error: any) {
      addLog(`Sign out error: ${error.message}`);
    }
  };

  const checkStoredData = async () => {
    try {
      const keys = ['snaptrack_user_id', 'snaptrack_jwt_token', 'show_onboarding', 'prompt_for_email'];
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        addLog(`${key}: ${value || 'null'}`);
      }
    } catch (error: any) {
      addLog(`Storage check error: ${error.message}`);
    }
  };

  const refreshEmails = async () => {
    try {
      addLog('Refreshing user emails...');
      await uuidAuthService.refreshUserEmails();
      addLog('Email refresh complete');
    } catch (error: any) {
      addLog(`Email refresh error: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>UUID Auth Test Screen</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Auth State</Text>
          <Text style={styles.stateText}>
            Authenticated: {authState?.isAuthenticated ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.stateText}>
            User ID: {authState?.user?.id || 'None'}
          </Text>
          <Text style={styles.stateText}>
            Has Email: {authState?.user?.has_email ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.stateText}>
            Auth Version: {authState?.authVersion || 'Unknown'}
          </Text>
          <Text style={styles.stateText}>
            Emails: {authState?.userEmails?.length || 0}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.button} onPress={testGoogleSignIn}>
            <Text style={styles.buttonText}>Test Google Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={testAppleSignIn}>
            <Text style={styles.buttonText}>Test Apple Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={testSignOut}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={checkStoredData}>
            <Text style={styles.buttonText}>Check Stored Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={refreshEmails}>
            <Text style={styles.buttonText}>Refresh Emails</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logs</Text>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stateText: {
    fontSize: 14,
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  logText: {
    fontSize: 12,
    fontFamily: 'Courier',
    marginBottom: 4,
  },
});