# SnapTrack Android v1.2.1 - Firebase App Distribution

**Release Date:** January 8, 2025  
**Version:** 1.2.1 (Version Code 5)  
**Platform:** Android  
**Distribution:** Firebase App Distribution

## 🐛 Bug Fix Release

### Receipt Duplication Fixed
**Issue Resolved:** Pull-to-refresh on home screen was showing duplicate recent receipts

**What was happening:**
- Users would scroll down on home screen and load more receipts
- When they pulled to refresh, they'd see duplicate receipts instead of a clean list
- The receipts tab worked fine, but home screen had this annoying bug

**What's fixed:**
- Pull-to-refresh now properly resets the receipt list
- Home screen shows correct, non-duplicated recent receipts
- Smooth refresh experience just like the receipts tab

## 🧪 Testing Instructions

**Primary Test:** Home Screen Pull-to-Refresh
1. Open the app and go to home screen
2. Scroll down to load more receipts (if you have more than 3)
3. Pull down to refresh the home screen
4. ✅ **Expected:** Should see 3 most recent receipts, no duplicates
5. ✅ **Expected:** Smooth refresh animation without glitches

**Secondary Tests:**
- Receipts tab should continue working perfectly (was unaffected)
- Load more functionality on home screen should still work
- Statistics cycling should be unaffected
- Camera and receipt processing should work normally

## 🔧 Technical Details

- **Root Cause:** Pagination state wasn't being reset before refresh
- **Solution:** Always reset to page 1 and clear existing data before loading
- **Impact:** Home screen only - no other functionality affected
- **Performance:** No impact on app speed or responsiveness

## 📱 Installation Notes

- **Min Android Version:** 6.0 (API 23)
- **Target Android Version:** 14 (API 34)
- **App Size:** ~15MB
- **Permissions:** Camera, Storage (unchanged)

## 🎯 Focus Areas for Testing

1. **Home Screen Refresh** - Main fix area
2. **Receipt Display** - Verify no visual issues
3. **Navigation** - Confirm smooth transitions
4. **Receipt Processing** - Test camera capture and processing

---

**Build Info:**
- Version: 1.2.1
- Version Code: 5
- Built with: EAS Build
- React Native: 0.79.5
- Expo SDK: 52