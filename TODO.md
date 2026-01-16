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

## In Progress
(none)

## Pending
(none)

## Blocked
(none)

## Notes
- Followed patterns from deposit-workflow for activities structure
- sharp dependency added to packages/workflows
- Pre-existing TypeScript error in wagmi/constants.ts (missing contracts build artifact) - not related to this work
- Server-side blurhash generation handles native uploads when client doesn't provide blurhash
- getProfileAvatarUrl utility function provides fallback from avatar_data to legacy avatar_url

## Verification Results (Iteration 5)
- Workflow structure: ✅ workflow.ts, activities.ts, types.ts in packages/workflows/src/image-workflow/
- Migration: ✅ 20260115203322_add_image_data_columns_to_profiles.sql
- tRPC endpoint: ✅ profile.uploadImage in packages/api/src/routers/profile.ts
- Upload hook: ✅ useUploadProfileImage.ts in packages/app/features/account/hooks/
- Avatar helpers: ✅ getAvatarUrl, getBannerUrl, getProfileAvatarUrl in packages/app/utils/avatar.ts
- Lint: ✅ 0 errors, 39 warnings (pre-existing)
- TypeScript: ✅ Only pre-existing wagmi error (missing contracts build)
