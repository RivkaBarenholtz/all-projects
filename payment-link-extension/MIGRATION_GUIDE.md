# Migration Guide: Vanilla JS to React

This document explains how your original vanilla JavaScript Chrome extension was converted to React.

## Architecture Changes

### Before (Vanilla JS)
- All code in a single `content.js` file (~1000+ lines)
- Global variables for state management
- Direct DOM manipulation with `document.createElement()`, `innerHTML`
- Shadow DOM for style isolation
- Event listeners attached manually

### After (React)
- Modular component-based architecture
- React hooks for state management
- Declarative JSX for UI
- Standard CSS with scoping
- React's built-in event handling

## File Structure Comparison

### Original Structure
```
extension/
├── content.js (all code)
├── styles/fonts.css
├── fonts/
└── manifest.json
```

### New Structure
```
payment-link-extension/
├── src/
│   ├── components/        # React components
│   ├── utils/            # Helper functions
│   ├── types.ts          # TypeScript types
│   ├── content.tsx       # Entry point
│   └── styles.css        # Styles
├── public/
│   └── manifest.json
└── package.json
```

## Code Migration Examples

### Example 1: Modal Creation

**Before (Vanilla JS):**
```javascript
async function CreateModal() {
    const modal = document.createElement('div');
    modal.id = 'customModalOverlay';
    document.body.appendChild(modal);
    
    const shadow = modal.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
        <div class="modal-panel">
            <h4 id="modalTitle">Generate link</h4>
            <button id="closeBtn">Close</button>
        </div>
    `;
    
    shadow.getElementById('closeBtn').addEventListener('click', () => {
        modal.style.display = 'none';
    });
}
```

**After (React):**
```tsx
interface PaymentModalProps {
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose }) => {
  return (
    <div className="modal-panel">
      <h4>Generate link</h4>
      <button onClick={onClose}>Close</button>
    </div>
  );
};
```

### Example 2: State Management

**Before (Vanilla JS):**
```javascript
globalThis.invoiceData = [];
globalThis.Surcharge = 0;
globalThis.SelectedInvoices = new Set();

function updateInvoices(newData) {
    globalThis.invoiceData = newData;
    // Manually update DOM
    const tbody = document.querySelector("#invoiceTable tbody");
    tbody.innerHTML = '';
    // ... render logic
}
```

**After (React):**
```tsx
export const PaymentModal: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [surcharge, setSurcharge] = useState<number>(0);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

  const updateInvoices = (newData: Invoice[]) => {
    setInvoices(newData);
    // React automatically re-renders
  };
  
  return <InvoiceList invoices={invoices} />;
};
```

### Example 3: API Calls

**Before (Vanilla JS):**
```javascript
async function getSurcharge() {
    const response = await fetch(`https://${globalThis.subdomain}.instechpay.co/pay/get-surcharge`, {
        method: 'POST',
        body: JSON.stringify({ ClientLookupCode: clientLookupCode }),
        headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();
    globalThis.Surcharge = result.surcharge;
}
```

**After (React + Service Class):**
```typescript
export class ApiService {
  async getSurcharge(clientLookupCode: string): Promise<{ surcharge: number; vendorSurcharge: number }> {
    const url = `https://${this.subdomain}.instechpay.co/pay/get-surcharge`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ ClientLookupCode: clientLookupCode }),
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  }
}

// In component:
const apiService = new ApiService(subdomain);
const { surcharge } = await apiService.getSurcharge(lookupCode);
setSurcharge(surcharge);
```

### Example 4: Event Handling

**Before (Vanilla JS):**
```javascript
shadow.getElementById('saveBtn').addEventListener('click', async () => {
    const value = shadow.getElementById('input').value;
    await save([{ SurchargeAmount: value }]);
});
```

**After (React):**
```tsx
const [value, setValue] = useState('');

const handleSave = async () => {
  await save([{ SurchargeAmount: value }]);
};

return (
  <>
    <input value={value} onChange={(e) => setValue(e.target.value)} />
    <button onClick={handleSave}>Save</button>
  </>
);
```

### Example 5: Conditional Rendering

**Before (Vanilla JS):**
```javascript
if (isEditing) {
    td.innerHTML = `
        <input type="number" value="${value}">
        <button class="btn-save">Save</button>
    `;
} else {
    td.innerHTML = `
        <span>${value}%</span>
        <button class="btn-edit">Edit</button>
    `;
}

// Add listeners
td.querySelector('.btn-save')?.addEventListener('click', handleSave);
td.querySelector('.btn-edit')?.addEventListener('click', () => setIsEditing(true));
```

**After (React):**
```tsx
const [isEditing, setIsEditing] = useState(false);

return (
  <td>
    {isEditing ? (
      <>
        <input type="number" value={value} onChange={e => setValue(e.target.value)} />
        <button onClick={handleSave}>Save</button>
      </>
    ) : (
      <>
        <span>{value}%</span>
        <button onClick={() => setIsEditing(true)}>Edit</button>
      </>
    )}
  </td>
);
```

## Benefits of React Migration

### 1. **Better Code Organization**
- Components are self-contained and reusable
- Clear separation of concerns
- Easier to test individual components

### 2. **Type Safety**
- TypeScript catches errors at compile time
- Better IDE autocomplete and documentation
- Reduced runtime errors

### 3. **Declarative UI**
- UI state is automatically synchronized
- No manual DOM manipulation
- Easier to reason about UI state

### 4. **Performance**
- React's virtual DOM efficiently updates only what changed
- Better memory management
- No manual cleanup of event listeners needed

### 5. **Developer Experience**
- Hot module replacement during development
- Better debugging with React DevTools
- Large ecosystem of tools and libraries

### 6. **Maintainability**
- Smaller, focused files
- Consistent patterns across codebase
- Easier onboarding for new developers

## Shadow DOM Removal

The original code used Shadow DOM for style isolation. This is no longer necessary because:

1. **Chrome Extension Context**: Content scripts already have style isolation
2. **CSS Scoping**: Modern CSS-in-JS or CSS modules provide scoping
3. **React Portal**: Can render into isolated DOM nodes if needed
4. **Simpler Debugging**: Regular DOM is easier to inspect and debug

## Common Patterns

### Loading States
**Before:**
```javascript
shadow.getElementById("loader").style.display = "block";
await loadData();
shadow.getElementById("loader").style.display = "none";
```

**After:**
```tsx
const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  await fetchData();
  setLoading(false);
};

return loading ? <Spinner /> : <Content />;
```

### Lists and Maps
**Before:**
```javascript
invoiceData.forEach((item) => {
  const row = document.createElement("tr");
  row.innerHTML = `<td>${item.InvoiceNumber}</td>`;
  tbody.appendChild(row);
});
```

**After:**
```tsx
return (
  <tbody>
    {invoices.map((item) => (
      <tr key={item.id}>
        <td>{item.InvoiceNumber}</td>
      </tr>
    ))}
  </tbody>
);
```

## Testing the Migration

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Load in Chrome:**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked from `dist/` folder

3. **Test all functionality:**
   - [ ] Modal opens and closes
   - [ ] Client information loads
   - [ ] Invoice list displays
   - [ ] Surcharge editing works
   - [ ] Payment link generation
   - [ ] Email functionality
   - [ ] Settings panel
   - [ ] All buttons and interactions

## Troubleshooting

### Issue: Styles not loading
**Solution:** Ensure CSS is imported in content.tsx and Vite is configured to handle CSS.

### Issue: API calls failing
**Solution:** Check CORS settings and ensure host_permissions are correct in manifest.json.

### Issue: Components not re-rendering
**Solution:** Make sure you're using state setters (setState) not mutating state directly.

### Issue: TypeScript errors
**Solution:** Check type definitions in types.ts and ensure all props are properly typed.

## Next Steps

1. Add unit tests with Jest and React Testing Library
2. Add E2E tests with Playwright
3. Implement error boundaries for better error handling
4. Add logging and analytics
5. Optimize bundle size with code splitting

## Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Vite Documentation](https://vitejs.dev/)
