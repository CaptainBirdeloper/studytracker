/**
 * Settings logic for STUDY.LOG
 */

const SettingsController = {
    init: function() {
        this.exportBtn = document.getElementById('export-btn');
        this.importBtn = document.getElementById('import-btn');
        this.importInput = document.getElementById('import-input');
        this.clearBtn = document.getElementById('clear-btn');
        this.fontSizeSlider = document.getElementById('font-size-slider');
        this.fontSizeVal = document.getElementById('font-size-val');
        this.fontFamilySelect = document.getElementById('font-family-select');
        this.customFontContainer = document.getElementById('custom-font-container');
        this.customFontInput = document.getElementById('custom-font-input');

        // Load current settings into UI
        const data = loadData();
        const settings = data.settings;
        
        this.fontSizeSlider.value = settings.fontSize;
        this.fontSizeVal.textContent = settings.fontSize;

        // Determine if custom font is in use
        const standardFonts = ["'Inter', sans-serif", "'JetBrains Mono', monospace", "'Roboto', sans-serif", "'Playfair Display', serif", "system-ui, sans-serif"];
        if (standardFonts.includes(settings.fontFamily)) {
            this.fontFamilySelect.value = settings.fontFamily;
        } else {
            this.fontFamilySelect.value = "custom";
            this.customFontInput.value = settings.fontFamily;
            this.customFontContainer.classList.remove('hidden');
        }

        this.geminiKeyInput = document.getElementById('gemini-key-input');
        this.saveKeyBtn = document.getElementById('save-key-btn');
        this.saveKeyFeedback = document.getElementById('save-key-feedback');

        if (this.geminiKeyInput) {
            this.geminiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
        }

        this.bindEvents();
    },

    bindEvents: function() {
        this.exportBtn.addEventListener('click', () => this.exportData());
        this.importBtn.addEventListener('click', () => this.importInput.click());
        this.importInput.addEventListener('change', (e) => this.importData(e));
        this.clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure? This will delete all your study history and settings permanently.')) {
                clearAllData();
            }
        });

        this.fontSizeSlider.addEventListener('input', (e) => {
            const size = e.target.value;
            this.fontSizeVal.textContent = size;
            this.updateSettings();
        });

        this.fontFamilySelect.addEventListener('change', () => {
            if (this.fontFamilySelect.value === 'custom') {
                this.customFontContainer.classList.remove('hidden');
            } else {
                this.customFontContainer.classList.add('hidden');
                this.updateSettings();
            }
        });

        this.customFontInput.addEventListener('input', () => {
            this.updateSettings();
        });

        if (this.saveKeyBtn && this.geminiKeyInput) {
            this.saveKeyBtn.addEventListener('click', () => {
                const key = this.geminiKeyInput.value.trim();
                localStorage.setItem('gemini_api_key', key);
                localStorage.removeItem('gemini_ai_advice_hash'); // invalidate cache
                
                if (this.saveKeyFeedback) {
                    this.saveKeyFeedback.classList.remove('hidden');
                    setTimeout(() => {
                        this.saveKeyFeedback.classList.add('hidden');
                    }, 2000);
                }
            });
        }
    },

    updateSettings: function() {
        let family = this.fontFamilySelect.value;
        if (family === 'custom') {
            family = this.customFontInput.value || "'Inter', sans-serif";
            // Sanitize font family name to prevent CSS injection
            family = family.replace(/[^\w\s\-\'\",]/g, '');
        }

        const settings = {
            fontSize: parseInt(this.fontSizeSlider.value),
            fontFamily: family
        };
        saveSettings(settings);
    },

    exportData: function() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            alert("No data to export.");
            return;
        }

        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 10);
        
        a.href = url;
        a.download = `study_log_backup_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importData: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Basic validation
                if (!importedData.history || typeof importedData.totalReps === 'undefined') {
                    throw new Error("Invalid backup file structure.");
                }

                if (confirm("This will overwrite your current data. Continue?")) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(importedData));
                    window.location.reload();
                }
            } catch (err) {
                alert("Error importing data: " + err.message);
            }
        };
        reader.readAsText(file);
    }
};

document.addEventListener('DOMContentLoaded', () => SettingsController.init());
