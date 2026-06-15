document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    
    const questionsInput = document.getElementById('questions-input');
    const chapterInput = document.getElementById('chapter-input');
    const timeInput = document.getElementById('time-input');
    const sourceInput = document.getElementById('source-input');
    const submitBtn = document.getElementById('submit-btn');
    const chapterSuggestions = document.getElementById('chapter-suggestions');

    if (!submitBtn) {
        console.error("Submit button not found!");
        return;
    }

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
        const source = sourceInput.value;
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

        const identified = ChapterValidator.identify(chapter);
        const finalChapterName = identified ? identified.chapter : (chapter.trim() || 'Uncategorized');

        updateStats(reps, timeSeconds, finalChapterName, source);
        showToast("Progress Saved");
        
        // Reset UI
        questionsInput.value = '0';
        chapterInput.value = '';
        timeInput.value = '0';
        sourceInput.selectedIndex = 0;
    });
});