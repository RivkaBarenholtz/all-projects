import { test, expect } from '@playwright/test';

test.describe('eCheck Transaction Flow', () => {
  test('should process eCheck payment successfully', async ({ page }) => {
    const randomAmount = (Math.random() * 100 + 1).toFixed(2);
    const testData = {
      accountId: 'secofid-01',
      amount: randomAmount,
      accountType: 'Checking',
      accountHolderName: 'Test Account',
      accountNumber: '999999999',
      routingNumber: '021000021',
    };

    console.log(`Testing with amount: $${testData.amount}`);

    await page.goto('https://pay.instechpay.co/ins-dev');
    await page.waitForLoadState('networkidle');

    // Click eCheck tab
    await page.click('text=eCheck');
    await page.waitForTimeout(3000); // Wait for iframes to fully load

    // Fill Account ID
    const inputs = page.locator('input[type="text"]');
    await inputs.nth(0).fill(testData.accountId);
    console.log('✓ Filled Account ID');
    
    // Fill Amount
    await page.locator('input[placeholder="Enter amount"]').fill(testData.amount);
    console.log('✓ Filled Amount');
    
    // Select account type
    await page.locator('select').selectOption(testData.accountType);
    console.log('✓ Selected account type');
    
    // Wait for Cardknox iframe to be ready
    await page.waitForTimeout(2000);
    
    // Fill Account Holder Name
    await page.locator('input[name="account-name"]').fill(testData.accountHolderName);
    console.log('✓ Filled Account Holder Name');
    
    // Fill Account Number in Cardknox iFrame
    // Method 1: Try using frameLocator
    try {
      const cardknoxFrame = page.frameLocator('iframe[src*="cardknox.com/ifields"]');
      const accountInput = cardknoxFrame.locator('input#xAccountNumber, input[name="xAccountNumber"], input').first();
      await accountInput.waitFor({ state: 'visible', timeout: 5000 });
      await accountInput.fill(testData.accountNumber);
      console.log('✓ Filled Account Number (Cardknox iFrame)');
    } catch (error) {
      console.log('Method 1 failed, trying Method 2...');
      
      // Method 2: Access frame directly
      try {
        const frames = page.frames();
        const cardknoxFrame = frames.find(f => f.url().includes('cardknox.com/ifields'));
        
        if (cardknoxFrame) {
          // Wait for input to be available
          await cardknoxFrame.waitForSelector('input', { timeout: 5000 });
          
          // Try different selectors
          const selectors = [
            'input#xAccountNumber',
            'input[name="xAccountNumber"]',
            'input[type="text"]',
            'input[type="tel"]',
            'input'
          ];
          
          let filled = false;
          for (const selector of selectors) {
            try {
              const input = cardknoxFrame.locator(selector);
              const count = await input.count();
              if (count > 0) {
                await input.first().fill(testData.accountNumber);
                console.log(`✓ Filled Account Number using selector: ${selector}`);
                filled = true;
                break;
              }
            } catch (e) {
              // Try next selector
            }
          }
          
          if (!filled) {
            console.log('⚠️  Could not fill Account Number - manual entry may be required');
          }
        }
      } catch (error2) {
        console.log('⚠️  Account Number field error:', error2.message);
        console.log('You may need to fill this manually during the pause');
      }
    }
    
    // Fill Routing Number
    await page.locator('input[name="routing-number"]').fill(testData.routingNumber);
    console.log('✓ Filled Routing Number');

    await page.screenshot({ path: 'debug-before-submit.png', fullPage: true });
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Check ACH agreement checkbox
    await page.locator('input[name="ach-agree"]').check();
    console.log('✓ Checked ACH agreement');
    
    // PAUSE here to manually:
    // 1. Fill Account Number if it didn't work
    // 2. Solve reCAPTCHA
    console.log('\n⏸️  PAUSED - Please:');
    console.log('   1. Check if Account Number is filled (fill manually if not)');
    console.log('   2. Solve the reCAPTCHA');
    console.log('   3. Click Resume in Playwright Inspector\n');
    
    await page.pause();

    // Click Process Payment
    await page.locator('button:has-text("Process Payment")').click();
    console.log('✓ Clicked Process Payment');

    // Wait for thank you page
    await page.waitForURL('**/thank-you', { timeout: 15000 });
    
    expect(page.url()).toContain('thank-you');
    console.log('✅ Payment submitted successfully');
    console.log(`Transaction - Account: ${testData.accountId}, Amount: $${testData.amount}`);
  });
});