import { chromium } from "playwright";

export async function handler(event) {

  let browser;
 

  if (event.isLocalTest) {
      // Running inside Lambda / Docker
     browser= await chromium.launch({
          headless: false, 
		  slowMo: 500
           // slow motion for debugging
      });
  } else {
      // Running locally on Windows / Mac / Linux
      browser = await chromium.launch({
          
           // slow motion for debugging
      });
  }

  const page = await browser.newPage();
  await page.goto(`https://${event.enterpriseId}.appliedepic.com/#/?program=GeneralLedger`, { waitUntil: "domcontentloaded" });

  const context = page.context();
  const firstTextbox = page.getByRole('textbox').first();
  await firstTextbox.fill(event.enterpriseId);

    const popupPromise = page.waitForEvent('popup').catch(() => null);
    const newPagePromise = context.waitForEvent('page').catch(() => null);

    await page.locator('button.button.accept').click();

    await page.click('button:has-text("Login")');

    // whichever happens first wins
    const popup = await Promise.race([popupPromise, newPagePromise]);

    if (popup) {
      await popup.waitForLoadState('load');
      await popup.fill("#usercode", event.userName);
      await popup.fill("#password", event.password );
      await popup.getByRole('button', { name: 'Login' }).click();
      // bouskila 
      // tova ovadia 

    } else {
       console.log("No popup or new tab detected");
    }
    await page.getByRole('button', { name: 'Continue' }).click();
    try {
    // Try to click the "Yes" button
         await page.getByRole('button', { name: 'Yes' }).click();
    
    } catch (err) {
      console.error("Failed to click the 'Yes' button:");
    }

    const receiptsButton = page.getByText('Receipts', { exact: true });
    await receiptsButton.first().waitFor({ state: 'visible', timeout: 5000 });
    const count = await receiptsButton.count();

    if (count === 0) {
      throw new Error("No 'Receipts' elements found");
    } else if (count === 1) {
      await receiptsButton.click();
      console.log("Clicked the only Receipts element");
    } else {
      await receiptsButton.nth(0).click(); // use the first one
      console.log("Multiple Receipts elements found, clicked the first one");
    }
    await page.locator('div.icon-button[title="Add"]').click();
    await page.locator('div[data-test="bankAccount-dropdown-icon"]').click();
    const row = page.locator('div[data-test="dropdown-row"]', { hasText: event.bankAccountNumber });
    await row.waitFor({ state: 'visible', timeout: 5000 }); // ensure it’s visible
    await row.dblclick();
    await page.fill("#description", event.description);
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

    const comboInput = page.locator('input#accountingMonth');

    await comboInput.fill(currentMonth);

    await page.keyboard.press('Enter');

      
    const currentYear = new Date().getFullYear().toString();

    const yearInput = page.locator('input#accountingYear');

    await yearInput.fill(currentYear);

    await page.keyboard.press('Enter');
   
    await page.evaluate(() => {
      const btn = document.querySelector('button[data-test="btnContinue"]');
      if (btn) {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      }
    });
    const container = await page.locator('div[data-automation-id="streTypeLookup"]');

    // Find the input inside the container
    const accountinput = await container.locator('input.required');
    await accountinput.fill(event.accountLookupCode);


    const comboBox = await page.locator('div[data-automation-id="cboMethod"]');

    const pmntMethodInput = await  comboBox.locator('input[type="text"]');

  // Wait until the input is visible
  await pmntMethodInput.waitFor({ state: 'visible', timeout: 5000 });

  // Fill in the text you want
 await pmntMethodInput.fill(event.paymentMethod); 

  const descriptionInput = page.locator('div[data-automation-id="streDescription"] input');

// Wait for it to be visible
await descriptionInput.waitFor({ state: 'visible', timeout: 5000 });

// Fill in the value
await descriptionInput.fill(event.detailDescription);
        

const currencyInput = await  page.locator('div.currency-edit input[type="text"]');
  await currencyInput.fill(event.amount);

  if (event.isDebit )
  {
	const debitContainer = page.locator('[data-automation-id="rbtnDebit"]');
	await debitContainer.locator('input[type="radio"]').click();
  }

 
  await page.fill('asi-combo-box input.required', 'Account');
  await page.keyboard.press('Enter');
  // await page.waitForTimeout(5000);
  //  const finishDiv = page.locator('div[data-automation-id="btnFinish"]');

  // // Find the <button> inside and click it
  // const finishButton = finishDiv.locator('button');
  // await finishButton.waitFor({ state: 'visible', timeout: 5000 });
  // await finishButton.click();

  return {
    statusCode: 200,
    body: JSON.stringify({ title:"Playwright test ran successfully!" }),
  };
};
