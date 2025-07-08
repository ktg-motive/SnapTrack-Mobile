import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { Button, Card, ProgressBar } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface SnapTrackIntelligenceScreenProps {
  onNext: () => void;
  onDataExtraction: (data: any) => void;
  state: any;
}

const { width } = Dimensions.get('window');

type ProcessingStage = 'scanning' | 'validating' | 'enhancing' | 'complete';

interface MockReceiptData {
  merchant: string;
  amount: string;
  date: string;
  confidence: number;
  aiEnhanced: boolean;
  corrections: {
    field: string;
    original: string;
    corrected: string;
  }[];
}

export default function SnapTrackIntelligenceScreen({ 
  onNext, 
  onDataExtraction, 
  state 
}: SnapTrackIntelligenceScreenProps) {
  const [stage, setStage] = useState<ProcessingStage>('scanning');
  const [progress, setProgress] = useState(0);
  const [mockData, setMockData] = useState<MockReceiptData | null>(null);
  const [confidence, setConfidence] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const brainAnim = useRef(new Animated.Value(0)).current;
  const enhanceAnim = useRef(new Animated.Value(0)).current;
  const confidenceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Start processing simulation
    processReceiptWithIntelligence();
  }, [fadeAnim]);

  const processReceiptWithIntelligence = async () => {
    // Stage 1: Basic OCR Scanning
    setStage('scanning');
    await animateProgress(0, 0.3, 2000);
    
    // Stage 2: AI Validation
    setStage('validating');
    Animated.loop(
      Animated.sequence([
        Animated.timing(brainAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(brainAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
    await animateProgress(0.3, 0.7, 2500);
    
    // Stage 3: AI Enhancement
    setStage('enhancing');
    Animated.loop(
      Animated.sequence([
        Animated.timing(enhanceAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(enhanceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
    await animateProgress(0.7, 0.95, 2000);
    
    // Stage 4: Final Results
    setStage('complete');
    brainAnim.stopAnimation();
    enhanceAnim.stopAnimation();
    
    const finalData: MockReceiptData = {
      merchant: 'Coffee & More',
      amount: '$24.99',
      date: new Date().toLocaleDateString(),
      confidence: 94,
      aiEnhanced: true,
      corrections: [
        {
          field: 'Amount',
          original: '$2499',
          corrected: '$24.99',
        },
        {
          field: 'Merchant',
          original: 'C0ffee & M0re',
          corrected: 'Coffee & More',
        },
      ],
    };
    
    setMockData(finalData);
    onDataExtraction(finalData);
    await animateProgress(0.95, 1, 500);
    
    // Animate confidence score
    Animated.timing(confidenceAnim, {
      toValue: finalData.confidence,
      duration: 1500,
      useNativeDriver: false,
    }).start();
    
    setConfidence(finalData.confidence);
  };

  const animateProgress = (from: number, to: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const animation = Animated.timing({} as any, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      });
      
      const updateProgress = () => {
        const startTime = Date.now();
        const update = () => {
          const elapsed = Date.now() - startTime;
          const progressValue = Math.min(from + ((to - from) * elapsed) / duration, to);
          setProgress(progressValue);
          
          if (elapsed < duration) {
            requestAnimationFrame(update);
          } else {
            resolve();
          }
        };
        update();
      };
      
      updateProgress();
    });
  };

  const renderProcessingStage = () => {
    switch (stage) {
      case 'scanning':
        return (
          <View style={styles.stageContainer}>
            <Icon name="document-scanner" size={48} color={theme.colors.primary} />
            <Text style={styles.stageTitle}>Scanning Receipt</Text>
            <Text style={styles.stageDescription}>
              Using advanced OCR to extract text from your receipt
            </Text>
          </View>
        );
        
      case 'validating':
        return (
          <View style={styles.stageContainer}>
            <Animated.View
              style={[
                styles.brainContainer,
                {
                  transform: [
                    {
                      scale: brainAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Icon name="psychology" size={48} color={theme.colors.primary} />
            </Animated.View>
            <Text style={styles.stageTitle}>SnapTrack Intelligence Validating</Text>
            <Text style={styles.stageDescription}>
              Our AI is checking for common OCR errors and inconsistencies
            </Text>
            <View style={styles.featureHighlight}>
              <Icon name="auto-fix-high" size={16} color={theme.colors.primary} />
              <Text style={styles.highlightText}>
                Catches comma separators, misread characters, and formatting errors
              </Text>
            </View>
          </View>
        );
        
      case 'enhancing':
        return (
          <View style={styles.stageContainer}>
            <Animated.View
              style={[
                styles.enhanceContainer,
                {
                  opacity: enhanceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
              ]}
            >
              <Icon name="auto-awesome" size={48} color={theme.colors.primary} />
            </Animated.View>
            <Text style={styles.stageTitle}>AI Enhancing Data</Text>
            <Text style={styles.stageDescription}>
              Correcting unclear details and improving accuracy
            </Text>
            <View style={styles.featureHighlight}>
              <Icon name="trending-up" size={16} color={theme.colors.primary} />
              <Text style={styles.highlightText}>
                Smart correction: "$24.99" not "$2499"
              </Text>
            </View>
          </View>
        );
        
      case 'complete':
        return (
          <View style={styles.resultsContainer}>
            <View style={styles.confidenceSection}>
              <Text style={styles.confidenceLabel}>Confidence Score</Text>
              <Animated.Text
                style={[
                  styles.confidenceScore,
                  {
                    opacity: confidenceAnim.interpolate({
                      inputRange: [0, 94],
                      outputRange: [0, 1],
                    }),
                  },
                ]}
              >
                {Math.round(confidence)}%
              </Animated.Text>
            </View>
            
            {mockData && (
              <Card style={styles.dataCard}>
                <Card.Content>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Merchant:</Text>
                    <View style={styles.dataValueContainer}>
                      <Text style={styles.dataValue}>{mockData.merchant}</Text>
                      <View style={styles.enhancedBadge}>
                        <Icon name="auto-awesome" size={12} color="#fff" />
                        <Text style={styles.badgeText}>Enhanced</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Amount:</Text>
                    <View style={styles.dataValueContainer}>
                      <Text style={styles.dataValue}>{mockData.amount}</Text>
                      <View style={styles.enhancedBadge}>
                        <Icon name="auto-awesome" size={12} color="#fff" />
                        <Text style={styles.badgeText}>Enhanced</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Date:</Text>
                    <Text style={styles.dataValue}>{mockData.date}</Text>
                  </View>
                </Card.Content>
              </Card>
            )}
            
            <View style={styles.correctionsSection}>
              <Text style={styles.correctionsTitle}>AI Corrections Made:</Text>
              {mockData?.corrections.map((correction, index) => (
                <View key={index} style={styles.correctionItem}>
                  <Text style={styles.correctionField}>{correction.field}:</Text>
                  <View style={styles.correctionComparison}>
                    <Text style={styles.originalText}>{correction.original}</Text>
                    <Icon name="arrow-forward" size={16} color={theme.colors.primary} />
                    <Text style={styles.correctedText}>{correction.corrected}</Text>
                  </View>
                </View>
              ))}
            </View>
            
            <View style={styles.aiBadgeContainer}>
              <Icon name="verified" size={20} color={theme.colors.primary} />
              <Text style={styles.aiBadgeText}>Enhanced by SnapTrack Intelligence</Text>
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.contentSection}>
        <Text style={styles.title}>SnapTrack Intelligence at Work</Text>
        <Text style={styles.subtitle}>
          Watch our AI enhance and validate receipt data
        </Text>
        
        <View style={styles.progressContainer}>
          <ProgressBar 
            progress={progress} 
            color={theme.colors.primary}
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}% Complete
          </Text>
        </View>
        
        {renderProcessingStage()}
      </View>

      {stage === 'complete' && (
        <View style={styles.actionSection}>
          <Button
            mode="contained"
            onPress={onNext}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Continue
          </Button>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentSection: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  progressContainer: {
    marginBottom: 40,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
  },
  stageContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  brainContainer: {
    marginBottom: 16,
  },
  enhanceContainer: {
    marginBottom: 16,
  },
  stageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  stageDescription: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  featureHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  highlightText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  resultsContainer: {
    alignItems: 'center',
  },
  confidenceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confidenceLabel: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  confidenceScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  dataCard: {
    width: width * 0.9,
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    elevation: 2,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dataLabel: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  dataValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dataValue: {
    fontSize: 16,
    color: theme.colors.onBackground,
    fontWeight: '600',
  },
  enhancedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  correctionsSection: {
    width: width * 0.9,
    marginBottom: 24,
  },
  correctionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 12,
  },
  correctionItem: {
    marginBottom: 8,
  },
  correctionField: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  correctionComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalText: {
    fontSize: 14,
    color: '#d32f2f',
    textDecorationLine: 'line-through',
  },
  correctedText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  aiBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  aiBadgeText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  actionSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  primaryButton: {
    width: width * 0.8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
});