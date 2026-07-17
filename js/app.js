document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    
    const questionsInput = document.getElementById('questions-input');
    const chapterInput = document.getElementById('chapter-input');
    const timeInput = document.getElementById('time-input');
    const sourceInput = document.getElementById('source-input');
    const submitBtn = document.getElementById('submit-btn');
    const chapterSuggestions = document.getElementById('chapter-suggestions');
    const sourceSuggestions = document.getElementById('source-suggestions');

    if (!submitBtn) {
        console.error("Submit button not found!");
        return;
    }

    const levelInput = document.getElementById('level-input');

    // --- Clear lingering '0' on focus ---
    [questionsInput, timeInput].forEach(input => {
        if (input) {
            input.addEventListener('focus', () => {
                if (input.value === '0') {
                    input.value = '';
                }
            });
            input.addEventListener('blur', () => {
                if (input.value.trim() === '') {
                    input.value = '0';
                }
            });
        }
    });

    // --- Autofill Logic ---
    let selectedSuggestionIndex = -1;
    let currentSuggestions = [];

    function updateSuggestions() {
        const query = chapterInput.value.trim().toLowerCase();
        if (query.length < 2) {
            chapterSuggestions.classList.add('hidden');
            return;
        }

        const allChapters = ChapterValidator.getAllChapters();
        currentSuggestions = allChapters
            .filter(ch => ch.toLowerCase().includes(query))
            .slice(0, 5); // Limit to top 5 suggestions

        if (currentSuggestions.length > 0) {
            renderSuggestions();
            chapterSuggestions.classList.remove('hidden');
        } else {
            chapterSuggestions.classList.add('hidden');
        }
    }

    function renderSuggestions() {
        chapterSuggestions.innerHTML = currentSuggestions.map((ch, index) => `
            <div class="suggestion-item px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-gray-900 last:border-0 ${index === selectedSuggestionIndex ? 'bg-white/10' : ''}" data-index="${index}">
                <div class="flex justify-between items-center">
                    <span class="text-white font-medium">${ch}</span>
                    <span class="text-[10px] text-gray-500 uppercase tracking-widest">${ChapterValidator.identify(ch).subject}</span>
                </div>
            </div>
        `).join('');

        // Add click listeners to items
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent input blur before click
                selectSuggestion(parseInt(item.dataset.index));
            });
        });
    }

    function selectSuggestion(index) {
        if (index >= 0 && index < currentSuggestions.length) {
            chapterInput.value = currentSuggestions[index];
            chapterSuggestions.classList.add('hidden');
            selectedSuggestionIndex = -1;
            // Move focus to next input (Duration)
            timeInput.focus();
        }
    }

    chapterInput.addEventListener('input', () => {
        selectedSuggestionIndex = -1;
        updateSuggestions();
    });

    chapterInput.addEventListener('keydown', (e) => {
        if (chapterSuggestions.classList.contains('hidden')) return;

        if (e.key === 'Tab' || e.key === 'Enter') {
            // If user has highlighted one with arrows, use that. 
            // Otherwise, if there is at least one suggestion, use the first one.
            const indexToSelect = selectedSuggestionIndex >= 0 ? selectedSuggestionIndex : 0;
            if (currentSuggestions.length > 0) {
                e.preventDefault();
                selectSuggestion(indexToSelect);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedSuggestionIndex = (selectedSuggestionIndex + 1) % currentSuggestions.length;
            renderSuggestions();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedSuggestionIndex = (selectedSuggestionIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
            renderSuggestions();
        } else if (e.key === 'Escape') {
            chapterSuggestions.classList.add('hidden');
        }
    });

    chapterInput.addEventListener('blur', () => {
        setTimeout(() => chapterSuggestions.classList.add('hidden'), 200);
    });
 
    // --- Source Material Autofill Logic ---
    const SOURCE_PRESETS = {
        'mains': [
            'NCERT Physics', 'NCERT Chemistry', 'NCERT Maths', 'HCV', 'DC Pandey', 
            'RD Sharma', 'SK Goyal', 'OP Tandon', 'P Bahadur', 'RC Mukherjee', 
            'Arihant Master Resource', 'Modules', 'Kota Material', 'PYQs'
        ],
        'advanced': [
            'HCV', 'DC Pandey', 'Cengage', 'Irodov', 'Physics Galaxy', 'Pathfinder', 
            'N Avasthi', 'MS Chauhan', 'VK Jaiswal', 'JD Lee', 'Morrison and Boyd', 
            'Himanshu Pandey', 'Wileys Solomons', 'Blackbook', 'A Das Gupta', 
            'Play with Graphs', 'Sameer Bansal', 'SL Loney', 'GN Berman', 
            'Modules', 'Kota Material', 'PYQs'
        ]
    };
 
    let selectedSourceIndex = -1;
    let currentSourceSuggestions = [];
 
    function updateSourceSuggestions() {
        const query = sourceInput.value.trim().toLowerCase();
        if (query.length < 1) {
            sourceSuggestions.classList.add('hidden');
            return;
        }
 
        const activeLevel = (levelInput && levelInput.value) || 'mains';
        const presets = SOURCE_PRESETS[activeLevel] || [];
        
        let custom = [];
        try {
            const data = loadData();
            custom = data.customSources || [];
        } catch(e) {
            console.error(e);
        }
 
        const combined = [...presets];
        custom.forEach(c => {
            if (!combined.some(p => p.toLowerCase() === c.toLowerCase())) {
                combined.push(c);
            }
        });
 
        currentSourceSuggestions = combined
            .filter(src => src.toLowerCase().includes(query))
            .slice(0, 5);
 
        if (currentSourceSuggestions.length > 0) {
            renderSourceSuggestions();
            sourceSuggestions.classList.remove('hidden');
        } else {
            sourceSuggestions.classList.add('hidden');
        }
    }
 
    function renderSourceSuggestions() {
        sourceSuggestions.innerHTML = currentSourceSuggestions.map((src, index) => `
            <div class="source-suggestion-item px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-gray-900 last:border-0 ${index === selectedSourceIndex ? 'bg-white/10' : ''}" data-index="${index}">
                <div class="flex justify-between items-center">
                    <span class="text-white font-medium">${src}</span>
                </div>
            </div>
        `).join('');
 
        document.querySelectorAll('.source-suggestion-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                selectSourceSuggestion(parseInt(item.dataset.index));
            });
        });
    }
 
    function selectSourceSuggestion(index) {
        if (index >= 0 && index < currentSourceSuggestions.length) {
            sourceInput.value = currentSourceSuggestions[index];
            sourceSuggestions.classList.add('hidden');
            selectedSourceIndex = -1;
            submitBtn.focus();
        }
    }
 
    sourceInput.addEventListener('input', () => {
        selectedSourceIndex = -1;
        updateSourceSuggestions();
    });
 
    sourceInput.addEventListener('keydown', (e) => {
        if (sourceSuggestions.classList.contains('hidden')) return;
 
        if (e.key === 'Tab' || e.key === 'Enter') {
            const indexToSelect = selectedSourceIndex >= 0 ? selectedSourceIndex : 0;
            if (currentSourceSuggestions.length > 0) {
                e.preventDefault();
                selectSourceSuggestion(indexToSelect);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedSourceIndex = (selectedSourceIndex + 1) % currentSourceSuggestions.length;
            renderSourceSuggestions();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedSourceIndex = (selectedSourceIndex - 1 + currentSourceSuggestions.length) % currentSourceSuggestions.length;
            renderSourceSuggestions();
        } else if (e.key === 'Escape') {
            sourceSuggestions.classList.add('hidden');
        }
    });
 
    sourceInput.addEventListener('blur', () => {
        setTimeout(() => sourceSuggestions.classList.add('hidden'), 200);
    });
 
    // --- Submit Logic ---

    function showToast(message, isError = false) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast-msg transition-all duration-300 ${isError ? 'toast-msg-error' : ''}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    submitBtn.addEventListener('click', () => {
        const reps = parseInt(questionsInput.value) || 0;
        const chapter = chapterInput.value;
        const timeMinutes = parseInt(timeInput.value) || 0;
        const rawSource = sourceInput.value.trim();
        const timeSeconds = timeMinutes * 60;
 
        if (reps <= 0) {
            showToast("Quantity must be greater than 0", true);
            return;
        }
 
        if (timeMinutes <= 0) {
            showToast("Duration must be greater than 0", true);
            return;
        }
 
        if (!chapter.trim()) {
            showToast("Please enter a focus area", true);
            return;
        }
 
        if (!rawSource) {
            showToast("Please enter a source material", true);
            return;
        }
 
        const identified = ChapterValidator.identify(chapter);
        const finalChapterName = identified ? identified.chapter : (chapter.trim() || 'Uncategorized');
 
        // Normalize source casing against presets and custom sources
        let finalSource = rawSource;
        const activeLevel = (levelInput && levelInput.value) || 'mains';
        const presets = SOURCE_PRESETS[activeLevel] || [];
        const matchingPreset = presets.find(p => p.toLowerCase() === finalSource.toLowerCase());
        if (matchingPreset) {
            finalSource = matchingPreset;
        } else {
            try {
                const data = loadData();
                const matchingCustom = (data.customSources || []).find(c => c.toLowerCase() === finalSource.toLowerCase());
                if (matchingCustom) {
                    finalSource = matchingCustom;
                }
            } catch(e) {}
        }
 
        updateStats(reps, timeSeconds, finalChapterName, finalSource, levelInput ? levelInput.value : 'mains');
        
        // Save to custom sources if it's a new custom source
        if (typeof window.addCustomSource === 'function') {
            window.addCustomSource(finalSource);
        }
        
        showToast("Progress Saved");
        
        // Reset UI
        questionsInput.value = '0';
        chapterInput.value = '';
        timeInput.value = '0';
        sourceInput.value = '';
    });
});