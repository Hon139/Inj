document.addEventListener('DOMContentLoaded', () => {
  // Display current score
  chrome.storage.local.get(['score'], (result) => {
    document.getElementById('score').textContent = `Score: ${result.score || 0}`;
  });

  // Enable/disable quiz toggle
  const toggleQuiz = document.getElementById('enableQuiz');
  chrome.storage.local.get(['enabled'], (result) => {
    toggleQuiz.checked = result.enabled !== false;
  });

  toggleQuiz.addEventListener('change', (e) => {
    chrome.storage.local.set({ enabled: e.target.checked });
  });
});