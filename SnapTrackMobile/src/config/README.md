# Configuration Files

## firebase.config.ts - DO NOT MODIFY

This file contains the hardcoded Firebase configuration for SnapTrack. 

**CRITICAL**: This file must NEVER be:
- Modified to use environment variables
- Made conditional based on environment
- Ignored by git
- Deleted or moved

**Why**: Firebase authentication must always work, regardless of build environment or configuration. These are public client-side values that are safe to commit.

## index.ts

General application configuration that can use environment variables for non-critical settings like:
- API base URLs
- Feature flags
- Non-authentication related settings

**Rule**: Authentication configuration should NEVER depend on environment variables.