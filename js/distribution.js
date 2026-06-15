/**
 * Subject & Chapter Distribution Engine for STUDY.LOG
 */

const Distribution = {
    mode: 'subjects',
    sortBy: 'reps-desc',

    render: function() {
        const container = document.getElementById('subject-distribution');
        if (!container) return;

        if (this.mode === 'subjects') {
            this.renderSubjects(container);
        } else {
            this.renderChapters(container);
        }
    },

    renderSubjects: function(container) {
        const chapters = Analytics.getChapterSummary();
        const distribution = {
            "Physics": { reps: 0, time: 0 },
            "Chemistry": { reps: 0, time: 0 },
            "Mathematics": { reps: 0, time: 0 },
            "Custom": { reps: 0, time: 0 }
        };

        chapters.forEach(ch => {
            const id = ChapterValidator.identify(ch.name);
            const subject = id ? id.subject : "Custom";
            if (!distribution[subject]) distribution[subject] = { reps: 0, time: 0 };
            distribution[subject].reps += ch.reps;
            distribution[subject].time += ch.time;
        });

        const totalReps = Object.values(distribution).reduce((sum, d) => sum + d.reps, 0) || 1;
        const subjects = ["Physics", "Chemistry", "Mathematics", "Custom"];
        
        let html = '';
        subjects.forEach(sub => {
            const counts = distribution[sub];
            if (counts.reps === 0 && sub === "Custom") return;
            const pct = (counts.reps / totalReps) * 100;
            const color = ChapterValidator.getSubjectColor(sub);
            html += this.createSimpleProgressBarHTML(sub, pct, color, counts.reps, counts.time);
        });

        container.innerHTML = html || '<p class="text-gray-500 text-center py-4">No data available</p>';
    },

    renderChapters: function(container) {
        const trackedChapters = Analytics.getChapterSummary();
        const MASTERY_GOAL = 150;
        
        // 1. Get all known chapters from the validator
        const allChapters = ChapterValidator.getAllChapters(); 
        
        // 2. Map tracked data
        let chapters = allChapters.map(name => {
            const found = trackedChapters.find(c => c.name.toLowerCase() === name.toLowerCase());
            return found || { name, reps: 0, time: 0, sources: [] };
        });
        
        // 3. Sorting
        if (this.sortBy === 'reps-desc') chapters.sort((a, b) => b.reps - a.reps);
        else if (this.sortBy === 'reps-asc') chapters.sort((a, b) => a.reps - b.reps);
        else if (this.sortBy === 'weight-desc') {
            chapters.sort((a, b) => {
                const getWeight = (name) => {
                    const normalized = name.toLowerCase();
                    for (let key in JEE_WEIGHTAGE) {
                        if (normalized.includes(key)) return JEE_WEIGHTAGE[key];
                    }
                    return 0;
                };
                return getWeight(b.name) - getWeight(a.name);
            });
        }
        
        const listToRender = (this.sortBy === 'weight-desc') ? chapters : chapters.slice(0, 10);
        
        const rotateColors = ["#E87060", "#7BBFDF", "#B8E04A", "#8E9E60", "#5EB8A0", "#E8943A", "#EBD94A"];
        let html = '';
        listToRender.forEach((ch, index) => {
            const pct = Math.min(100, (ch.reps / MASTERY_GOAL) * 100);
            const color = rotateColors[index % rotateColors.length];
            html += this.createMasteryProgressBarHTML(ch.name, pct, color, ch.reps, ch.time, MASTERY_GOAL, ch.sources);
        });

        container.innerHTML = html || '<p class="text-gray-500 text-center py-4">No data available</p>';
    },

    createSimpleProgressBarHTML: function(label, pct, color, reps, time) {
        return `
            <div class="space-y-2 mb-4">
                <div class="flex justify-between items-end">
                    <span class="text-[11px] font-bold uppercase tracking-widest text-gray-400 truncate pr-4">${escapeHTML(label)}</span>
                    <span class="text-xs font-bold text-white">${pct.toFixed(0)}%</span>
                </div>
                <div class="w-full h-2 bg-[var(--surface-alt)] rounded-full overflow-hidden border border-white/5">
                    <div class="h-full transition-all duration-[1000ms] ease-out rounded-full" 
                         style="width: ${pct}%; background-color: ${color};">
                    </div>
                </div>
            </div>
        `;
    },

    createMasteryProgressBarHTML: function(label, pct, color, reps, time, goal, sources = []) {
        const sourcesStr = sources && sources.length > 0 ? sources.join(', ') : '';
        return `
            <div class="space-y-3 mb-6">
                <div class="flex justify-between items-end">
                    <span class="text-[11px] font-bold uppercase tracking-widest text-gray-400 truncate pr-4">${escapeHTML(label)}</span>
                    <span class="text-xs font-black text-white">${reps}/${goal}</span>
                </div>
                <div class="w-full h-3 bg-[var(--surface-alt)] rounded-full overflow-hidden border border-white/5">
                    <div class="h-full transition-all duration-[1500ms] ease-out rounded-full" 
                         style="width: ${pct}%; background-color: ${color}; box-shadow: 0 0 8px ${color}60;">
                    </div>
                </div>
                <div class="flex justify-between text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                    <div class="flex items-center gap-2">
                        <span>${reps} qs</span>
                        ${sourcesStr ? `<span class="text-gray-600 border-l border-white/5 pl-2 font-black">${escapeHTML(sourcesStr)}</span>` : ''}
                    </div>
                    <span>${(time / 3600).toFixed(1)}h</span>
                </div>
            </div>
        `;
    }
};

window.Distribution = Distribution;