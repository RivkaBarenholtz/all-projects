# Quick Start Guide

## Installation & Setup

### 1. Install Dependencies
```bash
cd payment-link-extension
npm install
```

### 2. Development Build
```bash
npm run dev
```
This starts Vite in watch mode. Changes will rebuild automatically.

### 3. Production Build
```bash
npm run build
```
Creates optimized build in `dist/` folder.

### 4. Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `dist/` folder from this project

### 5. Test the Extension

1. Navigate to your Epic system URL
2. Look for the "Generate Payment Link" button in the top right
3. Or find "Payment Link" in the sidebar
4. Click to open the modal

## Project Overview

### Key Files

- **`src/content.tsx`** - Entry point, injects the button and modal
- **`src/components/PaymentModal.tsx`** - Main modal component
- **`src/utils/api.ts`** - API service for backend calls
- **`src/types.ts`** - TypeScript type definitions
- **`public/manifest.json`** - Chrome extension configuration

### Key Components

1. **PaymentModal** - Root component managing all state
2. **ClientInfo** - Custom payment link generator
3. **InvoiceList** - Table of open invoices
4. **InvoiceRow** - Individual invoice with editing
5. **SettingsPanel** - Account surcharge settings
6. **UpdateOptionsModal** - Confirmation dialog for bulk updates

## Making Changes

### Add a New Feature

1. Create component in `src/components/`
2. Import and use in parent component
3. Add types to `src/types.ts` if needed
4. Rebuild with `npm run build`

### Modify Styles

1. Edit `src/styles.css`
2. Rebuild

### Update API Endpoints

1. Modify `src/utils/api.ts`
2. Update types if response format changes

## Common Tasks

### Change Subdomain Logic
Edit the `getSubdomain()` function in `src/utils/api.ts`

### Add New API Method
Add method to `ApiService` class in `src/utils/api.ts`

### Modify Modal Behavior
Edit `src/components/PaymentModal.tsx`

### Change Button Position
Edit the `injectButton()` function in `src/content.tsx`

## Debugging

### Enable React DevTools
1. Install [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
2. Open Chrome DevTools
3. Select "Components" tab to inspect React tree

### Check Console
- Open DevTools Console (F12)
- Look for errors or warnings
- Use `console.log()` in components for debugging

### Network Issues
- Check Network tab in DevTools
- Verify API endpoints are correct
- Check CORS configuration

## Distribution

### Create Production Build
```bash
npm run build
```

### Package Extension
1. Build the project
2. Zip the `dist/` folder
3. Upload to Chrome Web Store or distribute internally

## Need Help?

- Check `MIGRATION_GUIDE.md` for detailed explanations
- Review `README.md` for architecture details
- Check Chrome Extension docs: https://developer.chrome.com/docs/extensions/
- React docs: https://react.dev/

## Troubleshooting

**Build fails:**
- Delete `node_modules/` and run `npm install` again
- Check Node version (need 16+)

**Extension doesn't load:**
- Make sure you built with `npm run build`
- Check manifest.json for errors
- Look at Chrome's extension error messages

**Styles don't apply:**
- Verify CSS import in content.tsx
- Check if CSS file is in dist/ after build
- Clear Chrome cache and reload extension

**API calls fail:**
- Check manifest.json permissions
- Verify subdomain logic
- Check network tab for CORS errors
