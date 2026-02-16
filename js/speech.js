/**
 * CVI Type Talker - Speech Module
 * Wraps the Web Speech API for letter-by-letter and word speech.
 */
const CVISpeech = {
    synth: window.speechSynthesis,
    voice: null,
    enabled: true,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,

    /** Number-to-word mapping for speaking digits */
    _numberWords: {
        '0': 'zero', '1': 'one', '2': 'two', '3': 'three',
        '4': 'four', '5': 'five', '6': 'six', '7': 'seven',
        '8': 'eight', '9': 'nine'
    },

    /**
     * Initialize: select an appropriate English voice.
     * Chrome loads voices asynchronously so we wait for the event.
     */
    init() {
        return new Promise((resolve) => {
            const setVoice = () => {
                const voices = this.synth.getVoices();
                this.voice =
                    voices.find(v => v.name.includes('Google US English')) ||
                    voices.find(v => v.lang.startsWith('en') && v.localService) ||
                    voices.find(v => v.lang.startsWith('en')) ||
                    voices[0] || null;
                resolve(this.voice);
            };

            if (this.synth.getVoices().length > 0) {
                setVoice();
            } else {
                this.synth.addEventListener('voiceschanged', setVoice, { once: true });
                setTimeout(() => {
                    if (!this.voice) setVoice();
                }, 1000);
            }
        });
    },

    /**
     * Speak a single letter. Cancels any pending speech first.
     */
    speakLetter(letter) {
        if (!this.enabled || !this.synth) return;
        this.synth.cancel();

        const spokenText = this._charToSpoken(letter);
        const utterance = new SpeechSynthesisUtterance(spokenText);
        if (this.voice) utterance.voice = this.voice;
        utterance.rate = 0.9;
        utterance.pitch = this.pitch;
        utterance.volume = this.volume;

        this.synth.speak(utterance);
    },

    /**
     * Speak a full word. Cancels any pending speech first.
     */
    speakWord(word) {
        if (!this.enabled || !this.synth || !word.trim()) return;
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(word);
        if (this.voice) utterance.voice = this.voice;
        utterance.rate = this.rate;
        utterance.pitch = this.pitch;
        utterance.volume = this.volume;

        this.synth.speak(utterance);
    },

    /**
     * Speak a system message (e.g., "backspace", "new line").
     */
    speakSystem(message) {
        if (!this.enabled || !this.synth) return;
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(message);
        if (this.voice) utterance.voice = this.voice;
        utterance.rate = 1.1;
        utterance.pitch = 0.9;
        utterance.volume = this.volume;

        this.synth.speak(utterance);
    },

    /**
     * Convert a character to its spoken representation.
     */
    _charToSpoken(char) {
        if (/[a-zA-Z]/.test(char)) {
            return char.toUpperCase();
        }
        if (this._numberWords[char]) {
            return this._numberWords[char];
        }
        return char;
    },

    /** Stop all speech immediately. */
    stop() {
        if (this.synth) this.synth.cancel();
    },

    /** Check if Web Speech API is supported. */
    isSupported() {
        return 'speechSynthesis' in window;
    }
};
