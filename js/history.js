/**
 * History.js - Handles rendering, truncation, and expansion for the history list.
 */
const HistoryEngine = {
    isExpanded: false,
    initialLimit: 4,

    init: function() {
        const expandBtn = document.getElementById('expand-history-btn');
        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                this.isExpanded = true;
                this.render();
            });
        }
    },

    render: function() {
        const chapters = Analytics.getChapterSummary();
        const container = document.getElementById('chapters-list');
        const expansionUI = document.getElementById('history-expansion');
        if (!container) return;
        
        container.innerHTML = '';
        if (chapters.length === 0) {
            container.innerHTML = '<div class="bg-gray-900 rounded-lg p-6 flex justify-center items-center"><p class="text-gray-500 text-sm">No history tracked yet</p></div>';
            if (expansionUI) expansionUI.classList.add('hidden');
            return;
        }

        // Determine which items to show
        const showExpansion = !this.isExpanded && chapters.length > this.initialLimit;
        const itemsToShow = this.isExpanded ? chapters : chapters.slice(0, this.initialLimit);

        if (expansionUI) {
            if (showExpansion) {
                expansionUI.classList.remove('hidden');
            } else {
                expansionUI.classList.add('hidden');
            }
        }

        const maxReps = chapters[0].reps || 1;
        itemsToShow.forEach(ch => {
            const pct = Math.max(2, (ch.reps / maxReps) * 100);
            const timeStr = ch.time > 0 ? `${(ch.time / 60).toFixed(0)}m` : '';
            const sourcesStr = ch.sources && ch.sources.length > 0 ? ch.sources.join(', ') : '';
            
            const id = ChapterValidator.identify(ch.name);
            const subject = id ? id.subject : "Custom";
            const color = ChapterValidator.getSubjectColor(subject);
            
            const item = document.createElement('div');
            item.className = 'history-item bg-[#1C1C1C] border border-white/5 rounded-[14px] p-4 flex flex-col gap-2 relative overflow-hidden select-none cursor-pointer';
            item.innerHTML = `
                <div class="absolute left-0 top-0 bottom-0 pointer-events-none transition-all" style="width: ${pct}%; background-color: ${color}12;"></div>
                <div class="flex justify-between items-center relative z-10 w-full">
                    <div class="flex flex-col gap-1">
                        <span class="text-sm text-white capitalize font-bold tracking-wide">${escapeHTML(ch.name)}</span>
                        <div class="flex items-center gap-2">
                            ${timeStr ? `<span class="text-[9px] text-gray-400 uppercase tracking-widest font-black">${timeStr} solved</span>` : ''}
                            ${sourcesStr ? `<span class="text-[9px] text-gray-500 uppercase tracking-[0.15em] font-bold border-l border-white/10 pl-2">${escapeHTML(sourcesStr)}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="text-xs text-gray-400 font-bold reps-display bg-white/5 px-2.5 py-1 rounded-[6px] border border-white/5">${ch.reps} qs</span>
                        <div class="delete-confirm-btn hidden">
                            <button class="bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg active:scale-95 transition-all">Delete</button>
                        </div>
                    </div>
                </div>
                <div class="absolute bottom-0 left-0 h-1 bg-red-600 hold-progress-bar pointer-events-none" style="width: 0%;"></div>
            `;

            // Gesture management state variables
            let startX = 0;
            let startY = 0;
            let holdTimeout = null;
            let holdCompleted = false;
            let allowDeleteClick = false;

            const progressBar = item.querySelector('.hold-progress-bar');
            const repsDisplay = item.querySelector('.reps-display');
            const deleteConfirm = item.querySelector('.delete-confirm-btn');
            const deleteBtn = item.querySelector('.delete-confirm-btn button');

            const handleStart = (e) => {
                // Prevent mouse events if touch is active
                if (e.type === 'mousedown' && 'ontouchstart' in window) return;

                const touch = e.touches ? e.touches[0] : e;
                startX = touch.clientX;
                startY = touch.clientY;
                holdCompleted = false;
                allowDeleteClick = false;

                if (progressBar) {
                    progressBar.style.transition = 'width 1s linear';
                    progressBar.style.width = '100%';
                }

                holdTimeout = setTimeout(() => {
                    holdCompleted = true;
                    if (repsDisplay) repsDisplay.classList.add('hidden');
                    if (deleteConfirm) deleteConfirm.classList.remove('hidden');
                    if (progressBar) {
                        progressBar.style.transition = 'none';
                        progressBar.style.width = '0%';
                    }
                }, 1000);
            };

            const handleMove = (e) => {
                if (!holdTimeout || holdCompleted) return;
                const touch = e.touches ? e.touches[0] : e;
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;
                if (Math.sqrt(dx * dx + dy * dy) > 10) {
                    handleCancel();
                }
            };

            const handleEnd = () => {
                if (holdTimeout) {
                    clearTimeout(holdTimeout);
                    holdTimeout = null;
                }

                if (progressBar && !holdCompleted) {
                    progressBar.style.transition = 'none';
                    progressBar.style.width = '0%';
                }

                if (holdCompleted) {
                    // Finger is lifted, now enable clicking delete
                    setTimeout(() => {
                        allowDeleteClick = true;
                    }, 50);
                }
            };

            const handleCancel = () => {
                if (holdTimeout) {
                    clearTimeout(holdTimeout);
                    holdTimeout = null;
                }
                if (progressBar) {
                    progressBar.style.transition = 'none';
                    progressBar.style.width = '0%';
                }
                holdCompleted = false;
                allowDeleteClick = false;
            };

            // Bind touch and mouse events
            item.addEventListener('touchstart', handleStart, { passive: true });
            item.addEventListener('touchmove', handleMove, { passive: true });
            item.addEventListener('touchend', handleEnd, { passive: true });
            item.addEventListener('touchcancel', handleCancel, { passive: true });

            item.addEventListener('mousedown', handleStart);
            item.addEventListener('mousemove', handleMove);
            item.addEventListener('mouseup', handleEnd);
            item.addEventListener('mouseleave', handleCancel);

            // Bind click to confirm delete
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (allowDeleteClick) {
                        HistoryEngine.delete(ch.name, deleteBtn);
                    }
                });
            }

            // Revert view if user clicks elsewhere on the item card
            item.addEventListener('click', (e) => {
                if (deleteConfirm && !deleteConfirm.classList.contains('hidden') && allowDeleteClick) {
                    if (deleteBtn && !deleteBtn.contains(e.target)) {
                        deleteConfirm.classList.add('hidden');
                        if (repsDisplay) repsDisplay.classList.remove('hidden');
                        holdCompleted = false;
                        allowDeleteClick = false;
                    }
                }
            });

            container.appendChild(item);
        });
    },

    delete: function(name, btn) {
        const item = btn.closest('.history-item');
        item.style.opacity = '0';
        item.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            window.deleteChapterData(name, () => {
                StatsController.refreshAll();
            });
        }, 200);
    }
};

window.HistoryEngine = HistoryEngine;