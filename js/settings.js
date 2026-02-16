/**
 * CVI Type Talker - Settings Module
 * Manages user customization settings for fonts, bubble letters, typing controls, and image filtering.
 */
const CVISettings = {
    defaults: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 60,
        fontColor: '#FFFFFF',
        bubbleLettersEnabled: false,
        bubbleColor: '#FFFF00',
        bubbleSize: 4,
        typingInterval: 150,
        maxKeysPerSecond: 10,
        filterProfanity: true,
        customWordListEnabled: false,
        customWordList: ''
    },

    current: {},

    // Common profanity words to filter
    profanityList: [
        'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'ass', 'bastard',
        'piss', 'cock', 'dick', 'pussy', 'whore', 'slut', 'fag', 'nigger'
    ],

    init() {
        this.loadSettings();
        this.setupUI();
        this.applySettings();
    },

    /**
     * Load settings from localStorage or use defaults
     */
    loadSettings() {
        var saved = localStorage.getItem('cvi-settings');
        if (saved) {
            try {
                this.current = JSON.parse(saved);
                // Merge with defaults to handle new settings
                for (var key in this.defaults) {
                    if (this.current[key] === undefined) {
                        this.current[key] = this.defaults[key];
                    }
                }
            } catch (e) {
                this.current = Object.assign({}, this.defaults);
            }
        } else {
            this.current = Object.assign({}, this.defaults);
        }
    },

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('cvi-settings', JSON.stringify(this.current));
    },

    /**
     * Set up the settings UI event listeners
     */
    setupUI() {
        var self = this;
        var panel = document.getElementById('settings-panel');
        var settingsBtn = document.getElementById('settings-button');
        var saveBtn = document.getElementById('save-settings');
        var cancelBtn = document.getElementById('cancel-settings');
        var resetBtn = document.getElementById('reset-settings');

        // Open settings panel
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function() {
                self.openPanel();
            });
        }

        // Save settings
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                self.readFromUI();
                self.saveSettings();
                self.applySettings();
                self.closePanel();
            });
        }

        // Cancel
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                self.closePanel();
                self.populateUI(); // Reset UI to saved values
            });
        }

        // Reset to defaults
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                if (confirm('Reset all settings to defaults?')) {
                    self.current = Object.assign({}, self.defaults);
                    self.saveSettings();
                    self.populateUI();
                    self.applySettings();
                }
            });
        }

        // Real-time updates for range sliders
        var fontSize = document.getElementById('font-size');
        var fontSizeValue = document.getElementById('font-size-value');
        if (fontSize && fontSizeValue) {
            fontSize.addEventListener('input', function() {
                fontSizeValue.textContent = this.value + 'px';
            });
        }

        var bubbleSize = document.getElementById('bubble-size');
        var bubbleSizeValue = document.getElementById('bubble-size-value');
        if (bubbleSize && bubbleSizeValue) {
            bubbleSize.addEventListener('input', function() {
                bubbleSizeValue.textContent = this.value + 'px';
            });
        }

        var typingInterval = document.getElementById('typing-interval');
        var typingIntervalValue = document.getElementById('typing-interval-value');
        if (typingInterval && typingIntervalValue) {
            typingInterval.addEventListener('input', function() {
                typingIntervalValue.textContent = this.value + 'ms';
            });
        }

        var maxKeys = document.getElementById('max-keys-per-second');
        var maxKeysValue = document.getElementById('max-keys-value');
        if (maxKeys && maxKeysValue) {
            maxKeys.addEventListener('input', function() {
                maxKeysValue.textContent = this.value;
            });
        }

        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && panel && panel.classList.contains('visible')) {
                self.closePanel();
                self.populateUI(); // Reset UI to saved values
            }
        });

        // Populate UI with current values
        this.populateUI();
    },

    /**
     * Open the settings panel
     */
    openPanel() {
        var panel = document.getElementById('settings-panel');
        if (panel) {
            panel.classList.add('visible');
            this.populateUI();
            // Disable keyboard input while settings are open
            if (CVIKeyboard) {
                CVIKeyboard.disable();
            }
        }
    },

    /**
     * Close the settings panel
     */
    closePanel() {
        var panel = document.getElementById('settings-panel');
        if (panel) {
            panel.classList.remove('visible');
            // Re-enable keyboard input
            if (CVIKeyboard && CVIKeyboard.enabled !== undefined) {
                var overlay = document.getElementById('instructions-overlay');
                if (!overlay || overlay.classList.contains('hidden')) {
                    CVIKeyboard.enable();
                }
            }
        }
    },

    /**
     * Populate UI controls with current settings
     */
    populateUI() {
        var fontFamily = document.getElementById('font-family');
        if (fontFamily) fontFamily.value = this.current.fontFamily;

        var fontSize = document.getElementById('font-size');
        var fontSizeValue = document.getElementById('font-size-value');
        if (fontSize) fontSize.value = this.current.fontSize;
        if (fontSizeValue) fontSizeValue.textContent = this.current.fontSize + 'px';

        var fontColor = document.getElementById('font-color');
        if (fontColor) fontColor.value = this.current.fontColor;

        var bubbleEnabled = document.getElementById('bubble-letters-enabled');
        if (bubbleEnabled) bubbleEnabled.checked = this.current.bubbleLettersEnabled;

        var bubbleColor = document.getElementById('bubble-color');
        if (bubbleColor) bubbleColor.value = this.current.bubbleColor;

        var bubbleSize = document.getElementById('bubble-size');
        var bubbleSizeValue = document.getElementById('bubble-size-value');
        if (bubbleSize) bubbleSize.value = this.current.bubbleSize;
        if (bubbleSizeValue) bubbleSizeValue.textContent = this.current.bubbleSize + 'px';

        var typingInterval = document.getElementById('typing-interval');
        var typingIntervalValue = document.getElementById('typing-interval-value');
        if (typingInterval) typingInterval.value = this.current.typingInterval;
        if (typingIntervalValue) typingIntervalValue.textContent = this.current.typingInterval + 'ms';

        var maxKeys = document.getElementById('max-keys-per-second');
        var maxKeysValue = document.getElementById('max-keys-value');
        if (maxKeys) maxKeys.value = this.current.maxKeysPerSecond;
        if (maxKeysValue) maxKeysValue.textContent = this.current.maxKeysPerSecond;

        var filterProfanity = document.getElementById('filter-profanity');
        if (filterProfanity) filterProfanity.checked = this.current.filterProfanity;

        var customListEnabled = document.getElementById('custom-word-list-enabled');
        if (customListEnabled) customListEnabled.checked = this.current.customWordListEnabled;

        var customList = document.getElementById('custom-word-list');
        if (customList) customList.value = this.current.customWordList;
    },

    /**
     * Read values from UI controls
     */
    readFromUI() {
        var fontFamily = document.getElementById('font-family');
        if (fontFamily) this.current.fontFamily = fontFamily.value;

        var fontSize = document.getElementById('font-size');
        if (fontSize) this.current.fontSize = parseInt(fontSize.value);

        var fontColor = document.getElementById('font-color');
        if (fontColor) this.current.fontColor = fontColor.value;

        var bubbleEnabled = document.getElementById('bubble-letters-enabled');
        if (bubbleEnabled) this.current.bubbleLettersEnabled = bubbleEnabled.checked;

        var bubbleColor = document.getElementById('bubble-color');
        if (bubbleColor) this.current.bubbleColor = bubbleColor.value;

        var bubbleSize = document.getElementById('bubble-size');
        if (bubbleSize) this.current.bubbleSize = parseInt(bubbleSize.value);

        var typingInterval = document.getElementById('typing-interval');
        if (typingInterval) this.current.typingInterval = parseInt(typingInterval.value);

        var maxKeys = document.getElementById('max-keys-per-second');
        if (maxKeys) this.current.maxKeysPerSecond = parseInt(maxKeys.value);

        var filterProfanity = document.getElementById('filter-profanity');
        if (filterProfanity) this.current.filterProfanity = filterProfanity.checked;

        var customListEnabled = document.getElementById('custom-word-list-enabled');
        if (customListEnabled) this.current.customWordListEnabled = customListEnabled.checked;

        var customList = document.getElementById('custom-word-list');
        if (customList) this.current.customWordList = customList.value;
    },

    /**
     * Apply current settings to the application
     */
    applySettings() {
        var textDisplay = document.getElementById('text-display');
        if (textDisplay) {
            textDisplay.style.fontFamily = this.current.fontFamily;
            textDisplay.style.fontSize = this.current.fontSize + 'px';
            textDisplay.style.color = this.current.fontColor;

            // Apply bubble letters
            if (this.current.bubbleLettersEnabled) {
                textDisplay.classList.add('bubble-letters');
                textDisplay.style.setProperty('--bubble-color', this.current.bubbleColor);

                // Calculate text shadow for bubble effect
                var shadows = [];
                var size = this.current.bubbleSize;
                for (var x = -size; x <= size; x++) {
                    for (var y = -size; y <= size; y++) {
                        if (x !== 0 || y !== 0) {
                            shadows.push(x + 'px ' + y + 'px 0 ' + this.current.bubbleColor);
                        }
                    }
                }
                textDisplay.style.textShadow = shadows.join(', ');
            } else {
                textDisplay.classList.remove('bubble-letters');
                textDisplay.style.textShadow = 'none';
            }
        }

        // Apply typing interval to keyboard module
        if (CVIKeyboard) {
            CVIKeyboard.minInterval = this.current.typingInterval;
        }
    },

    /**
     * Check if a word should display an image based on filters
     */
    shouldShowImage(word) {
        if (!word) return false;

        var normalized = word.toLowerCase().trim();

        // If using custom word list only
        if (this.current.customWordListEnabled) {
            var allowedWords = this.current.customWordList
                .toLowerCase()
                .split(',')
                .map(function(w) { return w.trim(); })
                .filter(function(w) { return w.length > 0; });

            return allowedWords.indexOf(normalized) !== -1;
        }

        // If filtering profanity
        if (this.current.filterProfanity) {
            for (var i = 0; i < this.profanityList.length; i++) {
                if (normalized === this.profanityList[i] ||
                    normalized.indexOf(this.profanityList[i]) !== -1) {
                    return false;
                }
            }
        }

        return true;
    },

    /**
     * Get current settings
     */
    getSettings() {
        return this.current;
    }
};
