/**
 * CVI Type Talker - Image Module
 * Fetches images from Wikimedia Commons API for typed words.
 */
const CVIImages = {
    imageEl: null,
    labelEl: null,
    attributionEl: null,
    cache: new Map(),
    _currentRequest: 0,

    init() {
        this.imageEl = document.getElementById('word-image');
        this.labelEl = document.getElementById('image-label');
        this.attributionEl = document.getElementById('image-attribution');
    },

    /**
     * Show an image for the given word.
     * Queries Wikimedia Commons, filters for photos, displays result.
     */
    async showImage(word) {
        if (!word || !word.trim()) {
            this._showDefault();
            return;
        }

        var normalized = word.toLowerCase().trim();

        // Check if word should show image based on settings
        if (CVISettings && !CVISettings.shouldShowImage(normalized)) {
            this._showTextOnly(normalized);
            return;
        }

        // Check cache first
        if (this.cache.has(normalized)) {
            var cached = this.cache.get(normalized);
            if (cached) {
                this._displayImage(cached.url, normalized, cached.title);
            } else {
                this._showTextOnly(normalized);
            }
            return;
        }

        // Show loading state
        this._showLoading(normalized);

        // Track request to handle race conditions
        var requestId = ++this._currentRequest;

        try {
            var result = await this._fetchFromWikimedia(normalized);

            // Only update if this is still the latest request
            if (requestId !== this._currentRequest) return;

            if (result) {
                this.cache.set(normalized, result);
                this._displayImage(result.url, normalized, result.title);
            } else {
                this.cache.set(normalized, null);
                this._showTextOnly(normalized);
            }
        } catch (err) {
            if (requestId !== this._currentRequest) return;
            this.cache.set(normalized, null);
            this._showTextOnly(normalized);
        }
    },

    /**
     * Query Wikimedia Commons for an image matching the word.
     * Returns { url, title } or null.
     */
    async _fetchFromWikimedia(word) {
        var url = 'https://commons.wikimedia.org/w/api.php'
            + '?action=query'
            + '&generator=search'
            + '&gsrsearch=' + encodeURIComponent(word)
            + '&gsrnamespace=6'
            + '&gsrlimit=10'
            + '&prop=imageinfo'
            + '&iiprop=url|mime|extmetadata'
            + '&iiurlwidth=400'
            + '&format=json'
            + '&origin=*';

        var response = await fetch(url);
        var data = await response.json();

        if (!data.query || !data.query.pages) return null;

        var pages = Object.values(data.query.pages);

        // Filter for actual photographs (JPEG, PNG, WebP — not SVG or GIF)
        var photoMimes = ['image/jpeg', 'image/png', 'image/webp'];
        var photos = pages.filter(function(p) {
            return p.imageinfo &&
                   p.imageinfo[0] &&
                   photoMimes.indexOf(p.imageinfo[0].mime) !== -1;
        });

        if (photos.length === 0) return null;

        // Pick the first suitable photo
        var best = photos[0];
        var info = best.imageinfo[0];
        var thumbUrl = info.thumburl || info.url;
        var title = best.title ? best.title.replace('File:', '').replace(/\.[^.]+$/, '') : word;

        return { url: thumbUrl, title: title };
    },

    /**
     * Display an image with label and attribution.
     */
    _displayImage(src, word, title) {
        this.imageEl.src = src;
        this.imageEl.alt = 'Photo of ' + word;
        this.imageEl.hidden = false;
        this.labelEl.textContent = word.toUpperCase();
        this.labelEl.className = 'image-label has-image';
        this.attributionEl.textContent = 'Image from Wikimedia Commons';

        this.imageEl.onerror = function() {
            this._showTextOnly(word);
        }.bind(this);
    },

    /**
     * Show loading state while image is being fetched.
     */
    _showLoading(word) {
        this.imageEl.hidden = true;
        this.imageEl.src = '';
        this.labelEl.textContent = word.toUpperCase() + '...';
        this.labelEl.className = 'image-label loading';
        this.attributionEl.textContent = 'Searching for image...';
    },

    /**
     * Show word as large text when no image is available.
     */
    _showTextOnly(word) {
        this.imageEl.hidden = true;
        this.imageEl.src = '';
        this.labelEl.textContent = word.toUpperCase();
        this.labelEl.className = 'image-label';
        this.attributionEl.textContent = '';
    },

    /**
     * Show default state (initial).
     */
    _showDefault() {
        this.imageEl.hidden = true;
        this.imageEl.src = '';
        this.labelEl.textContent = 'Type a word!';
        this.labelEl.className = 'image-label';
        this.attributionEl.textContent = '';
    },

    /**
     * Hide image panel content entirely.
     */
    hideImage() {
        this._showDefault();
    }
};
