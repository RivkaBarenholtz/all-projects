

import { chromium } from "playwright";

import { login } from "./login.js";



export async function getClient(event) {

 const page = await login (event.username, event.password , event.databaseName, event.enterpriseid );
// console.log(page);
const a = await page.locator('.main-button', { hasText: 'Locate' });
console.log(a);
await page.waitForTimeout(200); // short UI settle
await a.click();
try {
    await a.click(); 
}
catch (error) {
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
        page: page, 
        lookupCode:event.accountInput ,
        accountName : accountName
    }),
  };
    }

    //body rows 


  return {
    statusCode: 200,
    page: page,
    body: JSON.stringify({ lookupCode:"UNFOUND" ,
        accountName : ""
    }),
  };
};
