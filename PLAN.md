# Project Plan

## Current Status
*Last Updated: June 2, 2026*

## Active Plans

### 1. Layout Selection for Plugins
- **Objective**: Allow plugins to specify which layout they want to use (Admin vs Portal)
- **Status**: Implementation complete
- **Assigned**: 
- **Depends on**: 

**Changes Made**:
1. ✅ Added `layout?: PluginLayout` property to `FeaturePlugin` interface in `/home/moacir/dev/massasco/libs/core/plugin-loader/src/lib/plugin-loader.ts`
2. ✅ Created `PluginLayout` type (`'portal' | 'admin'`) in the same file
3. ✅ Modified `/plugins/[...slug]/page.tsx` to read and store the plugin's layout property
4. ⏳ Documentation update: Plugin authors can now specify `layout: 'admin'` or `layout: 'portal'` in their plugin definition

**Notes**:
- The `layout` property is currently stored as metadata on the plugin
- The actual routing is determined by the URL path:
  - `/admin/*` routes use the admin layout
  - `/plugins/*` routes use the portal layout
- Plugins can use the `layout` property to adjust their rendering behavior

## Completed

- [2026-06-02] - Created PLAN.md for tracking
- [2026-06-02] - Added `layout` property to `FeaturePlugin` interface
- [2026-06-02] - Created `PluginLayout` type definition
- [2026-06-02] - Modified plugin page to read layout property

## Blocked

- 

## Notes

### Current Layout Architecture:
- **Admin Layout** (`/admin/*`): Uses `app:main-template` extension point
- **Portal Layout** (default `/plugins/*`): Uses `plugin-main-template` component

### Current Implementation:
- `MainTemplate` component handles routing (excludes `/plugins/login` from layout)
- Layout structure: Header → Content (with sidebars) → Footer + BottomNavBar (mobile)

### Required Changes:
1. Add `layout` property to plugin definition (type: `'admin' | 'portal'`)
2. Modify plugin registration to support layout selection
3. Implement routing logic to use appropriate layout based on plugin's requested layout
