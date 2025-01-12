// This file contains the background script for the Chrome extension. It manages events and handles interactions with the browser.

chrome.runtime.onInstalled.addListener(() => {
    console.log('Instagram Quiz Extension installed');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        chrome.tabs.sendMessage(tabId, { action: "urlChanged", url: tab.url });
        const isReelsUrl = tab.url.startsWith('https://www.instagram.com/reels/');
        
        if (isReelsUrl) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['scripts/content.js']
            });
            chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: ['styles/content.css']
            });
        }

        else {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    enableScroll();
                }
            });
        }
    }
});