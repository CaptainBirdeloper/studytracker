/**
 * AdviceEngine - Generates and manages a carousel of tactical study advice.
 * Supports advanced analytics, visual micro-gauges, and touch swipe gestures.
 */
const AdviceEngine = {
    currentIndex: 0,
    allAdvice: [],

    init: function() {
        const nextBtn = document.getElementById('advice-next');
        const prevBtn = document.getElementById('advice-prev');
        
        if (nextBtn) nextBtn.addEventListener('click', () => this.next());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prev());

        this.bindTouchEvents();
    },

    bindTouchEvents: function() {
        const container = document.getElementById('advice-container');
        if (!container) return;

        let startX = 0;
        let startY = 0;

        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            const diffX = endX - startX;
            const diffY = endY - startY;

            // Only trigger swipe if it is horizontal and meets threshold
            if (Math.abs(diffX) > 60 && Math.abs(diffY) < 40) {
                if (diffX > 0) {
                    this.prev();
                } else {
                    this.next();
                }
            }
        }, { passive: true });
    },

    next: function() {
        if (this.currentIndex < this.allAdvice.length - 1) {
            this.currentIndex++;
            this.showCurrent();
        }
    },

    prev: function() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.showCurrent();
        }
    },

    render: function() {
        const chapters = Analytics.getChapterSummary();
        const densityStats = Analytics.getDensityStats();
        this.allAdvice = [];
        this.currentIndex = 0;

        if (chapters.length === 0) {
            this.showCurrent();
            return;
        }

        // --- 1. Baseline Progress Card (Always Shown) ---
        const totalQs = chapters.reduce((sum, ch) => sum + ch.reps, 0);
        const nextTarget = Math.max(50, Math.ceil((totalQs + 1) / 50) * 50);
        this.allAdvice.push({
            tag: 'Consistency',
            icon: 'analytics',
            text: `You've logged ${totalQs} questions across ${chapters.length} chapters. Keeping this streak alive is the most important factor for JEE success.`,
            type: 'strength',
            metric: {
                type: 'progress',
                val: totalQs,
                target: nextTarget,
                label: 'Milestone Progress'
            }
        });

        // --- 2. Practice Volume Analysis (Balance) ---
        const subjects = ['Physics', 'Mathematics', 'Chemistry'];
        const subCounts = subjects.map(sub => ({
            name: sub,
            reps: densityStats.subjects[sub].reps,
            color: sub === 'Physics' ? '#7BBFDF' : (sub === 'Chemistry' ? '#B8E04A' : '#E8943A')
        }));

        const sortedCounts = [...subCounts].sort((a, b) => a.reps - b.reps);
        const least = sortedCounts[0];
        const most = sortedCounts[2];

        if (least.reps > 0 && least.reps < most.reps * 0.6) {
            this.allAdvice.push({
                tag: 'Study Balance',
                icon: 'balance',
                text: `You're favoring ${most.name} (logged ${most.reps} Qs). Consider doing a session of ${least.name} (only ${least.reps} Qs) to keep your subject-wise preparation balanced.`,
                type: 'warning',
                metric: {
                    type: 'balance',
                    data: subCounts
                }
            });
        }

        // --- 3. Efficiency & Pace Benchmarks ---
        // Physics target: 2-4 min/q. Mathematics target: 3-5 min/q. Chemistry target: 1-2 min/q.
        const benchmarks = {
            'Physics': { targetLabel: '2-4m', min: 2.0, max: 4.0, targetVal: 3.0, thresholdHigh: 4.5, thresholdLow: 2.0, color: '#7BBFDF' },
            'Mathematics': { targetLabel: '3-5m', min: 3.0, max: 5.0, targetVal: 4.0, thresholdHigh: 5.5, thresholdLow: 2.5, color: '#E8943A' },
            'Chemistry': { targetLabel: '1-2m', min: 1.0, max: 2.0, targetVal: 1.5, thresholdHigh: 2.2, thresholdLow: 1.0, color: '#B8E04A' }
        };

        subjects.forEach(sub => {
            const data = densityStats.subjects[sub];
            if (data && data.reps > 0) {
                const density = (data.time / 60) / data.reps;
                const bench = benchmarks[sub];

                if (density > bench.thresholdHigh) {
                    this.allAdvice.push({
                        tag: 'Efficiency Bottleneck',
                        icon: 'speed',
                        text: `Your ${sub} density is ${density.toFixed(1)}m/q (target: ${bench.targetLabel}). Slow solving is good for learning, but try "Timed Sprints" to increase pacing.`,
                        type: 'danger',
                        metric: {
                            type: 'pace',
                            subject: sub,
                            userVal: density,
                            targetVal: bench.targetVal,
                            targetLabel: bench.targetLabel,
                            color: bench.color
                        }
                    });
                } else if (density > 0 && density < bench.thresholdLow) {
                    this.allAdvice.push({
                        tag: 'High Velocity',
                        icon: 'trending_up',
                        text: `You're solving ${sub} at a rapid pace of ${density.toFixed(1)}m/q. Excellent! You're ready for more rigorous materials like Pathfinder or Blackbook.`,
                        type: 'strength',
                        metric: {
                            type: 'pace',
                            subject: sub,
                            userVal: density,
                            targetVal: bench.targetVal,
                            targetLabel: bench.targetLabel,
                            color: bench.color
                        }
                    });
                }
            }
        });

        // --- 4. Week-over-Week Momentum ---
        const weeklyNow = Analytics.getWeeklySummary(0);
        const weeklyLast = Analytics.getWeeklySummary(1);
        const nowReps = weeklyNow.totalReps;
        const lastReps = weeklyLast.totalReps;

        if (lastReps > 0) {
            if (nowReps > lastReps) {
                this.allAdvice.push({
                    tag: 'Positive Momentum',
                    icon: 'rocket_launch',
                    text: `Excellent progression! You've logged ${nowReps} questions this week, up from ${lastReps} questions last week. Keep this acceleration going.`,
                    type: 'strength',
                    metric: {
                        type: 'momentum',
                        now: nowReps,
                        last: lastReps,
                        trend: 'up'
                    }
                });
            } else if (nowReps < lastReps * 0.7) {
                this.allAdvice.push({
                    tag: 'Velocity Drop',
                    icon: 'trending_down',
                    text: `Your practice volume has dropped. You have logged only ${nowReps} questions this week, compared to ${lastReps} questions last week. Solve a quick set to recover momentum!`,
                    type: 'warning',
                    metric: {
                        type: 'momentum',
                        now: nowReps,
                        last: lastReps,
                        trend: 'down'
                    }
                });
            }
        }

        // --- 5. Resource Diversity ---
        const loggedSources = new Set();
        Object.values(loadData().history).forEach(day => {
            if (day.chapters) {
                Object.values(day.chapters).forEach(ch => {
                    if (ch.sources) {
                        ch.sources.forEach(src => loggedSources.add(src.toLowerCase()));
                    }
                });
            }
        });

        const allSources = ['module', 'pathfinder', 'blackbook', 'kota', 'other'];
        const activeSources = allSources.filter(src => loggedSources.has(src));

        if (totalQs > 15 && activeSources.length <= 1) {
            this.allAdvice.push({
                tag: 'Broaden Resources',
                icon: 'auto_stories',
                text: `You've mostly practiced from one resource. For a top JEE rank, exposure to diverse question styles is key. Try alternate materials like Kota or Pathfinder.`,
                type: 'info',
                metric: {
                    type: 'diversity',
                    all: allSources,
                    active: activeSources
                }
            });
        }

        // --- 6. Deep Focus Card (Secondary) ---
        if (chapters.length > 5 && this.allAdvice.length < 4) {
            const topChapter = chapters[0];
            this.allAdvice.push({
                tag: 'Deep Focus',
                icon: 'star',
                text: `You've done the most work in ${topChapter.name.toUpperCase()} (${topChapter.reps} Qs). Ensure you're conducting periodic revisions to cement this foundation.`,
                type: 'info',
                metric: {
                    type: 'progress',
                    val: topChapter.reps,
                    target: Math.max(20, Math.ceil((topChapter.reps + 1) / 10) * 10),
                    label: 'Chapter Depth'
                }
            });
        }

        this.showCurrent();
    },

    showCurrent: function() {
        const container = document.getElementById('advice-container');
        const nav = document.getElementById('advice-nav');
        const page = document.getElementById('advice-page');
        const nextBtn = document.getElementById('advice-next');
        const prevBtn = document.getElementById('advice-prev');

        if (!container) return;

        if (this.allAdvice.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center py-8">Your prep is balanced. Keep logging to unlock more insights!</p>';
            if (nav) nav.classList.add('hidden');
            return;
        }

        if (nav) nav.classList.remove('hidden');
        if (page) page.textContent = `${this.currentIndex + 1} / ${this.allAdvice.length}`;
        
        // Disable buttons at boundaries
        if (nextBtn) nextBtn.disabled = this.currentIndex === this.allAdvice.length - 1;
        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;

        const advice = this.allAdvice[this.currentIndex];
        
        // Build inline micro-visual block
        let visualHtml = '';
        if (advice.metric) {
            const m = advice.metric;
            if (m.type === 'progress') {
                const pct = Math.min(100, (m.val / m.target) * 100);
                visualHtml = `
                    <div class="advice-visual">
                        <div class="flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1.5">
                            <span>${m.label}</span>
                            <span>${m.val} / ${m.target} Qs</span>
                        </div>
                        <div class="visual-bar-track">
                            <div class="visual-bar-fill" style="width: ${pct}%; background-color: var(--accent-lime);"></div>
                        </div>
                    </div>
                `;
            } else if (m.type === 'balance') {
                const maxReps = Math.max(...m.data.map(d => d.reps), 1);
                visualHtml = `
                    <div class="advice-visual space-y-2">
                        <span class="text-[9px] uppercase tracking-widest text-gray-500 font-black block">Subject Log Comparison</span>
                        <div class="space-y-2">
                            ${m.data.map(d => {
                                const pct = Math.min(100, (d.reps / maxReps) * 100);
                                return `
                                    <div class="flex items-center gap-3">
                                        <span class="text-[9px] font-black text-gray-400 w-8">${d.name.substring(0, 3).toUpperCase()}</span>
                                        <div class="flex-grow visual-bar-track">
                                            <div class="visual-bar-fill" style="width: ${pct}%; background-color: ${d.color};"></div>
                                        </div>
                                        <span class="text-[10px] font-bold text-white w-8 text-right">${d.reps} Qs</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            } else if (m.type === 'pace') {
                const maxPace = Math.max(m.userVal, m.targetVal * 2, 10);
                const userPct = Math.min(95, Math.max(5, (m.userVal / maxPace) * 100));
                const targetPct = Math.min(95, Math.max(5, (m.targetVal / maxPace) * 100));
                visualHtml = `
                    <div class="advice-visual">
                        <span class="text-[9px] uppercase tracking-widest text-gray-500 font-black block mb-3">Pacing Comparison</span>
                        <div class="space-y-4">
                            <div class="space-y-1">
                                <div class="flex justify-between items-center text-[10px]">
                                    <span class="text-gray-400 font-bold">Your Pace</span>
                                    <span class="font-black" style="color: ${m.color};">${m.userVal.toFixed(1)} min/q</span>
                                </div>
                                <div class="visual-bar-track">
                                    <div class="visual-bar-fill" style="width: ${userPct}%; background-color: ${m.color};"></div>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <div class="flex justify-between items-center text-[10px]">
                                    <span class="text-gray-400 font-bold">JEE Benchmark Range</span>
                                    <span class="font-black text-gray-400">${m.targetLabel} min/q</span>
                                </div>
                                <div class="visual-bar-track">
                                    <div class="visual-bar-fill" style="width: ${targetPct}%; background-color: var(--surface-alt);"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else if (m.type === 'momentum') {
                const total = m.now + m.last;
                const nowPct = Math.min(100, (m.now / total) * 100);
                const lastPct = Math.min(100, (m.last / total) * 100);
                const isUp = m.trend === 'up';
                const trendColor = isUp ? '#AAFF00' : '#FF6500';
                const trendIcon = isUp ? 'trending_up' : 'trending_down';

                visualHtml = `
                    <div class="advice-visual flex items-center justify-between gap-6">
                        <div class="flex-grow space-y-2.5">
                            <span class="text-[9px] uppercase tracking-widest text-gray-500 font-black block">Weekly Momentum Comparison</span>
                            <div class="flex items-center gap-3">
                                <span class="text-[9px] text-gray-400 font-bold w-12">LAST WK</span>
                                <div class="flex-grow visual-bar-track">
                                    <div class="visual-bar-fill" style="width: ${lastPct}%; background-color: var(--surface-alt);"></div>
                                </div>
                                <span class="text-[10px] font-bold text-gray-400 w-8 text-right">${m.last}</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-[9px] text-white font-black w-12">THIS WK</span>
                                <div class="flex-grow visual-bar-track">
                                    <div class="visual-bar-fill" style="width: ${nowPct}%; background-color: ${trendColor};"></div>
                                </div>
                                <span class="text-[10px] font-black text-white w-8 text-right">${m.now}</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center justify-center border border-gray-900 rounded-xl p-3 bg-black/30 min-w-[70px]">
                            <span class="material-symbols-outlined text-2xl" style="color: ${trendColor};">${trendIcon}</span>
                            <span class="text-[8px] font-black uppercase tracking-widest mt-1" style="color: ${trendColor};">${isUp ? 'Gaining' : 'Lagging'}</span>
                        </div>
                    </div>
                `;
            } else if (m.type === 'diversity') {
                visualHtml = `
                    <div class="advice-visual space-y-2">
                        <span class="text-[9px] uppercase tracking-widest text-gray-500 font-black block">Source Practice Coverage</span>
                        <div class="visual-badge-list">
                            ${m.all.map(src => {
                                const isActive = m.active.includes(src);
                                const label = src.charAt(0).toUpperCase() + src.slice(1);
                                const icon = isActive ? 'check_circle' : 'cancel';
                                const badgeClass = isActive ? 'badge-active' : 'badge-inactive';
                                const iconColor = isActive ? '#AAFF00' : '#333333';
                                return `
                                    <span class="visual-badge ${badgeClass}">
                                        <span class="material-symbols-outlined text-[10px]" style="color: ${iconColor}; font-variation-fill: 1">${icon}</span>
                                        ${label}
                                    </span>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        }

        container.innerHTML = `
            <div class="advice-card card-${advice.type} w-full max-w-lg mx-auto opacity-0 translate-y-2 animate-fade-in">
                <div class="advice-header">
                    <span class="advice-tag tag-${advice.type}">
                        <span class="material-symbols-outlined text-[12px]" style="font-variation-fill: 1">${advice.icon || 'lightbulb'}</span>
                        ${advice.tag}
                    </span>
                </div>
                <p class="text-sm text-gray-300 leading-relaxed">${advice.text}</p>
                ${visualHtml}
            </div>
        `;
    }
};

window.AdviceEngine = AdviceEngine;
