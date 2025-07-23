// Proctoring.js

// Tab-switching detection
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('User switched tabs');
        // You can add further actions here, like sending a warning to the server.
    }
});

// Fullscreen enforcement
function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
    }
}

// Exit fullscreen detection
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        console.log('User exited fullscreen');
        // You can add further actions here, like re-entering fullscreen.
        enterFullscreen();
    }
});

// Copy-paste prevention
document.addEventListener('copy', (e) => {
    e.preventDefault();
    console.log('Copying is disabled');
});

document.addEventListener('paste', (e) => {
    e.preventDefault();
    console.log('Pasting is disabled');
});

// DevTools detection
function detectDevTools() {
    const threshold = 160;
    const devtools = /./;
    devtools.toString = function() {
        if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
            console.log('DevTools is open');
            // You can add further actions here.
        }
        return '-';
    };
    console.log(devtools);
}

// Run DevTools detection periodically
setInterval(detectDevTools, 1000);

// Keyboard shortcuts detection
document.addEventListener('keydown', (e) => {
    // Block Alt+Tab
    if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        console.log('Alt+Tab is disabled');
    }

    // Block Esc
    if (e.key === 'Escape') {
        e.preventDefault();
        console.log('Escape is disabled');
    }

    // Block PrintScreen
    if (e.key === 'PrintScreen') {
        e.preventDefault();
        console.log('PrintScreen is disabled');
    }
});

// Initial fullscreen enforcement
enterFullscreen();
