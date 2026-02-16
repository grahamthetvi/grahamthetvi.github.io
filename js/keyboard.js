/**
 * CVI Type Talker - Keyboard Module
 * Captures keyboard input, applies rate limiting, and routes to other modules.
 */
const CVIKeyboard = {
    lastKeyTime: 0,
    minInterval: 150,
    enabled: false,

    /** Allowed single characters: letters and digits */
    _isAllowedChar: function(key) {
        return (key.length === 1 && /[a-zA-Z0-9]/.test(key));
    },

    init() {
        document.addEventListener('keydown', this._handleKeyDown.bind(this));
    },

    enable() {
        this.enabled = true;
    },

    disable() {
        this.enabled = false;
    },

    _handleKeyDown(event) {
        if (!this.enabled) return;

        var key = event.key;

        // Ctrl+Shift+Q: exit fullscreen
        if (event.ctrlKey && event.shiftKey && (key === 'Q' || key === 'q')) {
            event.preventDefault();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            return;
        }

        // Ctrl+Shift+C: clear screen
        if (event.ctrlKey && event.shiftKey && (key === 'C' || key === 'c')) {
            event.preventDefault();
            CVIDisplay.clear();
            CVIImages.hideImage();
            CVISpeech.speakSystem('screen cleared');
            return;
        }

        // Ignore other modifier combos (let browser handle Ctrl+C, etc.)
        if (event.ctrlKey || event.metaKey || event.altKey) return;

        // Rate limiting
        var now = Date.now();
        if (now - this.lastKeyTime < this.minInterval) {
            event.preventDefault();
            return;
        }
        this.lastKeyTime = now;

        // Backspace
        if (key === 'Backspace') {
            event.preventDefault();
            var removed = CVIDisplay.removeCharacter();
            if (removed) {
                CVISpeech.speakSystem('backspace');
            }
            return;
        }

        // Enter
        if (key === 'Enter') {
            event.preventDefault();
            var word = CVIDisplay.commitLine();
            if (word) {
                CVISpeech.speakWord(word);
                CVIImages.showImage(word);
            } else {
                CVISpeech.speakSystem('new line');
            }
            return;
        }

        // Space
        if (key === ' ') {
            event.preventDefault();
            var completedWord = CVIDisplay.handleSpace();
            if (completedWord) {
                CVISpeech.speakWord(completedWord);
                CVIImages.showImage(completedWord);
            }
            return;
        }

        // Letters and numbers
        if (this._isAllowedChar(key)) {
            event.preventDefault();
            CVIDisplay.addCharacter(key);
            CVISpeech.speakLetter(key);
            return;
        }

        // All other keys: ignore (Tab, arrows, F-keys, etc.)
    }
};
