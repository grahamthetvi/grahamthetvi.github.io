/**
 * CVI Type Talker - Background Removal Module
 * Lazily loads @imgly/background-removal and processes images client-side.
 * The ML model (~30MB) downloads on first use and is cached by the browser.
 */
var CVIBackgroundRemoval = {
    _library: null,
    _loading: false,
    _loadPromise: null,
    _processedCache: new Map(),

    /**
     * Load the background removal library on demand.
     * Returns a promise that resolves to the removeBackground function.
     */
    _loadLibrary: function() {
        if (this._library) {
            return Promise.resolve(this._library);
        }
        if (this._loadPromise) {
            return this._loadPromise;
        }

        this._loading = true;
        var self = this;

        this._loadPromise = import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm')
            .then(function(module) {
                self._library = module;
                self._loading = false;
                return module;
            })
            .catch(function(err) {
                self._loading = false;
                self._loadPromise = null;
                throw err;
            });

        return this._loadPromise;
    },

    /**
     * Check if background removal is enabled in settings.
     */
    isEnabled: function() {
        return CVISettings && CVISettings.current && CVISettings.current.removeBackground;
    },

    /**
     * Process an image URL and return a new blob URL with the background removed.
     * Shows progress via the attribution element.
     * Returns the processed blob URL, or the original URL on failure.
     */
    processImage: async function(imageUrl, word) {
        if (!this.isEnabled()) {
            return imageUrl;
        }

        // Check cache first
        if (this._processedCache.has(imageUrl)) {
            return this._processedCache.get(imageUrl);
        }

        var attributionEl = document.getElementById('image-attribution');

        try {
            // Show loading status
            if (attributionEl) {
                attributionEl.textContent = 'Loading background removal model...';
            }

            var module = await this._loadLibrary();

            if (attributionEl) {
                attributionEl.textContent = 'Removing background...';
            }

            // Fetch the image as a blob to avoid CORS issues
            var response = await fetch(imageUrl);
            var imageBlob = await response.blob();

            // Process the image
            var resultBlob = await module.removeBackground(imageBlob, {
                progress: function(key, current, total) {
                    if (attributionEl && key === 'compute:inference') {
                        var pct = Math.round((current / total) * 100);
                        attributionEl.textContent = 'Removing background... ' + pct + '%';
                    }
                }
            });

            // Create a URL for the processed image
            var processedUrl = URL.createObjectURL(resultBlob);
            this._processedCache.set(imageUrl, processedUrl);

            if (attributionEl) {
                attributionEl.textContent = 'Background removed - Wikimedia Commons';
            }

            return processedUrl;
        } catch (err) {
            if (attributionEl) {
                attributionEl.textContent = 'Image from Wikimedia Commons';
            }
            return imageUrl;
        }
    },

    /**
     * Clear processed image cache and revoke blob URLs.
     */
    clearCache: function() {
        this._processedCache.forEach(function(url) {
            URL.revokeObjectURL(url);
        });
        this._processedCache.clear();
    }
};
