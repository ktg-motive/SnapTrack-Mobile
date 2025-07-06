# System Patterns & Architectural Decisions

**Last Updated:** 2025-01-05 16:00:00 - UI/UX Enhancement Session - Impacts: [Portfolio Design System]

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