const AUTH0_DOMAIN = "dev-0ctnrdkqcdk0fjq5.us.auth0.com";
const AUTH0_CLIENT_ID = "8TJsPYTBZSFjATTHV34d2IiPBhdxIpvt";

function generateRandomString(length = 32) {
  return [...Array(length)]
    .map(() => Math.random().toString(36)[2])
    .join('');
}

function getAuth0AuthorizeUrl() {
  const redirectUri = "http://localhost:5000/callback";
  const scope = encodeURIComponent("openid profile email");
  const responseType = encodeURIComponent("token id_token");
  const nonce = generateRandomString();
  const state = generateRandomString();

  // Store `state` and `nonce` for validation after redirection
  sessionStorage.setItem("auth_nonce", nonce);
  sessionStorage.setItem("auth_state", state);

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

async function loginWithAuth0() {
  return new Promise((resolve, reject) => {
    const authUrl = getAuth0AuthorizeUrl();
    const width = 500;
    const height = 600;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    const authWindow = window.open(
      authUrl,
      'Auth0 Login',
      `width=${width},height=${height},top=${top},left=${left}`
    );

    const interval = setInterval(() => {
      try {
        const fragment = authWindow.location.hash.slice(1);
        if (!fragment) return;

        const params = new URLSearchParams(fragment);
        const accessToken = params.get("access_token");
        const idToken = params.get("id_token");
        const state = params.get("state");
        const tokenType = params.get("token_type");
        const expiresIn = params.get("expires_in");

        if (!accessToken || !idToken || !state) {
          throw new Error("Missing tokens or state");
        }

        // Validate state
        const storedState = sessionStorage.getItem("auth_state");
        if (state !== storedState) {
          throw new Error("State mismatch");
        }

        // Store tokens securely
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("idToken", idToken);
        localStorage.setItem("tokenType", tokenType);
        localStorage.setItem("expiresIn", expiresIn);

        console.log("Token stored successfully!");

        // Clear interval and close window
        clearInterval(interval);
        authWindow.close();

        resolve({ accessToken, idToken, tokenType, expiresIn });
      } catch (error) {
        console.error("Error during login:", error.message);
      }
    }, 500);

    authWindow.addEventListener("beforeunload", () => {
      clearInterval(interval);
      reject(new Error("User closed the login window"));
    });
  });
}
