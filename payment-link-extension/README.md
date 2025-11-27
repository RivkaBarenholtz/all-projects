# Payment Link Generator - React Chrome Extension

A Chrome extension built with React for generating payment links for clients and invoices in the Epic system.

## Project Structure

```
payment-link-extension/
├── public/
│   └── manifest.json          # Chrome extension manifest
├── src/
│   ├── components/
│   │   ├── PaymentModal.tsx   # Main modal component
│   │   ├── ClientInfo.tsx     # Custom payment link section
│   │   ├── InvoiceList.tsx    # Invoice listing component
│   │   ├── InvoiceRow.tsx     # Individual invoice row
│   │   ├── SettingsPanel.tsx  # Account settings panel
│   │   └── UpdateOptionsModal.tsx  # Surcharge update options
│   ├── utils/
│   │   ├── api.ts             # API service and helper functions
│   │   └── helpers.ts         # Utility helper functions
│   ├── types.ts               # TypeScript type definitions
│   └── content.tsx            # Content script entry point
├── package.json
├── vite.config.js
└── README.md
```

## Features

- ✅ Generate custom payment links with specific amounts
- ✅ Manage invoice surcharges
- ✅ Copy payment links for single or multiple invoices
- ✅ Email payment reminders
- ✅ Edit account-level surcharge settings
- ✅ Toggle partial payment options per invoice
- ✅ React-based UI with Shadow DOM isolation

## Setup

### Prerequisites

- Node.js 16+ and npm
- Chrome browser

### Installation

1. **Install dependencies:**
   ```bash
   cd payment-link-extension
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Development

### Build for Development

```bash
npm run dev
```

This watches for file changes and rebuilds automatically.

### Build for Production

```bash
npm run build
```

The built extension will be in the `dist` folder.

## Key Components

### PaymentModal
Main modal component that orchestrates all functionality. Manages state for client data, invoices, surcharges, and selections.

### ClientInfo
Allows users to generate custom payment links with specific dollar amounts.

### InvoiceList
Displays all open invoices with ability to select multiple invoices for bulk operations.

### InvoiceRow
Individual invoice row with editable surcharge and partial payment toggle.

### SettingsPanel
Account-level settings for managing default surcharge rates.

### UpdateOptionsModal
Modal for choosing whether to apply surcharge changes to future invoices only or all open invoices.

## API Integration

The extension integrates with the following endpoints:

- `GET /pay/get-client-from-epic` - Fetch client information
- `POST /pay/get-open-invoices` - Fetch open invoices for a client
- `POST /pay/get-surcharge` - Get current surcharge settings
- `POST /pay/save-surcharge` - Save surcharge changes
- `GET /pay/get-subdomain` - Get the appropriate subdomain

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Any Chromium-based browser

## Migration Notes from Original Code

### Key Changes:

1. **React Components**: Converted from vanilla JS DOM manipulation to React components
2. **State Management**: Uses React hooks (useState, useEffect) instead of global variables
3. **Shadow DOM**: Removed Shadow DOM implementation (not needed with proper CSS scoping in React)
4. **Event Handlers**: Converted from addEventListener to React event props
5. **Type Safety**: Added TypeScript for better type checking and IDE support
6. **API Service**: Centralized all API calls into a service class
7. **Utilities**: Separated helper functions into dedicated utility files

### What Was Preserved:

- All original functionality
- API endpoint integration
- Business logic for surcharge calculation
- User workflows and interactions
- Modal behavior and structure

## Troubleshooting

### Extension not loading
- Make sure you built the extension with `npm run build`
- Check the console for any build errors
- Verify all files are in the `dist` folder

### API requests failing
- Check network configuration in the manifest
- Verify the subdomain is being fetched correctly
- Check Chrome DevTools Network tab for request details

### Styles not applying
- Ensure CSS files are being copied to the dist folder
- Check that Font Awesome fonts are accessible
- Verify CSS custom properties are defined

## License

Internal use only.
