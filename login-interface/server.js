const express = require('express');
const {auth} = require('express-openid-connect');
const cors = require('cors');
require('dotenv').config();

const app = express();

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET, 
    baseURL: 'http://localhost:3000',
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_BASE_URL, 
}

app.use(auth(config));      // set base URL for /login, /logout, / routes
app.use(cors({origin:'http://localhost:3000',credentials: true}));

// Example route
app.get('/', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});
  
app.listen(5000, () => {
    console.log('Server running on http://localhost:3000');
});
