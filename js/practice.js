/**
 * Random Practice Logic for STUDY.LOG
 * Picks a singular chapter and N unique question numbers between X and Y.
 */

const PracticeController = {
    init: function() {
        this.rollBtn = document.getElementById('roll-btn');
        this.resultsContainer = document.getElementById('results-container');
        this.minInput = document.getElementById('min-q');
        this.maxInput = document.getElementById('max-q');
        this.countInput = document.getElementById('set-count');
        this.modeInputs = document.getElementsByName('practice-mode');

        this.rollBtn.addEventListener('click', () => this.generatePractice());

        // Restore active session if it exists
        this.restoreSession();
    },

    restoreSession: function() {
        const saved = sessionStorage.getItem('practice_session');
        if (saved) {
            try {
                const session = JSON.parse(saved);
                this.renderResult(session.subject, session.chapter, session.questions, session.mode, session.checked || []);
            } catch (e) {
                console.error("Failed to restore practice session", e);
            }
        }
    },

    saveSession: function(subject, chapter, questions, mode, checked) {
        const session = { subject, chapter, questions, mode, checked };
        sessionStorage.setItem('practice_session', JSON.stringify(session));
    },

    generatePractice: function() {
        // Trigger dice animation
        this.rollBtn.classList.remove('dice-rolling');
        void this.rollBtn.offsetWidth; 
        this.rollBtn.classList.add('dice-rolling');

        const x = parseInt(this.minInput.value) || 1;
        const y = parseInt(this.maxInput.value) || 100;
        const countValue = parseInt(this.countInput.value) || 5;

        if (isNaN(countValue) || countValue < 1) {
            alert("Please enter a valid set size of at least 1.");
            return;
        }

        if (x > y) {
            alert("Start number cannot be greater than end number.");
            return;
        }

        const rangeSize = y - x + 1;
        if (countValue > rangeSize) {
            alert(`Cannot pick ${countValue} unique questions from a range of ${rangeSize}.`);
            return;
        }

        // Determine Mode
        let mode = 'weighted';
        this.modeInputs.forEach(input => {
            if (input.checked) mode = input.value;
        });

        // Pick ONE chapter based on mode
        let selection;
        if (mode === 'weighted') {
            selection = this.getWeightedRandomChapter();
        } else {
            selection = this.getFullRandomChapter();
        }
        
        const { subject, chapter } = selection;

        // Pick N unique questions between X and Y
        const questions = this.pickUniqueRandoms(x, y, countValue);
        
        // Render the result and save session
        this.renderResult(subject, chapter, questions, mode, []);
        this.saveSession(subject, chapter, questions, mode, []);
    },

    getFullRandomChapter: function() {
        const subjects = Object.keys(ChapterDatabase);
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const chapters = ChapterDatabase[subject];
        const chapter = chapters[Math.floor(Math.random() * chapters.length)];
        return { subject, chapter };
    },

    getWeightedRandomChapter: function() {
        const pool = [];
        const meanWeight = 5; // Default for unmapped chapters

        for (const [subject, chapters] of Object.entries(ChapterDatabase)) {
            for (const chapter of chapters) {
                let weight = meanWeight;
                const chapterLower = chapter.toLowerCase();

                for (const [key, val] of Object.entries(JEE_WEIGHTAGE)) {
                    if (chapterLower.includes(key.toLowerCase()) || key.toLowerCase().includes(chapterLower)) {
                        weight = val;
                        break;
                    }
                }

                pool.push({ subject, chapter, weight });
            }
        }

        const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of pool) {
            if (random < item.weight) {
                return item;
            }
            random -= item.weight;
        }

        return pool[0]; // Fallback
    },

    pickUniqueRandoms: function(min, max, count) {
        const pool = [];
        for (let i = min; i <= max; i++) {
            pool.push(i);
        }

        const selected = [];
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            selected.push(pool.splice(randomIndex, 1)[0]);
        }

        return selected.sort((a, b) => a - b);
    },

    renderResult: function(subject, chapter, questions, mode, checkedIndices) {
        const color = ChapterValidator.getSubjectColor(subject);
        this.resultsContainer.innerHTML = '';
        
        const board = document.createElement('div');
        board.className = 'result-card flex flex-col gap-5 w-full';

        board.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="subject-badge font-bold" style="background-color: ${color}20; color: ${color}">${escapeHTML(subject)}</span>
                <span class="text-[9px] text-gray-500 uppercase tracking-widest font-black">${mode === 'weighted' ? 'Weighted Set' : 'Random Set'}</span>
            </div>
            
            <div class="space-y-1">
                <span class="card-title">Target Chapter</span>
                <h2 class="text-xl font-bold text-white leading-tight uppercase">${escapeHTML(chapter)}</h2>
            </div>

            <!-- Progress widget -->
            <div class="space-y-2 py-3 border-t border-b border-white/5">
                <div class="flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                    <span>Session Progress</span>
                    <span id="practice-progress-text">0 / ${questions.length} completed</span>
                </div>
                <div class="practice-progress-track">
                    <div id="practice-progress-fill" class="practice-progress-fill"></div>
                </div>
            </div>

            <div class="space-y-2">
                <span class="card-title">Practice List</span>
                <div class="flex flex-col gap-2 w-full">
                    ${questions.map((q, idx) => `
                        <div class="practice-q-row ${checkedIndices.includes(idx) ? 'checked' : ''}" data-idx="${idx}">
                            <div class="practice-checkbox">
                                <span class="material-symbols-outlined select-none text-[12px] font-black">check</span>
                            </div>
                            <span class="practice-q-text">Question ${q}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.resultsContainer.appendChild(board);

        // Bind interactive events
        const qRows = board.querySelectorAll('.practice-q-row');
        const progressFill = board.querySelector('#practice-progress-fill');
        const progressText = board.querySelector('#practice-progress-text');

        const updateProgress = () => {
            const checkedRows = board.querySelectorAll('.practice-q-row.checked');
            const checkedCount = checkedRows.length;
            const pct = (checkedCount / questions.length) * 100;
            
            if (progressFill) progressFill.style.width = `${pct}%`;
            if (progressText) progressText.textContent = `${checkedCount} / ${questions.length} completed`;

            // Collect active checked indices
            const activeChecked = [];
            qRows.forEach(row => {
                if (row.classList.contains('checked')) {
                    activeChecked.push(parseInt(row.dataset.idx));
                }
            });

            this.saveSession(subject, chapter, questions, mode, activeChecked);
        };

        // Bind clicks to toggle rows
        qRows.forEach(row => {
            row.addEventListener('click', () => {
                row.classList.toggle('checked');
                updateProgress();
            });
        });

        // Init progress bar state on render
        updateProgress();
    }
};

document.addEventListener('DOMContentLoaded', () => PracticeController.init());
