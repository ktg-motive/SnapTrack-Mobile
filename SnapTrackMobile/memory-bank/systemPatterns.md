# System Patterns & Architectural Decisions

**Last Updated:** 2025-07-10 19:30:00 - Receipt Preview & Image Processing Patterns - Impacts: [UX Design, Image Processing, Data Integrity]

## Architectural Decision Records

### ADR-001: Mobile-First Fixed Layout Design (2025-01-05)
**Decision:** Implement camera app-style layout where stats and capture button remain fixed while only receipts scroll.

**Context:** Traditional mobile expense apps use full-page scrolling, but users found this disorienting when trying to access primary functions.

**Rationale:**
- Camera apps use this pattern successfully (Instagram, Snapchat)
- Keeps primary actions (capture) always accessible
- Reduces cognitive load by maintaining consistent visual anchors
- Improves one-handed usability on mobile devices

**Implementation:**
```typescript
// HomeScreen.tsx pattern
<SafeAreaView style={styles.container}>
  <Header />                     // Fixed header
  <QuickStats />                // Fixed stats
  <CaptureSection />            // Fixed capture button
  <FlatList>                    // Only this section scrolls
    {receipts.map(receipt => <SleekReceiptCard />)}
    <HomeScreenFooter />        // Smart footer with states
  </FlatList>
</SafeAreaView>
```

**Impact:** Adopted across portfolio for consistent mobile UX patterns.

### ADR-002: Intelligent Footer State Management (2025-01-05)
**Decision:** Implement 4-state footer system to provide clear navigation and scroll boundaries.

**Context:** Users needed clear feedback about list state and navigation options without overwhelming the interface.

**States Implemented:**
1. **hasMore:** Shows "View All Receipts" with scroll indicator
2. **loading:** Shows loading spinner with progress text
3. **endOfList:** Shows "All caught up!" with refresh instruction
4. **empty:** Shows capture encouragement with call-to-action

**Benefits:**
- Clear user orientation within infinite scroll lists
- Reduces "infinite scroll anxiety" with defined endpoints
- Provides contextual actions based on current state
- Improves accessibility with semantic state descriptions

**Cross-Project Application:** Pattern applicable to any infinite scroll implementation in portfolio.

### ADR-003: Typography System with Menlo for Numbers (2025-01-05)
**Decision:** Use Menlo monospace font for all numerical displays while maintaining system fonts for text.

**Context:** Financial applications require clear distinction between textual and numerical information for rapid scanning.

**Implementation:**
```typescript
export const typography = {
  // System fonts for text
  title1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  
  // Monospace for numbers
  money: { fontSize: 16, fontWeight: '600', fontFamily: 'Menlo' },
  number: { fontSize: 16, fontWeight: '600', fontFamily: 'Menlo' },
};
```

**Benefits:**
- Improved numerical data scanning and alignment
- Clear visual hierarchy between text and numbers
- Enhanced professional appearance for financial data
- Consistent spacing for tabular-style layouts

**Portfolio Impact:** Establish standard for all financial/numerical interfaces across projects.

### ADR-004: Ionicons Over Emoji for Professional Mobile UX (2025-01-05)
**Decision:** Replace all emoji icons with Ionicons for consistent, professional mobile interface.

**Context:** Emoji icons appeared unprofessional and inconsistent across different devices and OS versions.

**Migration Pattern:**
```typescript
// Before: Emoji-based icons
📄 → <Ionicons name="document-text-outline" />
✓ → <Ionicons name="checkmark-circle-outline" />
📸 → <Ionicons name="camera-outline" />
↻ → <Ionicons name="refresh-outline" />
```

**Benefits:**
- Consistent appearance across all iOS devices
- Professional, native-looking interface
- Better accessibility with semantic icon names
- Scalable vector graphics for all screen densities

**Standard:** Adopted as portfolio standard for all mobile interfaces.

### ADR-005: Hamburger Menu Navigation Pattern (2025-07-06)
**Decision:** Implement slide-out hamburger menu for account-related functions instead of dedicated footer tab.

**Context:** Mobile apps benefit from reducing cognitive load in primary navigation while providing easy access to secondary functions.

**Implementation:**
```typescript
// HamburgerMenu component with slide-out animation
interface HamburgerMenuProps {
  isVisible: boolean;
  onClose: () => void;
  navigation: any;
  userStats?: UserStats;
}

// 280px width (85% of screen, max 320px)
const MENU_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);

// 300ms smooth animation with native driver
Animated.timing(slideAnim, {
  toValue: 0,
  duration: 300,
  useNativeDriver: true,
})
```

**Navigation Structure:**
```
Hamburger Menu
├── Profile Section (photo, name, email, stats)
├── Navigation Items
│   ├── Account Settings
│   ├── App Settings  
│   ├── Help & Support
│   └── Send Feedback
├── App Information (version, about)
└── Logout Button
```

**Benefits:**
- Reduces footer tabs from 5 to 4 for better mobile usability
- Provides space for rich user information display
- Allows hierarchical navigation for secondary functions
- Follows iOS design patterns (Settings app, etc.)
- Maintains consistent access to account functions

**Portfolio Impact:** Establishes standard for complex mobile navigation in professional apps.

### ADR-006: Enhanced Settings Screen with API Consistency (2025-07-06)
**Decision:** Create comprehensive mobile settings that match web app functionality while respecting backend limitations.

**Context:** Mobile users need advanced settings management but backend doesn't support all CRUD operations.

**Implementation Strategy:**
```typescript
// Entity Management: Add/Delete only (no update)
handleEditEntity = () => {
  Alert.alert(
    'Edit Entity',
    'Entity editing is not supported. Delete and recreate with desired name.',
    [
      { text: 'OK' },
      { text: 'Delete Entity', style: 'destructive', onPress: handleDelete }
    ]
  );
};

// Tag Management: Read-only display with chip UI
<View style={styles.tagsContainer}>
  {tags.map((tag, index) => (
    <View key={index} style={styles.tagChip}>
      <Text style={styles.tagText}>{tag}</Text>
    </View>
  ))}
</View>
```

**API Consistency Patterns:**
- Entity IDs as strings (not numbers) to match backend
- Response format handling: `{"success": true, "entities": [...], "count": N}`
- Informative error messages for unsupported operations
- Graceful degradation for backend limitations

**User Experience Principles:**
- Explain limitations clearly to users
- Provide alternative workflows when possible
- Maintain visual consistency with web app
- Use mobile-optimized UI patterns (modals, toggles, chips)

**Benefits:**
- 100% API compatibility with web app and backend
- Clear user understanding of feature capabilities
- Professional mobile settings experience
- Future-proof for backend enhancements

**Portfolio Standard:** Template for mobile settings in any multi-platform application.

### ADR-007: Modal-Driven Mobile Settings UI Pattern (2025-07-06)
**Decision:** Use slide-up modals for entity/tag creation instead of inline editing.

**Context:** Mobile screens have limited space for inline editing workflows that work well on desktop.

**Modal Pattern:**
```typescript
// Full-screen modal with pageSheet presentation
<Modal
  visible={showEntityModal}
  animationType="slide"
  presentationStyle="pageSheet"
>
  <SafeAreaView style={styles.modalContainer}>
    <View style={styles.modalHeader}>
      <TouchableOpacity onPress={onCancel}>
        <Text style={styles.modalCancelText}>Cancel</Text>
      </TouchableOpacity>
      <Text style={styles.modalTitle}>Add Entity</Text>
      <TouchableOpacity onPress={onSave}>
        <Text style={styles.modalSaveText}>Save</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.modalContent}>
      {/* Form content */}
    </View>
  </SafeAreaView>
</Modal>
```

**Design Principles:**
- Clear header with Cancel/Title/Save layout
- Auto-focus first input field
- Proper keyboard handling
- Native iOS modal presentation style
- Consistent color scheme and typography

**Benefits:**
- Focuses user attention on single task
- Provides clear action boundaries (Cancel/Save)
- Works well with mobile keyboards
- Follows native iOS patterns

**Application:** Standard pattern for any mobile form or creation workflow.

## Design System Patterns

### Color Strategy: Functional Color Coding
**Pattern:** Use color strategically to differentiate information types and create visual hierarchy.

**Implementation:**
- **Green (#10B981):** Success states, tags, positive financial data
- **Blue (#1C65C9):** Primary actions, links, interactive elements  
- **Gray (#6B7280):** Secondary information, entity badges, metadata
- **Teal (#019C89):** Secondary actions, gradients, accent elements

**Usage Rules:**
1. Tags use green to differentiate from gray entity badges
2. Primary actions always use blue for consistency
3. Financial amounts use primary blue to emphasize importance
4. Secondary metadata uses gray for visual de-emphasis

### ADR-009: Receipt Preview Modal Design Pattern (2025-07-10)
**Decision:** Implement comprehensive receipt preview with smart image display and professional financial app experience.

**Context:** Original receipt preview showed squished images and provided limited functionality. UX designer requested professional preview experience per `/Users/Kai/Dev/Active/SnapTrack/docs/RECEIPT_PREVIEW_REDESIGN.md`.

**Implementation Pattern:**
```typescript
// Smart Image Display with Aspect Ratio Preservation
const ReceiptImageSection = ({ imageUri, onZoom }) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    Image.getSize(imageUri, (originalWidth, originalHeight) => {
      // Calculate optimal display size maintaining aspect ratio
      const aspectRatio = originalHeight / originalWidth;
      const availableWidth = screenWidth - (spacing.md * 2);
      
      let displayWidth = availableWidth;
      let displayHeight = displayWidth * aspectRatio;
      
      // Constrain by height if too tall
      if (displayHeight > maxImageHeight) {
        displayHeight = maxImageHeight;
        displayWidth = displayHeight / aspectRatio;
      }
      
      setImageSize({ width: displayWidth, height: displayHeight });
    });
  }, [imageUri]);

  return (
    <ScrollView 
      minimumZoomScale={1}
      maximumZoomScale={3}
      pinchGestureEnabled={true}>
      <Image style={imageSize} resizeMode="stretch" />
    </ScrollView>
  );
};
```

**Benefits:**
- Dynamic aspect ratio calculation maintains receipt proportions
- Pinch-to-zoom functionality for receipt text readability  
- Professional financial app experience with rich metadata
- Enhanced UI with confidence indicators and smart actions

### ADR-010: Image Processing Aspect Ratio Preservation (2025-07-10)
**Decision:** Fix expo-image-manipulator to preserve original aspect ratios instead of forcing square dimensions.

**Problem:** All receipts were being saved as 2048x2048 squares, causing horizontal compression and unreadable text.

**Root Cause:** 
```typescript
// BROKEN - Forces square dimensions
{
  resize: {
    width: 2048,   // Both specified = square!
    height: 2048,
  }
}
```

**Solution:**
```typescript
// FIXED - Preserves aspect ratio
const aspectRatio = originalWidth / originalHeight;

if (aspectRatio > 1) {
  // Landscape - constrain by width
  resizeWidth = Math.min(originalWidth, config.maxWidth);
  resizeHeight = resizeWidth / aspectRatio;
} else {
  // Portrait - constrain by height  
  resizeHeight = Math.min(originalHeight, config.maxHeight);
  resizeWidth = resizeHeight * aspectRatio;
}

{
  resize: {
    width: Math.round(resizeWidth),   // Calculated
    height: Math.round(resizeHeight), // Calculated
  }
}
```

**Impact:**
- New receipts maintain proper proportions (e.g., 1920x2560 portrait)
- Still optimized for Google Vision API with 2048px max dimension
- Fixes receipt readability and professional appearance

### ADR-011: React Native Conditional Rendering Safety Pattern (2025-07-10)
**Decision:** Use explicit ternary operators instead of logical AND operators for conditional rendering.

**Problem:** React Native "Text strings must be rendered within a <Text> component" errors when using `condition &&`.

**Anti-Pattern:**
```typescript
// BROKEN - Can render falsy values
{badgeColor && <View style={{backgroundColor: badgeColor}} />}
{confidence < 85 && <Icon name="warning" />}
```

**Safe Pattern:**
```typescript
// SAFE - Only renders valid components or null
{badgeColor ? <View style={{backgroundColor: badgeColor}} /> : null}
{confidence < 85 ? <Icon name="warning" /> : null}
```

**Rationale:**
- React Native interprets falsy values as renderable content
- Explicit ternaries guarantee only valid components are rendered
- Prevents crashes and improves component reliability

### ADR-012: Multi-Layer Data Deduplication Pattern (2025-07-10)
**Decision:** Implement deduplication at multiple levels to prevent FlatList duplicate key warnings.

**Problem:** FlatList showing "Encountered two children with the same key" errors due to duplicate receipt IDs.

**Multi-Layer Solution:**
```typescript
// Layer 1: API Response Level (HomeScreen)
setRecentReceipts(prev => {
  const existingIds = new Set(prev.map(receipt => receipt.id));
  const newReceipts = receiptsData.filter(receipt => !existingIds.has(receipt.id));
  return [...prev, ...newReceipts];
});

// Layer 2: Component Props Level (RecentReceipts)
useEffect(() => {
  const uniqueReceipts = receipts.filter((receipt, index, self) => 
    index === self.findIndex(r => r.id === receipt.id)
  );
  setLocalReceipts(uniqueReceipts);
}, [receipts]);

// Layer 3: FlatList Key Extraction
keyExtractor={(item) => item.id}  // Now guaranteed unique
```

**Benefits:**
- Prevents duplicate keys at data source
- Handles API inconsistencies gracefully
- Ensures stable FlatList rendering performance

### Component Architecture: Smart State Components
**Pattern:** Components manage their own state and provide callback interfaces for parent coordination.

**Example: HomeScreenFooter**
```typescript
interface HomeScreenFooterProps {
  receiptsState: ReceiptsState;    // State from parent
  onViewAllTapped: () => void;     // Callbacks for actions
  onEmptyStateTapped: () => void;
}

// Component handles its own presentation logic
const renderContent = () => {
  switch (receiptsState) {
    case ReceiptsState.hasMore: return <ViewAllUI />;
    case ReceiptsState.loading: return <LoadingUI />;
    // ... other states
  }
};
```

**Benefits:**
- Clear separation of concerns between data and presentation
- Reusable components across different screens
- Testable component logic independent of data layer
- Predictable state management patterns

### Layout Pattern: Fixed + Scrollable Architecture
**Pattern:** Critical UI elements remain fixed while content areas scroll independently.

**Layout Hierarchy:**
1. **Fixed Header:** Navigation and app branding
2. **Fixed Stats:** Key metrics always visible
3. **Fixed Actions:** Primary capture button accessible
4. **Scrollable Content:** Infinite list with smart footer
5. **Smart Footer:** Context-aware navigation options

**Implementation Considerations:**
- Use `position: 'absolute'` sparingly; prefer flexbox layouts
- Ensure fixed elements don't overlap scrollable content
- Test on various screen sizes and orientations
- Maintain 44px minimum touch targets for accessibility

### Error Handling Pattern: Progressive Enhancement
**Pattern:** Handle errors gracefully with fallback options and clear user communication.

**Layers:**
1. **Network Errors:** Queue operations for retry when connection restored
2. **API Errors:** Show user-friendly messages with suggested actions
3. **Validation Errors:** Real-time feedback with clear correction guidance
4. **Unexpected Errors:** Graceful degradation with manual override options

**User Communication:**
- Use positive language focused on solutions
- Provide specific actions users can take
- Show progress indicators for background retry attempts
- Maintain app functionality even when backend services fail

## Performance Patterns

### Image Handling Strategy
**Pattern:** Optimize images for mobile performance while maintaining quality.

**Implementation:**
```typescript
// Proper image optimization
<Image 
  source={{ uri: receipt.receipt_url }}
  style={styles.receiptImage}
  resizeMode="contain"           // Maintain aspect ratio
  loadingIndicatorSource={placeholder}
/>

// Caching strategy
const imageCache = new Map();   // Simple memory cache
```

**Best Practices:**
- Use `resizeMode: 'contain'` for receipt images to prevent distortion
- Implement proper loading states with placeholder images
- Cache frequently accessed images in memory
- Compress images before upload to reduce bandwidth

### List Performance: FlatList Optimization
**Pattern:** Use FlatList with proper optimization for smooth scrolling performance.

**Key Optimizations:**
```typescript
<FlatList
  data={receipts}
  renderItem={renderReceiptCard}
  keyExtractor={(item) => item.id}
  getItemLayout={getItemLayout}        // Pre-calculate item dimensions
  removeClippedSubviews={true}         // Remove off-screen items
  maxToRenderPerBatch={10}             // Limit render batch size
  windowSize={10}                      // Control virtual window
/>
```

**Performance Monitoring:**
- Monitor memory usage during long scrolling sessions
- Test with large datasets (1000+ items)
- Validate smooth 60fps scrolling on target devices
- Profile component render frequency and optimization opportunities

## Security & Privacy Patterns

### Data Minimization Strategy
**Pattern:** Collect and store only essential data required for core functionality.

**Implementation:**
- Receipt images stored temporarily during processing
- OCR data cached locally only for offline functionality
- User preferences stored in AsyncStorage with encryption
- No analytics or tracking beyond essential error reporting

### Authentication Security Pattern
**Pattern:** Implement secure authentication with minimal user friction.

**Security Measures:**
```typescript
// Token security
await SecureStore.setItemAsync('auth_token', token);

// Automatic token refresh
const refreshToken = async () => {
  try {
    const newToken = await auth.refreshToken();
    await SecureStore.setItemAsync('auth_token', newToken);
  } catch (error) {
    // Redirect to login
  }
};
```

**Privacy Considerations:**
- All API communication over HTTPS
- Firebase security rules restrict access to user's own data
- Image uploads include automatic expiration
- Clear data deletion on sign-out

## Testing Patterns

### Component Testing Strategy
**Pattern:** Test components in isolation with clear input/output validation.

**Testing Approach:**
1. **Unit Tests:** Pure functions and utility methods
2. **Component Tests:** Render behavior and user interactions
3. **Integration Tests:** API client and authentication flows
4. **E2E Tests:** Critical user journeys from start to finish

**Mock Strategy:**
- Mock API responses for consistent testing
- Mock camera functionality for simulator testing
- Mock AsyncStorage for predictable state testing
- Use fixture data for repeatable test scenarios

### Performance Testing Pattern
**Pattern:** Establish performance benchmarks and monitor regressions.

**Key Metrics:**
- App launch time: Target <3 seconds cold start
- Screen transition time: Target <300ms between screens
- Image loading time: Target <2 seconds for receipt display
- Memory usage: Monitor for leaks during extended use

**Monitoring Tools:**
- React Native Performance Monitor for render times
- Xcode Instruments for memory profiling
- Network tab for API performance monitoring
- User feedback for real-world performance validation

## Future Evolution Patterns

### Scalability Considerations
**Pattern:** Design components and patterns that scale with feature growth.

**Scalable Architectures:**
- Component composition over inheritance
- Hook-based state management for reusability
- Configuration-driven UI for feature toggles
- Modular API client for service expansion

### Cross-Platform Preparation
**Pattern:** Structure code for future Android deployment without major refactoring.

**Platform-Agnostic Patterns:**
- Shared business logic in separate modules
- Platform-specific UI components with common interfaces
- Consistent theming system across platforms
- Abstracted native functionality behind common APIs

### Analytics Integration Readiness
**Pattern:** Prepare for future analytics without current implementation.

**Future-Ready Structure:**
```typescript
// Analytics interface ready for implementation
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

// Placeholder for future analytics service
const analytics = {
  track: (event: AnalyticsEvent) => {
    // Future implementation
  }
};
```

**Privacy-First Approach:**
- User consent mechanisms ready for implementation
- Data minimization principles established
- GDPR compliance patterns prepared
- User control over data collection preferences

## Critical API Integration Patterns

### ADR-009: API Response Contract Preservation (2025-07-07)
**Decision:** Maintain strict API contracts and handle response transformations in the client.

**Context:** API response format changes can break mobile apps instantly, causing crashes and data loss.

**Critical Patterns:**

1. **Entity Management API Contract:**
```typescript
// apiClient.getEntities() MUST return Entity[] directly
async getEntities(): Promise<Entity[]> {
  const response = await this.makeRequest<any>('/api/entities');
  // Backend returns: {"success": true, "entities": [...]}
  if (Array.isArray(response.entities)) {
    return response.entities; // Return array directly, NOT {data: entities}
  }
}
```

2. **Receipt Upload Response Transformation:**
```typescript
// Handle multiple response formats for backward compatibility
if (response.success && response.expense) {
  // New standardized format - transform for UI compatibility
  return {
    id: response.expense.id,
    extracted_data: {
      vendor: response.expense.vendor,
      amount: response.expense.amount,
      date: response.expense.date,
    },
    receipt_url: response.expense.image_url,
    status: 'completed'
  };
}
```

3. **Deletion Pattern - API + State:**
```typescript
// Always call API first, then update local state
onDeleteReceipt={async (receiptId) => {
  await apiClient.deleteReceipt(receiptId); // API call first
  setReceipts(prev => prev.filter(r => r.id !== receiptId)); // Then state
}}
```

**Rationale:**
- Prevents production crashes from response format mismatches
- Maintains backward compatibility
- Centralizes transformation logic
- Preserves working functionality

**Impact:** Critical for app stability - breaking these patterns causes immediate user-facing crashes.

### API Error Handling Pattern
**Pattern:** Always provide fallback behavior for API failures.

```typescript
try {
  const entities = await apiClient.getEntities();
  setEntities(entities);
} catch (error) {
  // Fallback to default entities
  setEntities([
    { id: '1', name: 'Personal', ... },
    { id: '2', name: 'Business', ... }
  ]);
}
```

**Benefits:**
- App remains functional during API outages
- Better user experience with graceful degradation
- Easier debugging with predictable fallbacks