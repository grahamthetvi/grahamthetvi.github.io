/**
 * CVI Type Talker - Application Entry Point
 * Initializes all modules and manages app lifecycle.
 */
const CVIApp = {
    async init() {
        // Initialize modules
        CVISettings.init();
        CVIDisplay.init();
        CVIImages.init();
        await CVISpeech.init();
        CVIKeyboard.init();

        // Start pre-loading images in the background immediately.
        // Uses a short delay so the browser can finish rendering first.
        var preloadList = CVISettings.getSettings().preloadWords;
        if (preloadList) {
            setTimeout(function() {
                CVIImages.preloadWords(preloadList);
            }, 800);
        }

        // Warn if TTS is not supported
        if (!CVISpeech.isSupported()) {
            document.getElementById('status-text').textContent =
                'Warning: Text-to-speech is not supported in this browser. Please use Chrome, Edge, Firefox, or Safari.';
        }

        // Set up the start button and overlay
        var overlay = document.getElementById('instructions-overlay');
        var startBtn = document.getElementById('start-button');

        if (overlay && startBtn) {
            startBtn.addEventListener('click', function() {
                overlay.classList.add('hidden');
                CVIKeyboard.enable();

                // Request fullscreen (best effort, may be blocked)
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(function() {
                        // Fullscreen denied — continue without it
                    });
                }

                // Focus the text display so keyboard events are captured
                document.getElementById('text-display').focus();

                // Welcome message
                CVISpeech.speakSystem('Ready. Start typing.');
            });
        }

        // Pause speech when tab is hidden
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                CVISpeech.stop();
            }
        });
    }
};

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { CVIApp.init(); });
} else {
    CVIApp.init();
}
