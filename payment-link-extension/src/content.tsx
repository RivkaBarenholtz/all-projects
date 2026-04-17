import React from 'react';
import ReactDOM from 'react-dom/client';
import { MainPage } from './components/MainPage';
import { getAccountLookupCode } from './utils/api';

import './styles.css';




let modalRoot: ReactDOM.Root | null = null;
let subdomain: string = '';
// 1️⃣ The selector of the button you want to watch
const TARGET_SELECTOR = 'a.sidebar-button[data-automation-id^="sidebar-button"]';


function isClickable(el: HTMLElement) {
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.pointerEvents !== 'none' &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    !el.hasAttribute('disabled')
  );
}


function hasText(el: HTMLElement, text: string) {
  return el.textContent?.trim() === text;
}

function onDomReady(callback: () => void) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  } else {
    callback();
  }
}

onDomReady(() => {
  // Create the observer
  const observer = new MutationObserver(() => {
    const el = document.querySelector<HTMLElement>(TARGET_SELECTOR);
    if (el && isClickable(el) && hasText(el, 'Account Detail')) {
      injectButton(el);
      observer.disconnect(); // stop observing once done
    }
  });

  // Determine a safe observe target
  const target = document.body || document.documentElement;
  if (!target) return;

  // Start observing
  observer.observe(target, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });

  // Immediate check in case element already exists
  const el = document.querySelector<HTMLElement>(TARGET_SELECTOR);
  if (el && isClickable(el) && hasText(el, 'Account Detail')) {
    injectButton(el);
    observer.disconnect();
  }
});
async function waitForDOM(): Promise<void> {
  if (document.body && document.head) return;

  await new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (document.body && document.head) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
}
async function getSubdomain(): Promise<string> {

  const isDevelop = await isDeveloperMode();

  // if (isDevelop) {
  //   return 'ins-dev';
  // }

  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const epicSubdomain = parts.length > 2 ? parts[0] : null;
  const lookupCode = getAccountLookupCode();

  const response = await fetch(
    `https://ins-dev.instechpay.co/pay/get-subdomain?subdomain=${epicSubdomain}&accountid=${lookupCode}`
  );

  return await response.text();
}

function addCustomSidebarButton() {
  if (document.querySelector('.sidebar-button.my-custom')) return;

  const sidebar = document.querySelector('.links');
  if (!sidebar) {
    setTimeout(addCustomSidebarButton, 1000);
    return;
  }

  const existingButton = sidebar.querySelector('sidebar-button');
  if (!existingButton) {
    setTimeout(addCustomSidebarButton, 1000);
    return;
  }

  const newButton = existingButton.cloneNode(true) as HTMLElement;

  const textSpan = newButton.querySelector('.text');
  if (textSpan) textSpan.textContent = 'Payment Link';

  const icon = newButton.querySelector('i');
  if (icon) icon.className = 'icon-Transactions';

  newButton.classList.remove('selected');
  newButton.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));

  const anchor = newButton.querySelector('a.sidebar-button');
  if (anchor) {
    anchor.classList.add('my-custom');
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      showModal();
    });
  }

  const spacer = sidebar.querySelector('.spacer');
  if (spacer) {
    sidebar.insertBefore(newButton, spacer);
  } else {
    sidebar.appendChild(newButton);
  }
}

// content.js
const isDeveloperMode = (): boolean => {
  const manifest = chrome.runtime.getManifest();
  // Developer mode extensions don't have update_url
  return !manifest.update_url;
};

async function injectButton(targetParent: HTMLElement) {
  addCustomSidebarButton();



}

async function CreateModal() {
  const modal = document.createElement('div');
  modal.id = 'customModalOverlay';
  // const htmlFontSize = getComputedStyle(document.documentElement).fontSize;
  // modal.style.fontSize = htmlFontSize;

  document.body.appendChild(modal);

  const shadow = modal.attachShadow({ mode: 'open' });


  const cssUrl = chrome.runtime.getURL('styles/fonts.css');
  const response = await fetch(cssUrl);
  const cssText = await response.text();

  const style = document.createElement('style');
  style.textContent = cssText;
  shadow.appendChild(style);

  const fontAwesomeCssUrl = chrome.runtime.getURL('styles/all.min.css');
  const fontAwesomeCssResponse = await fetch(fontAwesomeCssUrl);
  const fontAwesomeCssText = await fontAwesomeCssResponse.text();

  const fontAwesomeStyle = document.createElement('style');
  fontAwesomeStyle.textContent = fontAwesomeCssText;
  shadow.appendChild(fontAwesomeStyle);

  modal.style.cssText = `
          position: fixed;
          top: 0; left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

  return shadow;
}


async function showModal() {



  //  let externalFieldRoot = null;
  //   const fieldContainer = document.createElement("div");
  //   fieldContainer.id = "external-overlay-field";

  //   document.body.appendChild(fieldContainer);

  //   externalFieldRoot = ReactDOM.createRoot(fieldContainer);

  //   externalFieldRoot.render(
  //     <CardknoxField ifieldType={CARD_TYPE} ifieldsKey='aaa' />
  //   );

  if (!subdomain) {
    subdomain = await getSubdomain();
  }

  const shadow = await CreateModal()


  if (!document.getElementById('font-style')) {

    const style = document.createElement('style');
    style.id = 'font-style';
    style.textContent = `
        @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url('${chrome.runtime.getURL('fonts/inter-v18-latin-regular.woff2')}') format('woff2');
        }

        * {
            font-family: 'Inter';
        }

        @font-face {
            font-family: "Font Awesome 6 Free";
            font-display: block;
            font-weight: 400;
            src: url('${chrome.runtime.getURL('/webfonts/fa-brands-400.woff2')}') format("woff2"),
                url(${chrome.runtime.getURL("webfonts/fa-solid-400.ttf")}) format("truetype");
            }
        }

        @font-face {
            font-family: "Font Awesome 6 Free";
            font-display: block;
            font-weight: 900;
            src: url(${chrome.runtime.getURL("webfonts/fa-solid-900.woff2")}) format("woff2"),
                url(${chrome.runtime.getURL("webfonts/fa-solid-900.ttf")}) format("truetype");
            }

            @font-face {
            font-family: "Font Awesome 6 Free";
            font-display: block;
            font-weight: 400;
            src: url(${chrome.runtime.getURL("webfonts/fa-regular-400.woff2")}) format("woff2"),
                url(${chrome.runtime.getURL("webfonts/fa-regular-400.ttf")}) format("truetype");
            }

            @font-face {
            font-family: "Font Awesome 6 Free";
            font-display: block;
            src: url(${chrome.runtime.getURL("webfonts/fa-solid-900.woff2")}) format("woff2"),
                url(${chrome.runtime.getURL("webfonts/fa-solid-900.ttf")}) format("truetype");
            }

            @font-face {
            font-family: "Font Awesome 6 Free";
            font-display: block;
            src: url(${chrome.runtime.getURL("webfonts/fa-brands-400.woff2")}) format("woff2"),
                url(${chrome.runtime.getURL("webfonts/fa-brands-400.ttf")}) format("truetype");
            }

            @font-face {
            font-family: "Font Awesome 6 Free";
            font-display: block;
            src: url(${chrome.runtime.getURL("webfonts/fa-regular-400.woff2")}) format("woff2"),
                url(${chrome.runtime.getURL("webfonts/fa-regular-400.ttf")}) format("truetype");
            unicode-range: u+f003,u+f006,u+f014,u+f016-f017,u+f01a-f01b,u+f01d,u+f022,u+f03e,u+f044,u+f046,u+f05c-f05d,u+f06e,u+f070,u+f087-f088,u+f08a,u+f094,u+f096-f097,u+f09d,u+f0a0,u+f0a2,u+f0a4-f0a7,u+f0c5,u+f0c7,u+f0e5-f0e6,u+f0eb,u+f0f6-f0f8,u+f10c,u+f114-f115,u+f118-f11a,u+f11c-f11d,u+f133,u+f147,u+f14e,u+f150-f152,u+f185-f186,u+f18e,u+f190-f192,u+f196,u+f1c1-f1c9,u+f1d9,u+f1db,u+f1e3,u+f1ea,u+f1f7,u+f1f9,u+f20a,u+f247-f248,u+f24a,u+f24d,u+f255-f25b,u+f25d,u+f271-f274,u+f278,u+f27b,u+f28c,u+f28e,u+f29c,u+f2b5,u+f2b7,u+f2ba,u+f2bc,u+f2be,u+f2c0-f2c1,u+f2c3,u+f2d0,u+f2d2,u+f2d4,u+f2dc;
            }

            @font-face {
            font-family: "Font Awesome 6 Free";
            font-display: block;
            src: url(${chrome.runtime.getURL("webfonts/fa-v4compatibility.woff2")}) format("woff2"),
                url(${chrome.runtime.getURL("webfonts/fa-v4compatibility.ttf")}) format("truetype");
            unicode-range: u+f041,u+f047,u+f065-f066,u+f07d-f07e,u+f080,u+f08b,u+f08e,u+f090,u+f09a,u+f0ac,u+f0ae,u+f0b2,u+f0d0,u+f0d6,u+f0e4,u+f0ec,u+f10a-f10b,u+f123,u+f13e,u+f148-f149,u+f14c,u+f156,u+f15e,u+f160-f161,u+f163,u+f175-f178,u+f195,u+f1f8,u+f219,u+f27a;
            }

        `;

    // Append to shadow root
    document.head.appendChild(style);
  }

  // element where React renders
  const mountPoint = document.createElement("div");
  shadow.appendChild(mountPoint);

  // create root inside shadow
  modalRoot = ReactDOM.createRoot(mountPoint);



  if (modalRoot) {
    modalRoot.render(
      <React.StrictMode>
        <MainPage onClose={hideModal} subdomain={subdomain} isDev={isDeveloperMode()} />
      </React.StrictMode>
    );
  }
}

function hideModal() {
  if (modalRoot) {
    const modalContainer = document.getElementById('customModalOverlay');

    if (modalContainer) {
      modalRoot.render(<></>);
    }
    const overlay = document.getElementById('customModalOverlay');
    if (overlay) overlay.remove();

  }
}

async function waitForDivWithFallback(timeout = 10000) {
  const observer = new MutationObserver(async () => {
    const targetDiv = document.querySelector('div[data-automation-id="fraAccount"]');
    if (targetDiv) {
      await injectButton(targetDiv as HTMLElement);
      clearTimeout(fallbackTimer);

    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  const fallbackTimer = setTimeout(async () => {

    await injectButton(document.body);
  }, timeout);
}


// Initialize
async function initializeExtension(epicData: any) {



  console.log("Initializing InsureTech content script…", epicData);

  subdomain = await getSubdomain();
  await waitForDivWithFallback();
}

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === "client-detail-detected") {
    console.log("Client Detail detected — running content.tsx");
    await initializeExtension(message.data);
  }
});
