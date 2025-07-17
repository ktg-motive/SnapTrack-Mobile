# SnapTrack Mobile - Release Notes Guide

## Overview

This guide explains how to manage release notes for SnapTrack Mobile across TestFlight and Firebase App Distribution.

## Directory Structure

```
docs/releases/
├── RELEASE_NOTES_GUIDE.md      # This file
├── testflight/
│   ├── current.txt             # Template for next TestFlight release
│   └── v*.txt                  # Historical TestFlight releases
└── firebase/
    ├── current.md              # Template for next Firebase release  
    └── v*.md                   # Historical Firebase releases
```

## Release Notes Workflow

### 1. Before Each Release

1. **Update the current templates** with your changes:
   - `testflight/current.txt` - For iOS TestFlight
   - `firebase/current.md` - For Android Firebase

2. **Keep templates in sync** - Both should describe the same changes, just formatted differently.

### 2. During Release (Automated)

When you run `./scripts/release.sh` or `./scripts/update-version-enhanced.sh`:
- The script automatically creates versioned copies (e.g., `v1.3.1.txt`)
- Version numbers are updated in the templates
- Git commits include release information

### 3. TestFlight Format (current.txt)

```
SnapTrack v[VERSION] - [Release Type]

WHAT'S NEW:
- Major feature or fix 1
- Major feature or fix 2

IMPROVEMENTS:
- Performance enhancement 1
- Bug fix 1

TESTING FOCUS:
- Specific area to test 1
- Specific area to test 2

Build: [VERSION] | Target: iOS 13.0+ | Size: ~15MB
```

**Guidelines:**
- Keep it concise (TestFlight has character limits)
- Focus on user-visible changes
- Include testing instructions
- Maintain professional tone

### 4. Firebase Format (current.md)

```markdown
# SnapTrack Android v[VERSION] - Firebase App Distribution

**Release Date:** [Auto-filled]
**Version:** [VERSION] (Version Code [BUILD])
**Platform:** Android
**Distribution:** Firebase App Distribution

## 🔧 What's New

### Features & Improvements
- Detailed change 1
- Detailed change 2

## 🧪 Testing Instructions

1. Step-by-step testing guide
2. Specific features to verify
3. Known issues to watch for

## 📱 Installation Notes

- **Min Android Version:** 6.0 (API 23)
- **Target Android Version:** 14 (API 34)
- **App Size:** ~15MB
- **Permissions:** Camera, Storage

## 🔧 Technical Details

- Version: [VERSION]
- Version Code: [BUILD]
- Built with: EAS Build
- React Native: 0.79.5
- Expo SDK: 53
```

**Guidelines:**
- More detailed than TestFlight
- Include technical details
- Use markdown formatting
- Add emojis for sections

## Release Types

### Major Release (X.0.0)
- Breaking changes
- Major UI redesigns
- New core features
- Significant architecture changes

### Minor Release (X.Y.0)
- New features
- Significant improvements
- Non-breaking API changes
- UI enhancements

### Patch Release (X.Y.Z)
- Bug fixes
- Performance improvements
- Security updates
- Minor adjustments

## Best Practices

1. **Write for your audience**
   - TestFlight: Beta testers who know the app
   - Firebase: Internal testers and developers

2. **Be specific about changes**
   - Bad: "Bug fixes and improvements"
   - Good: "Fixed duplicate receipts on home screen refresh"

3. **Include testing guidance**
   - What to test
   - How to test it
   - Expected behavior

4. **Track breaking changes**
   - API changes
   - Data migration
   - Feature removals

5. **Use consistent formatting**
   - Follow the templates
   - Maintain section order
   - Use clear headings

## Example Release Notes

### Example: Bug Fix Release (1.2.1)

**TestFlight:**
```
SnapTrack v1.2.1 - Bug Fix Release

FIXED: Receipt duplication on home screen
- Pull-to-refresh now shows correct receipts
- Improved pagination state management

TESTING FOCUS:
- Test pull-to-refresh on home screen
- Verify no duplicate receipts appear
- Check receipts tab still works normally

Build: 1.2.1 | Target: iOS 13.0+ | Size: ~15MB
```

### Example: Feature Release (1.3.0)

**TestFlight:**
```
SnapTrack v1.3.0 - Feature Release

WHAT'S NEW:
- Export receipts to CSV/PDF formats
- Advanced search with date filters
- Bulk receipt operations

IMPROVEMENTS:
- 30% faster image processing
- Reduced app size by 2MB
- Enhanced error messages

TESTING FOCUS:
- Try exporting 10+ receipts
- Test search with various filters
- Verify bulk delete works

Build: 1.3.0 | Target: iOS 13.0+ | Size: ~13MB
```

## Automation

The release process is automated via scripts:

1. **`./scripts/release.sh`** - Complete release workflow
   - Updates versions
   - Creates release notes
   - Manages git workflow
   - Triggers EAS builds

2. **`./scripts/update-version-enhanced.sh`** - Manual version update
   - Updates all version files
   - Prepares release notes
   - Validates consistency

3. **Version displayed in app**
   - About screen shows dynamic version
   - Pulled from `expo-constants`
   - Always matches build version

## Tips

- Update release notes BEFORE running release scripts
- Review auto-generated notes for accuracy
- Keep historical notes for reference
- Use semantic versioning consistently
- Test locally before releasing

---

For questions or issues, check the scripts in `/scripts/` or refer to the main README.