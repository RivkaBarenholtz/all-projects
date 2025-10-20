

import { chromium } from "playwright";
import fs from "fs";



export async function handler(event) {

  let browser;

 
      // Running locally on Windows / Mac / Linux
      
      browser = await chromium.launch({

        // headless:false,
        // slowMo:500
          
           // slow motion for debugging
      });
 
     const page = await browser.newPage();
  await page.goto(`https://${event.enterpriseId}.appliedepic.com/#/?program=AccountLocate`, { waitUntil: "domcontentloaded" });

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
           await popup.screenshot({ path: '/tmp/screenshot.png' });

  // save HTML
  const html = await popup.content();
 fs.writeFileSync('/tmp/page.html', html);
      await popup.waitForLoadStat
      await popup.fill("#usercode", "FWIEDER");
      await popup.fill("#password", "Proactovate1!");
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
      console.error("Failed to click the 'Yes' button:", err);
    }

    // Step 1: locate the outer div
const comboContainer = page.locator('div[data-automation-id="cboLocateBy"]');
await comboContainer.click(); // triggers input to appear
// Step 2: locate the input inside that container
const comboInput = comboContainer.locator('input[type="text"]');

 await comboInput.waitFor({ state: 'visible', timeout: 5000 });

    if (event.ByName)
    {
        await comboInput.fill('Account/Business Name');
    }
    else
    {
        await comboInput.fill('Lookup Code');
    }
    
    await page.keyboard.press('Enter');


    const criteriaInput = page.locator('div[data-automation-id="streCriteria1"] input[type="text"]');
    await criteriaInput.waitFor({ state: 'visible', timeout: 5000 });
    await criteriaInput.fill(event.accountInput);

    const locateBtnContainer = page.locator('div[data-automation-id="btnLocate"]');

// Wait until the container is visible
      await locateBtnContainer.waitFor({ state: 'visible', timeout: 5000 });

// Locate the actual button inside
const locateButton = locateBtnContainer.locator('.button.accept');
await page.waitForTimeout(2000); // time is in milliseconds
// Click the button
    await locateButton.click({ force: true }); 

     await page.waitForTimeout(7000); // time is in milliseconds

    const bodyRows = page.locator('[data-automation-id^="vlvwResults body-row"]');
    const rowCount = await bodyRows.count();


    if(rowCount == 1 )
    {
        const firstRow = bodyRows.nth(0); 
        const secondDiv = firstRow.locator('> div').nth(1);

    // Get the text inside the span with class "text"
    const accountName = await secondDiv.locator('span.text').textContent();

    return {
    statusCode: 200,
    body: JSON.stringify({ 
        lookupCode:event.accountInput ,
        accountName : accountName
    }),
  };
    }

  return {
    statusCode: 200,
    body: JSON.stringify({ lookupCode:"Playwright test ran successfully!" ,
        accountName : ""
    }),
  };
};
