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
      useNativeDriver: true
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
          useNativeDriver: true
        }),
        Animated.timing(brainAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true
        })
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
          useNativeDriver: true
        }),
        Animated.timing(enhanceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true
        })
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
          corrected: '$24.99'
        },
        {
          field: 'Merchant',
          original: 'C0ffee & M0re',
          corrected: 'Coffee & More'
        }
      ]
    };
    
    setMockData(finalData);
    onDataExtraction(finalData);
    await animateProgress(0.95, 1, 500);
    
    // Animate confidence score
    Animated.timing(confidenceAnim, {
      toValue: finalData.confidence,
      duration: 1500,
      useNativeDriver: false
    }).start();
    
    setConfidence(finalData.confidence);
  };

  const animateProgress = (from: number, to: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const animation = Animated.timing({} as any, {
        toValue: 1,
        duration,
        useNativeDriver: false
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
                      outputRange: [1, 1.1]
                    })
                  }
                ]
              }
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
                  outputRange: [0.6, 1]
                })
              }
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
                    outputRange: [0, 1]
                  })
                }
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
  actionSection: {
    alignItems: 'center',
    paddingTop: 20
  },
  aiBadgeContainer: {
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  aiBadgeText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600'
  },
  brainContainer: {
    marginBottom: 16
  },
  buttonContent: {
    paddingVertical: 8
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600'
  },
  confidenceLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
    marginBottom: 8
  },
  confidenceScore: {
    color: theme.colors.primary,
    fontSize: 36,
    fontWeight: 'bold'
  },
  confidenceSection: {
    alignItems: 'center',
    marginBottom: 24
  },
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },
  contentSection: {
    flex: 1,
    paddingTop: 20
  },
  correctedText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  correctionComparison: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  correctionField: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4
  },
  correctionItem: {
    marginBottom: 8
  },
  correctionsSection: {
    marginBottom: 24,
    width: width * 0.9
  },
  correctionsTitle: {
    color: theme.colors.onBackground,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  dataCard: {
    backgroundColor: '#f8f9fa',
    elevation: 2,
    marginBottom: 24,
    width: width * 0.9
  },
  dataLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
    fontWeight: '500'
  },
  dataRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  dataValue: {
    color: theme.colors.onBackground,
    fontSize: 16,
    fontWeight: '600'
  },
  dataValueContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  enhanceContainer: {
    marginBottom: 16
  },
  enhancedBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  featureHighlight: {
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  highlightText: {
    color: theme.colors.primary,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  },
  originalText: {
    color: '#d32f2f',
    fontSize: 14,
    textDecorationLine: 'line-through'
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: width * 0.8
  },
  progressBar: {
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    height: 6
  },
  progressContainer: {
    marginBottom: 40
  },
  progressText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center'
  },
  resultsContainer: {
    alignItems: 'center'
  },
  stageContainer: {
    alignItems: 'center',
    paddingHorizontal: 20
  },
  stageDescription: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center'
  },
  stageTitle: {
    color: theme.colors.onBackground,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'center'
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 32,
    textAlign: 'center'
  },
  title: {
    color: theme.colors.onBackground,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  }
});