


console.log('Background service worker initialized');

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed or updated");
});

// Listen for web requests to detect Client Detail screen
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url.includes("/v1/epic/action/activated")) {
      console.log("Web Request Detected:", details.url);

      if (details.requestBody && details.requestBody.raw) {
        const decoder = new TextDecoder("utf-8");
        const bodyText = decoder.decode(details.requestBody.raw[0].bytes);
        console.log("Request Body:", bodyText);

        try {
          const decodedBody = JSON.parse(bodyText);
          console.log("Decoded Body:", decodedBody);

          // Check if screenname matches Client Detail screen
          if (decodedBody.screenName === "Client.Detail|0") {
            console.log("Client Detail screen detected!");

            // Send message to content script
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
              if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  type: "client-detail-detected",
                  data: decodedBody
                }).catch((err: Error) => {
                  console.log("Message send failed (content script may not be ready):", err);
                });
              }
            });
          }
        } catch (error) {
          console.error("Error parsing request body:", error);
        }
      }
    }
  },
  { urls: ["https://*.appliedepic.com/*"] },
  ["requestBody"]
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.action === 'OPEN_PAYMENT_WINDOW') {
    chrome.windows.create({
      url: `popup/payment.html?invoice=${message.invoiceId}&subdomain=${message.subdomain}&amount=${message.amount}&customerid=${message.customerLookup}&accountId=${message.accountId}&surcharge=${message.surcharge}&clientName=${encodeURIComponent(message.clientName)}`,
      type: "popup",
      width: 480,
      height: 640
    });
    return false;
  }

  if (message.action === 'proxyFetch') {
    const { url, options } = message;

    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      fetchOptions.body = options.body;
    }

    fetch(url, fetchOptions)
      .then(response =>
        response.text().then(data => {
          const headersObj: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            headersObj[key] = value;
          });
          sendResponse({
            success: true,
            status: response.status,
            statusText: response.statusText,
            data,
            headers: headersObj
          });
        })
      )
      .catch((error: any) => {
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true; // keep channel open for async sendResponse
  }

  if (message.action === 'OPEN_WEBSITE_SSO') {
    chrome.storage.local.get(['cognito_refresh_token', 'cognito_id_token', 'cognito_user_info'])
      .then(result => {
        const idToken = result['cognito_id_token'] || null;
        const refreshToken = result['cognito_refresh_token'] || null;
        const userInfo = result['cognito_user_info'] || null;
        const username = userInfo ? JSON.parse(userInfo).email : null;

        const url = message.isDev ? 'http://127.0.0.1:3000' : 'https://portal.instechpay.co';
        return fetch(`${url}/portal-v1/${message.subdomain}/generate-sso-code`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
            'user': username || ''
          },
          body: JSON.stringify({ idToken, refreshToken, subdomain: message.subdomain })
        }).then(r => r.json()).then(({ code }) => {
          const searchParams = new URLSearchParams({ code, accountID: message.accountId });
          chrome.tabs.create({
            url: message.isDev
              ? `http://localhost:5173/sso?${searchParams.toString()}`
              : `https://portal.instechpay.co/sso?${searchParams.toString()}`
          });
        });
      })
      .catch((error: any) => console.error('SSO failed:', error));

    return false;
  }

  if (message.type === 'xhrRequestIntercepted') {
    console.log('XHR Request Intercepted:');
    console.log('  URL:', message.url);
    console.log('  Response:', message.response);
    sendResponse({ status: 'received' });
    return false;
  }

  if (message.type === 'epic-screen-activated') {
    console.log('Epic Screen Activated:');
    console.log('  Screen:', message.data?.screenName);
    sendResponse({ status: 'screen-activation-processed' });
    return false;
  }

  return false;
});