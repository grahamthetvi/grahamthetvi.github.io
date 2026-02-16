/**
 * CVI Type Talker - Display Module
 * Manages the text display area, line tracking, and status bar.
 */
const CVIDisplay = {
    displayEl: null,
    statusTextEl: null,
    lines: [],
    currentText: '',
    maxVisibleLines: 5,

    init() {
        this.displayEl = document.getElementById('text-display');
        this.statusTextEl = document.getElementById('status-text');
        this.lines = [];
        this.currentText = '';
        this._render();
    },

    /**
     * Add a character to the current line.
     */
    addCharacter(char) {
        this.currentText += char;
        this._render();
    },

    /**
     * Remove the last character (backspace).
     * Returns the removed character or null if empty.
     */
    removeCharacter() {
        if (this.currentText.length === 0) return null;
        const removed = this.currentText[this.currentText.length - 1];
        this.currentText = this.currentText.slice(0, -1);
        this._render();
        return removed;
    },

    /**
     * Get the current word being typed (last space-separated token).
     */
    getCurrentWord() {
        const words = this.currentText.trim().split(/\s+/);
        return words[words.length - 1] || '';
    },

    /**
     * Handle space: add space to text and return the just-completed word.
     */
    handleSpace() {
        const word = this.getCurrentWord();
        this.currentText += ' ';
        this._render();
        if (word) {
            this._updateStatus('You typed: ' + word.toUpperCase());
        }
        return word;
    },

    /**
     * Commit the current line (Enter). Returns the last word.
     */
    commitLine() {
        const lastWord = this.getCurrentWord();
        this.lines.push(this.currentText);
        this.currentText = '';
        this._render();
        if (lastWord) {
            this._updateStatus('You typed: ' + lastWord.toUpperCase());
        } else {
            this._updateStatus('New line');
        }
        return lastWord;
    },

    /**
     * Re-render the text display from data model.
     */
    _render() {
        var visibleLines = this.lines.slice(-this.maxVisibleLines);

        var html = '';
        for (var i = 0; i < visibleLines.length; i++) {
            html += '<div class="completed-line">' + this._escapeHTML(visibleLines[i]) + '</div>';
        }

        this.displayEl.innerHTML = html;

        var lineSpan = document.createElement('span');
        lineSpan.id = 'current-line';
        lineSpan.className = 'current-line';
        lineSpan.textContent = this.currentText;

        var cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.setAttribute('aria-hidden', 'true');
        cursor.textContent = '|';

        this.displayEl.appendChild(lineSpan);
        this.displayEl.appendChild(cursor);

        this.displayEl.scrollTop = this.displayEl.scrollHeight;
    },

    _updateStatus(text) {
        if (this.statusTextEl) {
            this.statusTextEl.textContent = text;
        }
    },

    _escapeHTML(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Clear all text and reset.
     */
    clear() {
        this.lines = [];
        this.currentText = '';
        this._render();
        this._updateStatus('Type a letter to begin');
    }
};
