import { test, expect } from '@playwright/test';

test.describe('Credit Card Transaction Flow', () => {
  test('should process credit card payment successfully', async ({ page }) => {
    const randomAmount = (Math.random() * 100 + 1).toFixed(2);
    const testData = {
      accountId: 'secofid-01',
      amount: randomAmount,
      
      // Billing Information
      cardholderName: 'Test User',
      billingAddress: '123 Test St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      phone: '5551234567',
      email: 'test@example.com',
      
      // Card Information
      cardNumber: '4111111111111111', // Visa test card
      expiryMonth: '12', // MM
      expiryYear: '2030',  // YY (or '2025' if full year)
      cvv: '123',
    };

    console.log(`\n💳 Testing credit card payment with amount: $${testData.amount}\n`);

    await page.goto('https://test.instechpay.co/pay');
    await page.waitForLoadState('networkidle');

    // Click Credit Card tab
    await page.click('text=Credit Card');
    await page.waitForTimeout(3000);

    // Fill Account ID
    const inputs = page.locator('input[type="text"]');
    await inputs.nth(0).fill(testData.accountId);
    console.log('✓ Account ID');
    
    // Fill Amount
    await page.locator('input[placeholder="$0.00"]').fill(testData.amount);
    console.log('✓ Amount');

    // Fill Billing Information
    await page.locator('input[name="cardholder-name"]').fill(testData.cardholderName);
    console.log('✓ Cardholder Name');
    
    await page.locator('input[name="address"]').fill(testData.billingAddress);
    console.log('✓ Billing Address');
    
    await page.locator('input[name="city"]').fill(testData.city);
    console.log('✓ City');
    
    // State - React-Select dropdown
    // Click the dropdown to open it
    await page.locator('.css-1akrsx3-control').first().click();
    await page.waitForTimeout(500);
    // Type the state abbreviation or click the option
    await page.keyboard.type(testData.state);
    await page.keyboard.press('Enter');
    console.log('✓ State');
    
    await page.locator('input[name="zip"]').fill(testData.zipCode);
    console.log('✓ ZIP Code');
    
    await page.locator('input[name="phone"]').fill(testData.phone);
    console.log('✓ Phone');
    
    await page.locator('input[name="email"]').fill(testData.email);
    console.log('✓ Email');

    // Card Information
    await page.waitForTimeout(2000);

    // Get Cardknox iframes
    const frames = page.frames();
    const cardknoxFrames = frames.filter(f => f.url().includes('cardknox.com/ifields'));
    console.log(`Found ${cardknoxFrames.length} Cardknox iframes`);

    // Card Number (First Cardknox iframe)
    try {
      if (cardknoxFrames.length > 0) {
        await cardknoxFrames[0].waitForSelector('input', { timeout: 5000 });
        await cardknoxFrames[0].locator('input').first().fill(testData.cardNumber);
        console.log('✓ Card Number');
      }
    } catch (error) {
      console.log('⚠️  Card Number - needs manual entry');
    }

    // Expiry Month (MM) - React-Select
    try {
      // Find the MM input by id
      const mmInput = page.locator('input#month');
      await mmInput.click();
      await page.waitForTimeout(300);
      await mmInput.fill(testData.expiryMonth);
      await page.keyboard.press('Enter');
      console.log('✓ Expiry Month (MM)');
    } catch (error) {
      console.log('⚠️  Expiry Month - trying alternative method');
      try {
        // Alternative: find by the react-select container
        const monthContainers = page.locator('.css-b62m3t-container');
        await monthContainers.first().click();
        await page.waitForTimeout(300);
        await page.keyboard.type(testData.expiryMonth);
        await page.keyboard.press('Enter');
        console.log('✓ Expiry Month (alternative)');
      } catch (e) {
        console.log('⚠️  Expiry Month - needs manual entry');
      }
    }

    // Expiry Year (YY) - React-Select
    try {
      // Find the YY input (should have a different id, maybe 'year')
      const yyInput = page.locator('input#year');
      await yyInput.click();
      await page.waitForTimeout(300);
      await yyInput.fill(testData.expiryYear);
      await page.keyboard.press('Enter');
      console.log('✓ Expiry Year (YY)');
    } catch (error) {
      console.log('⚠️  Expiry Year - trying alternative method');
      try {
        // Alternative: find the second react-select container
        const yearContainers = page.locator('.css-b62m3t-container');
        const count = await yearContainers.count();
        if (count > 1) {
          await yearContainers.nth(1).click();
          await page.waitForTimeout(300);
          await page.keyboard.type(testData.expiryYear);
          await page.keyboard.press('Enter');
          console.log('✓ Expiry Year (alternative)');
        }
      } catch (e) {
        console.log('⚠️  Expiry Year - needs manual entry');
      }
    }


      // Try as Cardknox iframe
      try {
        if (cardknoxFrames.length > 1) {
          await cardknoxFrames[1].waitForSelector('input', { timeout: 5000 });
          await cardknoxFrames[1].locator('input').first().fill(testData.cvv);
          console.log('✓ CVV (iframe)');
        }
      } catch (e) {
        console.log('⚠️  CVV - needs manual entry');
      }
    
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Click Process Payment
    await page.locator('button:has-text("Process Payment")').click();
    console.log('✓ Clicked Process Payment');

    // Wait for thank you page
    await page.waitForURL(url => url.href.includes('thank-you'), { timeout: 15000 });
    
    expect(page.url()).toContain('thank-you');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CREDIT CARD PAYMENT SUCCESSFUL');
    console.log('='.repeat(60));
    console.log(`Account: ${testData.accountId}`);
    console.log(`Amount: $${testData.amount}`);
    console.log(`Card: **** **** **** ${testData.cardNumber.slice(-4)}`);
    console.log('='.repeat(60) + '\n');
  });
});