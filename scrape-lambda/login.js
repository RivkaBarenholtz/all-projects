import { chromium } from "playwright";
import fs from "fs";

export async function login(
    username,
    password,
    databaseName,
    enterpriseId

) {
    let browser;


    // Running locally on Windows / Mac / Linux

    browser = await chromium.launch({

        headless: false,
        slowMo: 500

        // slow motion for debugging
    });

    const page = await browser.newPage();
    await page.goto(`https://${enterpriseId}.appliedepic.com/#/`, { waitUntil: "domcontentloaded" });

    const context = page.context();
    const firstTextbox = page.getByRole('textbox').first();
    await firstTextbox.fill(enterpriseId);

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
        await popup.fill("#usercode", username);
        await popup.fill("#password", password);
        await popup.getByRole('button', { name: 'Login' }).click();
        // bouskila 
        // tova ovadia 

    } else {
        console.log("No popup or new tab detected");
    }
    try {
        await page.getByRole('button', { name: 'Continue' }).click();
    }
    catch (err) {

    }
    try {
        // Try to click the "Yes" button
        await page.getByRole('button', { name: 'Yes' }).click();

    } catch (err) {
        console.error("Failed to click the 'Yes' button:", err);
    }

    return page;

}