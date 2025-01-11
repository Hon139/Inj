document.addEventListener('DOMContentLoaded', (event) => {
    // Function to disable scroll and arrow keys
    function disableScrollAndKeys() {
        window.addEventListener('wheel', preventDefault, { passive: false });
        window.addEventListener('keydown', preventArrowKeys, { passive: false });
    }

    // Function to enable scroll and arrow keys
    function enableScrollAndKeys() {
        window.removeEventListener('wheel', preventDefault, { passive: false });
        window.removeEventListener('keydown', preventArrowKeys, { passive: false });
    }

    // Prevent default action for scroll
    function preventDefault(e) {
        e.preventDefault();
    }

    // Prevent default action for arrow keys
    function preventArrowKeys(e) {
        // Check for arrow keys by their key codes
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    }

    // Disable scroll and arrow keys for 15 seconds
    disableScrollAndKeys();
    console.log('Scroll and arrow keys disabled for 15 seconds');
    setTimeout(enableScrollAndKeys, 15000);
    console.log('Scroll and arrow keys enabled after 15 seconds');
});
