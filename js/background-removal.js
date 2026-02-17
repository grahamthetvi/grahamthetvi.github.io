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
     * Resize image to optimize for background removal (720p-1080p range).
     * Returns a canvas with the resized image.
     */
    _resizeImage: function(img) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        var maxWidth = 1920;  // 1080p width
        var maxHeight = 1080; // 1080p height
        var minWidth = 1280;  // 720p width
        var minHeight = 720;  // 720p height

        var width = img.width;
        var height = img.height;

        // Calculate target dimensions
        var targetWidth, targetHeight;

        if (width > maxWidth || height > maxHeight) {
            // Scale down to 1080p if larger
            var scale = Math.min(maxWidth / width, maxHeight / height);
            targetWidth = Math.round(width * scale);
            targetHeight = Math.round(height * scale);
        } else if (width < minWidth && height < minHeight) {
            // Scale up to 720p if smaller
            var scale = Math.max(minWidth / width, minHeight / height);
            targetWidth = Math.round(width * scale);
            targetHeight = Math.round(height * scale);
        } else {
            // Keep original size if within range
            targetWidth = width;
            targetHeight = height;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        return canvas;
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
        var self = this;

        try {
            // Show loading status
            if (attributionEl) {
                attributionEl.textContent = 'Loading background removal model...';
            }

            var module = await this._loadLibrary();

            if (attributionEl) {
                attributionEl.textContent = 'Preparing image...';
            }

            // Fetch and load the image
            var response = await fetch(imageUrl);
            var imageBlob = await response.blob();

            // Create an image element to resize
            var img = new Image();
            img.crossOrigin = 'anonymous';
            var imageLoaded = new Promise(function(resolve, reject) {
                img.onload = function() { resolve(img); };
                img.onerror = reject;
            });
            img.src = URL.createObjectURL(imageBlob);
            await imageLoaded;

            // Resize image to optimize processing speed
            var canvas = this._resizeImage(img);
            var resizedBlob = await new Promise(function(resolve) {
                canvas.toBlob(resolve, 'image/png');
            });

            if (attributionEl) {
                attributionEl.textContent = 'Removing background...';
            }

            // Process the image with WebGPU acceleration and optimized settings
            var resultBlob = await module.removeBackground(resizedBlob, {
                model: 'small', // Use smaller, faster model
                device: 'gpu',  // Enable GPU/WebGPU acceleration
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
            console.error('Background removal error:', err);
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
