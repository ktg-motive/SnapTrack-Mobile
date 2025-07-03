# System Patterns

**Last Updated:** 2025-07-03 14:55:00  
**Architecture Pattern:** Mobile-First Client with Cloud Processing Backend  
**Design Philosophy:** Native mobile experience with enterprise-grade reliability  
**Cross-Project Pattern:** React Native + Backend API integration template

## Core Architectural Patterns

### Mobile-Cloud Hybrid Architecture
```typescript
// Pattern: Mobile Client + Cloud Processing
Mobile App (React Native) → API Gateway → Processing Services → Database
├── Instant UI Response: Optimistic updates and progress indicators
├── Cloud Processing: Heavy OCR and AI validation on backend
├── Offline Resilience: Local queue with automatic sync
└── Cross-Platform: Shared business logic with platform-specific optimizations

// Implementation Benefits
- Fast mobile experience with instant feedback
- Accurate processing via cloud-based OCR and AI
- Reliable operation regardless of network conditions
- Scalable processing capacity without mobile device limitations
```

### State Management Pattern
```typescript
// Pattern: Hybrid State Management
Local State (useState) + Context (Auth) + Backend Sync + Offline Queue

// Local State: Component-specific UI state
const [isLoading, setIsLoading] = useState(false);
const [formData, setFormData] = useState(initialState);

// Context State: App-wide shared state
const AuthContext = createContext<AuthContextType>();

// Backend Sync: Real-time data synchronization
const apiClient = new ApiClient(baseURL, authToken);

// Offline Queue: Resilient data persistence
const offlineStorage = new OfflineStorage(AsyncStorage);

// Benefits: Simple, predictable, resilient to network issues
```

### Error Handling & Resilience Pattern
```typescript
// Pattern: Layered Error Handling with User Recovery
API Layer → Service Layer → Component Layer → User Interface

// API Layer: HTTP status codes and network errors
class ApiError extends Error {
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Service Layer: Business logic error translation
async function uploadReceipt(imageUri: string): Promise<UploadedReceipt> {
  try {
    return await apiClient.uploadReceipt(imageUri);
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      throw new Error('Server is busy. Please try again in a moment.');
    }
    throw error;
  }
}

// Component Layer: Graceful degradation and fallbacks
const handleSave = async () => {
  try {
    await saveReceipt(receiptData);
  } catch (error) {
    if (offline) {
      await queueForLater(receiptData);
      showOfflineSuccessMessage();
    } else {
      showErrorAlert(error.message);
    }
  }
};

// Benefits: User always has a path forward, no dead ends
```

### Mobile UX Pattern Library
```typescript
// Pattern: Progressive Enhancement for Mobile
Base Functionality → Enhanced Features → Premium Experience

// Base: Core capture and save functionality
- Camera access and photo capture
- Basic form validation and submission
- Simple error messages and retry options

// Enhanced: Improved user experience
- Real-time progress indicators during processing
- Autocomplete and smart suggestions
- Offline queue with sync indicators

// Premium: Advanced mobile features
- Haptic feedback for interactions
- Smooth animations and transitions
- Context-aware suggestions and automation

// Benefits: Works for all users, delights power users
```

## Data Flow Patterns

### Receipt Processing Pipeline
```typescript
// Pattern: Asynchronous Processing with Real-time Feedback
Mobile Capture → Upload → Processing → Review → Save

// Stage 1: Immediate Response
User taps capture → Instant UI feedback → Local image storage

// Stage 2: Background Upload
Queue upload task → Progress indicator → Network resilience

// Stage 3: Cloud Processing
OCR extraction → AI validation → Confidence scoring

// Stage 4: User Review
Populated form → Edit capabilities → Validation

// Stage 5: Final Storage
Save to database → Sync confirmation → Navigation

// Benefits: User never waits, always has control, sees progress
```

### Offline-First Data Synchronization
```typescript
// Pattern: Queue-Sync-Reconcile for Offline Resilience
Local Queue → Network Detection → Batch Sync → Conflict Resolution

// Local Operations: Always succeed immediately
const queueReceipt = async (receiptData: ReceiptData) => {
  await AsyncStorage.setItem(`queue_${uuid()}`, JSON.stringify(receiptData));
  updateQueueCount();
  showSuccessMessage('Receipt saved for sync');
};

// Network Detection: Automatic sync triggers
NetInfo.addEventListener(state => {
  if (state.isConnected && hasQueuedItems()) {
    processQueue();
  }
});

// Batch Processing: Efficient network usage
const processQueue = async () => {
  const queuedItems = await getQueuedItems();
  const results = await Promise.allSettled(
    queuedItems.map(item => apiClient.uploadReceipt(item))
  );
  handleResults(results);
};

// Benefits: Works offline, efficient sync, predictable behavior
```

### Authentication Flow Pattern
```typescript
// Pattern: Token-Based Auth with Automatic Refresh
Firebase Client → JWT Token → API Gateway → Service Authentication

// Client Authentication: Seamless user experience
const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  await storeAuthToken(token);
  apiClient.setAuthToken(token);
  return userCredential.user;
};

// Automatic Refresh: Transparent token management
const apiRequest = async (endpoint: string, options: RequestOptions) => {
  try {
    return await fetch(endpoint, options);
  } catch (error) {
    if (error.status === 401) {
      await refreshAuthToken();
      return await fetch(endpoint, { ...options, headers: getAuthHeaders() });
    }
    throw error;
  }
};

// Benefits: Secure, automatic, transparent to user
```

## UI/UX Design Patterns

### Mobile-First Component Architecture
```typescript
// Pattern: Responsive Components with Touch Optimization
Base Component → Mobile Adaptations → Platform Specifics

// Touch Targets: Minimum 44px for accessibility
const styles = StyleSheet.create({
  touchTarget: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Progressive Enhancement: Core → Enhanced → Platform-specific
const Button = ({ title, onPress, enhanced, platform }) => (
  <TouchableOpacity
    style={[styles.button, enhanced && styles.enhanced]}
    onPress={onPress}
    activeOpacity={0.7}
    {...(platform === 'ios' && { hapticFeedback: true })}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

// Benefits: Accessible, performant, platform-appropriate
```

### Loading and Progress Patterns
```typescript
// Pattern: Layered Progress Feedback for Long Operations
Immediate → Progress → Completion → Recovery

// Immediate Feedback: User action acknowledged
const handleCapture = () => {
  setIsLoading(true); // Immediate UI update
  Haptics.impactAsync(); // Tactile feedback
  processReceipt(); // Async operation
};

// Progress Feedback: Keep user informed
const [processingState, setProcessingState] = useState({
  stage: 'uploading',
  progress: 0,
  message: 'Uploading receipt image...'
});

// Completion Feedback: Clear success indication
const showSuccess = () => {
  Alert.alert('Success!', 'Receipt processed successfully', [
    { text: 'OK', onPress: () => navigation.navigate('Home') }
  ]);
};

// Benefits: User always knows status, no perceived delays
```

### Form Handling Pattern
```typescript
// Pattern: Progressive Form Enhancement with Smart Defaults
Basic Input → Validation → Autocomplete → Smart Defaults

// Basic Form State
const [formData, setFormData] = useState({
  vendor: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  entity: 'personal',
  tags: '',
  notes: ''
});

// Smart Validation: Immediate feedback without blocking
const validateAmount = (value: string) => {
  const numValue = parseFloat(value);
  return {
    isValid: !isNaN(numValue) && numValue > 0,
    message: isNaN(numValue) ? 'Please enter a valid amount' : ''
  };
};

// Autocomplete Integration: Smooth user experience
const [suggestions, setSuggestions] = useState([]);
const searchTags = debounce(async (query) => {
  const results = await apiClient.searchTags(query);
  setSuggestions(results);
}, 300);

// Benefits: Fast, accurate, helpful without being intrusive
```

## Performance Patterns

### Optimization Strategies
```typescript
// Pattern: Lazy Loading with Intelligent Preloading
Load Immediately → Load on Demand → Preload Likely Needs

// Critical Path: Load immediately
const CriticalComponents = React.lazy(() => import('./CriticalComponents'));

// On-Demand: Load when needed
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Preloading: Load likely next needs
useEffect(() => {
  if (userOnHomeScreen && !reviewScreenLoaded) {
    import('./ReviewScreen'); // Preload likely next screen
  }
}, [userOnHomeScreen, reviewScreenLoaded]);

// Benefits: Fast initial load, smooth navigation, efficient memory usage
```

### Memory Management Pattern
```typescript
// Pattern: Lifecycle-Aware Resource Management
Acquire → Use → Cleanup → Optimize

// Resource Acquisition: As late as possible
useEffect(() => {
  const subscription = NetInfo.addEventListener(handleNetworkChange);
  return () => subscription(); // Cleanup on unmount
}, []);

// Memory Optimization: Image and data cleanup
const [receiptImage, setReceiptImage] = useState(null);
useEffect(() => {
  return () => {
    if (receiptImage) {
      URL.revokeObjectURL(receiptImage); // Free memory
    }
  };
}, [receiptImage]);

// Benefits: Minimal memory footprint, no memory leaks, smooth performance
```

## Security Patterns

### Data Protection Strategy
```typescript
// Pattern: Defense in Depth for Mobile Security
Client Validation → Transport Security → Server Validation → Storage Security

// Client Validation: Basic checks and UX
const validateInput = (input: string) => {
  return input.trim().length > 0 && input.length < 1000;
};

// Transport Security: HTTPS with certificate pinning
const apiClient = new ApiClient({
  baseURL: 'https://api.snaptrack.com',
  timeout: 30000,
  validateStatus: (status) => status < 500
});

// Token Security: Secure storage and transmission
const storeAuthToken = async (token: string) => {
  await AsyncStorage.setItem('@auth_token', token);
};

// Benefits: Multiple security layers, user data protection, compliance ready
```

## Cross-Project Reusable Patterns

### Mobile App Architecture Template
```typescript
// Pattern: Scalable Mobile App Foundation
Authentication + Navigation + API Client + Offline Storage + Error Handling

// Reusable across portfolio projects:
// - LA-AI mobile app for event management
// - MotiveAI mobile tool for AI assessments
// - MotiveESG mobile platform for data collection
// - FairhopeNow mobile news reading experience

// Standard Technology Stack:
// - React Native + Expo for cross-platform development
// - Firebase Auth for authentication
// - Custom API client with error handling
// - AsyncStorage for offline data
// - Consistent UI/UX patterns and design system
```

### API Integration Pattern
```typescript
// Pattern: Reliable Client-Server Communication
Type Safety + Error Handling + Offline Support + Real-time Sync

// Reusable API client pattern for all portfolio projects:
class ApiClient {
  private baseURL: string;
  private authToken: string | null = null;
  
  async request<T>(endpoint: string, options: RequestOptions): Promise<T> {
    // Standard error handling, retries, offline detection
  }
  
  setAuthToken(token: string) {
    this.authToken = token;
  }
  
  // Methods for common operations: GET, POST, PUT, DELETE, upload
}

// Benefits: Consistent error handling, reliable communication, code reuse
```

### Design System Pattern
```typescript
// Pattern: Consistent Brand Experience Across Portfolio
Colors + Typography + Spacing + Components + Interactions

// Shared design tokens across all mobile apps:
export const designSystem = {
  colors: {
    primary: '#1A73E8',
    secondary: '#34A853',
    surface: '#F8F9FA',
    // ... consistent color palette
  },
  typography: {
    title1: { fontSize: 28, fontWeight: '700' },
    title2: { fontSize: 22, fontWeight: '600' },
    // ... consistent typography scale
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32
  }
};

// Benefits: Brand consistency, faster development, professional appearance
```

## Decision Patterns and Trade-offs

### Technology Choice Framework
```typescript
// Pattern: Systematic Technology Evaluation
Requirements → Options → Trade-offs → Decision → Validation

// Example: React Native vs Native Development
Requirements: Cross-platform, fast development, shared backend
Options: React Native, Flutter, Native iOS/Android
Trade-offs: Development speed vs performance, code sharing vs platform features
Decision: React Native with Expo for rapid prototyping and deployment
Validation: Successful TestFlight deployment with production-ready performance

// Benefits: Documented decisions, consistent choices, efficient development
```

### Feature Implementation Strategy
```typescript
// Pattern: MVP → Enhancement → Platform Optimization
Core Functionality → User Experience → Performance → Platform Features

// Phase 1: Core functionality working
- Basic receipt capture and processing
- Essential error handling and validation
- Simple but functional user interface

// Phase 2: Enhanced user experience
- Smooth animations and transitions
- Advanced error recovery and guidance
- Optimized workflows and smart defaults

// Phase 3: Platform optimization
- iOS-specific features and integrations
- Performance tuning for device capabilities
- Advanced platform features (Shortcuts, Widgets)

// Benefits: Predictable delivery, incremental value, risk mitigation
```