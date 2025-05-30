# Next.js to Cloudflare Workers Migration Progress

## Overview
This document tracks the progress of migrating the Send Next.js application from Vercel to Cloudflare Workers using OpenNext.

## Migration Status

### Completed Tasks ✅

1. **Analyzed current Next.js setup**
   - Next.js 15.3.1
   - Uses Tamagui for cross-platform UI
   - Has TRPC API routes with 90s max duration on Vercel
   - Standalone output mode in production
   - Multiple webpack plugins and customizations

2. **Installed required dependencies**
   ```bash
   yarn add @opennextjs/cloudflare@latest --dev
   yarn add wrangler@latest --dev
   ```

3. **Created configuration files**
   - `wrangler.jsonc` - Cloudflare Workers configuration
   - `open-next.config.ts` - OpenNext adapter configuration
   - `.dev.vars` - Development environment variables
   - `public/_headers` - Static asset caching headers

4. **Updated package.json scripts**
   - Added `preview:cf` script for local preview
   - Added `deploy:cf` script for deployment

5. **Updated .gitignore**
   - Added `.open-next` and `.wrangler` directories

6. **Updated next.config.js**
   - Added OpenNext Cloudflare initialization for development
   - Kept all existing plugins and configurations

7. **Removed Vercel-specific files**
   - Deleted `vercel.json`

### Current Issue 🚧

The build is failing due to missing contract artifacts:
```
Module not found: Can't resolve '@my/contracts/out/EntryPointSimulations.sol/EntryPointSimulations.json'
```

This suggests that the contracts need to be built before the Next.js build can succeed.

### Pending Tasks 📋

1. **Fix build issues**
   - Build contracts first: `yarn contracts build`
   - Ensure all dependencies are properly linked

2. **Test local deployment**
   - Run `yarn preview:cf` after successful build
   - Verify all routes work correctly

3. **Configure environment variables**
   - Map all required environment variables to Cloudflare
   - Update wrangler.jsonc with production vars

4. **Update CI/CD**
   - Modify deployment workflows for Cloudflare
   - Update GitHub Actions or other CI tools

5. **Performance optimization**
   - Review CPU limits (currently set to 50ms)
   - Consider R2 bucket for caching if needed
   - Configure KV namespaces if required

## Key Files Modified

1. **package.json**
   - Added OpenNext and Wrangler dependencies
   - Added Cloudflare deployment scripts

2. **next.config.js**
   - Added OpenNext initialization for development
   - Preserved all existing configurations

3. **wrangler.jsonc**
   ```jsonc
   {
     "compatibility_date": "2025-01-01",
     "compatibility_flags": ["nodejs_compat_v2"],
     "name": "send-app-next",
     "vars": {
       "NEXTJS_ENV": "production"
     },
     "limits": {
       "cpu_ms": 50
     }
   }
   ```

4. **open-next.config.ts**
   - Basic configuration for Cloudflare adapter
   - Ready for additional customization

5. **.gitignore**
   - Added Cloudflare-specific directories

6. **public/_headers**
   - Static asset caching configuration

## Next Steps

1. **Resolve build errors**
   ```bash
   cd ../.. # Go to monorepo root
   yarn contracts build
   cd apps/next
   yarn build
   ```

2. **Test locally**
   ```bash
   yarn preview:cf
   ```

3. **Configure production environment**
   - Set up Cloudflare account and project
   - Configure environment variables in Cloudflare dashboard
   - Update wrangler.jsonc with production settings

4. **Deploy to Cloudflare**
   ```bash
   yarn deploy:cf
   ```

## Important Notes

- Edge runtime is not supported by OpenNext Cloudflare adapter
- Wrangler version must be 3.99.0 or later
- The app uses `nodejs_compat_v2` compatibility flag
- TRPC routes had 90s timeout on Vercel, Cloudflare Workers have different limits
- The app has complex webpack configurations that are preserved

## Resources

- [Cloudflare Next.js Guide](https://developers.cloudflare.com/workers/frameworks/framework-guides/nextjs/)
- [OpenNext Cloudflare Documentation](https://opennext.js.org/cloudflare/get-started)
- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)

## Environment Variables to Configure

Based on the codebase, these environment variables need to be configured in Cloudflare:
- Database/Supabase configuration
- API keys and secrets
- Any variables currently in `../../.env`

## Migration Checklist

- [x] Install dependencies
- [x] Create configuration files
- [x] Update package.json scripts
- [x] Update next.config.js
- [x] Remove Vercel-specific files
- [ ] Fix build errors
- [ ] Test local preview
- [ ] Configure production environment variables
- [ ] Update CI/CD workflows
- [ ] Deploy to Cloudflare
- [ ] Update DNS/routing
- [ ] Monitor performance and errors