// Background Service Worker for Insure Tech Extension
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
  if (message.action === "OPEN_PAYMENT_WINDOW") {
    chrome.windows.create({
      url: `popup/payment.html?invoice=${message.invoiceId}&subdomain=${message.subdomain}&amount=${message.amount}&customerid=${message.customerLookup}&accountId=${message.accountId}&surcharge=${message.surcharge}&clientName=${encodeURIComponent(message.clientName)}`,
      type: "popup",
      width: 480,
      height: 640
    });
  }
});
chrome.runtime.onMessage.addListener(
  (
    request: { action: string; url: string; options: any },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): boolean => {
    if (request.action === 'proxyFetch') {
      const { url, options } = request;

      // Build fetch options
      const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      if (options.body) {
        fetchOptions.body = options.body;
      }

      fetch(url, fetchOptions)
        .then(async (response: Response) => {
          const contentType = response.headers.get('content-type');
          let data: string;

          if (contentType && contentType.includes('application/json')) {
            data = await response.text(); // Get as text, let caller parse
          } else {
            data = await response.text();
          }

          const headersObj: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            headersObj[key] = value;
          });

          sendResponse({
            success: true,
            status: response.status,
            statusText: response.statusText,
            data: data,
            headers: headersObj
          });
        })
        .catch((error: Error) => {
          sendResponse({
            success: false,
            error: error.message
          });
        });

      return true; // CRITICAL: keeps message channel open for async
    }

    return false;
  }
);

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.type === 'xhrRequestIntercepted') {
    console.log('XHR Request Intercepted:');
    console.log('  URL:', message.url);
    console.log('  Response:', message.response);
    sendResponse({ status: 'received' });
  }

  if (message.type === 'epic-screen-activated') {
    console.log('Epic Screen Activated:');
    console.log('  Screen:', message.data?.screenName);
    sendResponse({ status: 'screen-activation-processed' });
  }

  return true;
});