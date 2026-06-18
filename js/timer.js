/**
 * Standalone Material 3 Expressive Timer Module
 */
const M3Timer = {
    totalSeconds: 1500, // 25 minutes default
    secondsRemaining: 1500,
    timerInterval: null,
    timerState: 'idle', // 'idle' | 'running' | 'paused' | 'finished'
    soundEnabled: true,

    init: function() {
        this.timerToggleBtn = document.getElementById('timer-toggle');
        this.timerResetBtn = document.getElementById('timer-reset');
        this.timerSoundToggleBtn = document.getElementById('timer-sound-toggle');
        this.timerDisplay = document.getElementById('timer-display');
        this.timerStatus = document.getElementById('timer-status');
        this.customSlider = document.getElementById('timer-custom-slider');
        this.customMinutesLabel = document.getElementById('custom-minutes-label');
        this.presetBtns = document.querySelectorAll('.preset-btn');
        this.addMinBtn = document.getElementById('timer-add-min');
        this.subMinBtn = document.getElementById('timer-sub-min');

        if (this.timerToggleBtn) this.timerToggleBtn.addEventListener('click', () => this.toggle());
        if (this.timerResetBtn) this.timerResetBtn.addEventListener('click', () => this.reset());
        if (this.timerSoundToggleBtn) this.timerSoundToggleBtn.addEventListener('click', () => this.toggleSound());
        if (this.addMinBtn) this.addMinBtn.addEventListener('click', () => this.adjustMinutes(1));
        if (this.subMinBtn) this.subMinBtn.addEventListener('click', () => this.adjustMinutes(-1));

        if (this.customSlider) {
            this.customSlider.addEventListener('input', (e) => {
                const mins = parseInt(e.target.value);
                if (this.timerState === 'idle') {
                    this.setDuration(mins * 60);
                } else {
                    this.customMinutesLabel.textContent = `${mins} mins`;
                }
                this.clearPresetHighlights();
            });
        }

        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const seconds = parseInt(btn.getAttribute('data-time'));
                this.setDuration(seconds);
                this.clearPresetHighlights();
                btn.classList.add('active-preset');
                if (this.customSlider) {
                    this.customSlider.value = Math.floor(seconds / 60);
                }
            });
        });

        this.updateDisplay();
    },

    toggle: function() {
        if (this.timerState === 'running') {
            this.pause();
        } else {
            this.start();
        }
    },

    start: function() {
        if (this.timerState === 'finished') {
            this.reset();
        }
        
        this.timerState = 'running';
        this.updateDisplay();
        
        // Pulse animation on the dial wrapper
        const dial = document.querySelector('.timer-svg');
        if (dial) dial.classList.add('timer-running-pulse');

        this.timerInterval = setInterval(() => {
            this.tick();
        }, 1000);
    },

    pause: function() {
        this.timerState = 'paused';
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        
        const dial = document.querySelector('.timer-svg');
        if (dial) dial.classList.remove('timer-running-pulse');
        
        this.updateDisplay();
    },

    reset: function() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.timerState = 'idle';
        this.secondsRemaining = this.totalSeconds;
        
        const dial = document.querySelector('.timer-svg');
        if (dial) dial.classList.remove('timer-running-pulse');
        
        this.updateDisplay();
        this.updateProgressRing();
    },

    adjustMinutes: function(amount) {
        const adjustment = amount * 60;
        
        if (this.timerState === 'idle') {
            const newDuration = Math.max(60, this.totalSeconds + adjustment);
            this.setDuration(newDuration);
            if (this.customSlider) {
                this.customSlider.value = Math.floor(newDuration / 60);
            }
        } else {
            this.secondsRemaining = Math.max(0, this.secondsRemaining + adjustment);
            if (this.secondsRemaining === 0) {
                this.onFinished();
            } else {
                this.updateDisplay();
                this.updateProgressRing();
            }
        }
    },

    setDuration: function(seconds) {
        this.totalSeconds = seconds;
        this.secondsRemaining = seconds;
        this.updateDisplay();
        this.updateProgressRing();
        if (this.customMinutesLabel) {
            this.customMinutesLabel.textContent = `${Math.floor(seconds / 60)} mins`;
        }
    },

    clearPresetHighlights: function() {
        this.presetBtns.forEach(btn => btn.classList.remove('active-preset'));
    },

    tick: function() {
        if (this.secondsRemaining > 0) {
            this.secondsRemaining--;
            this.updateDisplay();
            this.updateProgressRing();
            
            if (this.secondsRemaining === 0) {
                this.onFinished();
            }
        }
    },

    onFinished: function() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.timerState = 'finished';
        
        const dial = document.querySelector('.timer-svg');
        if (dial) dial.classList.remove('timer-running-pulse');

        this.updateDisplay();
        this.updateProgressRing();
        this.playAlarm();
    },

    toggleSound: function() {
        this.soundEnabled = !this.soundEnabled;
        if (this.timerSoundToggleBtn) {
            const icon = this.timerSoundToggleBtn.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = this.soundEnabled ? 'volume_up' : 'volume_off';
            }
        }
    },

    playAlarm: function() {
        if (!this.soundEnabled) return;

        // Play synthetic buzzer using Web Audio API (completely offline-compatible)
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (!ctx) return;

            const now = ctx.currentTime;
            
            // Note 1 (A5)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(880, now);
            gain1.gain.setValueAtTime(0.3, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.5);

            // Note 2 (C6)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1046.5, now + 0.15);
            gain2.gain.setValueAtTime(0.3, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.15);
            osc2.stop(now + 0.65);
        } catch (e) {
            console.error("Audio playback error:", e);
        }
    },

    updateDisplay: function() {
        // Format MM:SS
        const mins = Math.floor(this.secondsRemaining / 60);
        const secs = this.secondsRemaining % 60;
        
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        if (this.timerDisplay) this.timerDisplay.textContent = formatted;

        if (this.timerStatus) {
            this.timerStatus.textContent = this.timerState.toUpperCase();
            if (this.timerState === 'finished') {
                this.timerStatus.textContent = 'DONE!';
                this.timerStatus.style.color = '#AAFF00';
            } else {
                this.timerStatus.style.color = '';
            }
        }

        if (this.timerToggleBtn) {
            const icon = this.timerToggleBtn.querySelector('.material-symbols-outlined');
            if (icon) {
                if (this.timerState === 'running') {
                    icon.textContent = 'pause';
                    this.timerToggleBtn.style.backgroundColor = '#00E5FF'; // Morph to Cyan on pause state
                } else {
                    icon.textContent = 'play_arrow';
                    this.timerToggleBtn.style.backgroundColor = ''; // Revert to Accent Lime
                }
            }
        }

        const card = document.querySelector('.timer-card');
        if (card) {
            if (this.timerState === 'running') {
                card.classList.add('timer-running');
            } else {
                card.classList.remove('timer-running');
            }
        }
    },

    updateProgressRing: function() {
        const progressRing = document.querySelector('.timer-progress');
        if (!progressRing) return;

        const circumference = 534; // 2 * PI * 85
        const pct = this.totalSeconds > 0 ? (this.secondsRemaining / this.totalSeconds) : 0;
        const offset = circumference * (1 - pct);
        progressRing.style.strokeDashoffset = offset;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    M3Timer.init();
});
