require('dotenv').config();

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed.");
  });
  
  const AUTH0_DOMAIN = process.env.AUTH0_BASE_URL;         
  const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;   
  

  function getAuth0AuthorizeUrl() {
    const redirectUri = chrome.identity.getRedirectURL("callback.html");
    const scope = encodeURIComponent("openid profile email");
    const responseType = encodeURIComponent("token id_token");
    const nonce = "nonce_example";  // In production, generate a random nonce
    const state = "state_example";  // In production, generate a random state
  
    return (
      `https://${AUTH0_DOMAIN}/authorize` +
      `?client_id=${AUTH0_CLIENT_ID}` +
      `&response_type=${responseType}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&nonce=${nonce}` +
      `&state=${state}`
    );
  }
  
  /**
   * Launches the Auth0 login flow in a new window. After the user logs in,
   * the redirect will point back to our extension's callback URL, which
   * we parse for tokens.
   */
  async function loginWithAuth0() {
    return new Promise((resolve, reject) => {
      const authUrl = getAuth0AuthorizeUrl();
  
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true
        },
        (redirectUri) => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          if (!redirectUri || redirectUri.includes("error=")) {
            return reject(new Error("Login failed or was canceled."));
          }
  
          // The redirectUri should contain the tokens in the hash fragment
          // e.g. #access_token=...&id_token=...&token_type=Bearer&expires_in=86400
          const fragment = redirectUri.split("#")[1];
          if (!fragment) {
            return reject(new Error("No token data found in redirect URI."));
          }
  
          // Parse hash parameters
          const params = new URLSearchParams(fragment);
          const accessToken = params.get("access_token");
          const idToken = params.get("id_token");
          const tokenType = params.get("token_type");
          const expiresIn = params.get("expires_in");
  
          if (!accessToken || !idToken) {
            return reject(new Error("Tokens not found in Auth0 response."));
          }
  
          // Store tokens in chrome.storage
          chrome.storage.local.set(
            { accessToken, idToken, tokenType, expiresIn },
            () => {
              console.log("Token stored successfully!");
              resolve({ accessToken, idToken, tokenType, expiresIn });
            }
          );
        }
      );
    });
  }
  
  // Listen for messages from popup.js to start the login process
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "auth-login") {
      loginWithAuth0()
        .then((tokens) => sendResponse({ success: true, tokens }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      // Return true to indicate we'll reply async
      return true;
    }
  });
  