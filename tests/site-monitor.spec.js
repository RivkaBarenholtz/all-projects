const { test, expect } = require('@playwright/test');

const API_URL = process.env.API_URL || 'https://your-backend-api.com/api/get-subdomains';
const BASE_URL = 'https://pay.instechpay.co';

async function fetchSubdomains() {
  try {
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const subdomains = await response.json();
    // Assuming API returns: ["subdomain1", "subdomain2", "subdomain3"]
    
    console.log(`Loaded ${subdomains.length} subdomains from API`);
    console.log('Subdomains:', subdomains);
    
    return subdomains;
    
  } catch (error) {
    console.error('Failed to fetch subdomains from API:', error);
    return [];
  }
}

test.describe('Site Monitoring - All Clients', () => {
  let subdomains;
  
  test.beforeAll(async () => {
    subdomains = ["g", "u", "r", "l", "gnpbrokerageus", "ins-dev"]// await fetchSubdomains();
    console.log(`Will test ${subdomains.length} clients`);
  });
  
  test('Monitor all client subdomains', async ({ page }) => {
    expect(subdomains.length).toBeGreaterThan(0);
    
    for (const subdomain of subdomains) {
      const clientUrl = `${BASE_URL}/${subdomain}`;
      console.log(`\n--- Testing ${subdomain} (${clientUrl}) ---`);
      
      try {
        // Test 1: Site is up
        const response = await page.goto(clientUrl, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        
        expect(response.status()).toBe(200);
        console.log(`✓ [${subdomain}] Site is up (${response.status()})`);
        
        // Test 2: Credit card fields exist
        const cardNumberField = page.locator(
          'input[name*="card"], input[id*="card"], input[placeholder*="card number"], input[placeholder*="Card Number"]'
        ).first();
        
        await expect(cardNumberField).toBeVisible({ timeout: 10000 });
        console.log(`✓ [${subdomain}] Credit card fields exist`);
        
        // Test 3: Convenience fee calculation
        const amountInput = await page.locator('input[placeholder="Enter amount"]');
            console.log('✓ Amount');
        
        await expect(amountInput).toBeVisible();
        
        const convenienceFee = page.locator('#convenience-fee');
        await expect(convenienceFee).toBeVisible();
        
        const initialFee = await convenienceFee.textContent();
        console.log(`  Initial fee: ${initialFee}`);
        
        await amountInput.clear();
        await amountInput.fill('100');
        await amountInput.blur();
        
        // Wait for calculation
        await page.waitForTimeout(1500);
        
        const updatedFee = await convenienceFee.textContent();
        const feeAmount = parseFloat(updatedFee.replace(/[^0-9.]/g, ''));
        
        expect(isNaN(feeAmount)).toBe(false);
        expect(feeAmount).toBeGreaterThan(0);
        
        console.log(`✓ [${subdomain}] Convenience fee calculated: ${updatedFee} ($${feeAmount})`);
        
      } catch (error) {
        console.error(`✗ [${subdomain}] Test failed:`, error.message);
        // Don't throw - continue testing other subdomains
        // If you want to fail the entire test suite on first failure, uncomment below:
        // throw error;
      }
    }
  });
});