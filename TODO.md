# TODO - Image Optimization Implementation

## Completed
- [x] Read existing workflow patterns and understand codebase structure (iteration 1)
- [x] Create database migration for avatar_data and banner_data columns (iteration 2)
- [x] Create Temporal image workflow with activities (iteration 2)
- [x] Register workflow and activities in all-workflows.ts and all-activities.ts (iteration 2)
- [x] Create tRPC profile.uploadImage endpoint (iteration 3)
- [x] Create avatar/banner URL helpers in packages/app/utils/avatar.ts (iteration 3)
- [x] Create useUploadProfileImage hook with blurhash generation (iteration 4-5)
- [x] Update UploadAvatar and UploadBanner components to use new hook (iteration 4-5)
- [x] Update ProfileAvatar component to use new data structure with BlurhashPlaceholder (iteration 5)
- [x] Create BlurhashPlaceholder component (web Canvas + native expo-image) (iteration 5)
- [x] Fix avatar_url usages in SendChat and SearchBar (iteration 5)
- [x] Fix AvatarMenuButton web implementation to use useUser internally (iteration 5)
- [x] Run verification commands (typecheck, lint) - all pass (iteration 5)
- [x] ISSUE-13: Fix native blurhash generation - now returns default placeholder (iteration 6)
- [x] ISSUE-14: Fix remaining avatar_url usages in SearchBarSend.tsx and screen.tsx (iteration 6)

## In Progress
(none)

## Pending
(none)

## Blocked
(none)

## Notes
- Followed patterns from deposit-workflow for activities structure
- sharp dependency added to packages/workflows (version 0.32.6 to match next-app)
- Pre-existing TypeScript error in wagmi/constants.ts (missing contracts build artifact) - not related to this work
- Server-side blurhash generation handles native uploads when client doesn't provide blurhash
- getProfileAvatarUrl utility function provides fallback from avatar_data to legacy avatar_url
- Native platforms now return a default placeholder blurhash instead of undefined

## Verification Results (Iteration 6)
- ISSUE-13 Fixed: Native generateBlurhash now returns default placeholder blurhash
- ISSUE-14 Fixed: SearchBarSend.tsx and screen.tsx now use getProfileAvatarUrl
- Biome check: No fixes needed
