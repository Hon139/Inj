import React from "react";
import {createRoot} from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <Auth0Provider
    domain={"dev-0ctnrdkqcdk0fjq5.us.auth0.com"}
    clientId={"sZEC7ds9gswNcdwsiMUqz0iZyH8nETzj"}
    authorizationParams={{
      redirect_uri: "http://localhost:5000/callback"
    }}
  >
    <App />
  </Auth0Provider>
);
