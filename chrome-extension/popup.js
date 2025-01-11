document.getElementById('login').addEventListener('click', () => {
    // Opens Express server's /login route
    chrome.tabs.create({ url: 'http://localhost:3000/login' });
  });
  
  document.getElementById('logout').addEventListener('click', () => {
    // Opens Express server's /logout route
    chrome.tabs.create({ url: 'http://localhost:3000/logout' });
  });
  
  document.getElementById('check').addEventListener('click', async () => {
    const messageEl = document.getElementById('message');
    messageEl.textContent = 'Checking...';
  
    try {
      const res = await fetch('http://localhost:3000/', {
        method: 'GET',
        credentials: 'include', // include session cookie
      });
      const text = await res.text();
      messageEl.textContent = text; // "Logged in" or "Logged out"
    } catch (err) {
      messageEl.textContent = 'Error: ' + err.toString();
    }
  });
  