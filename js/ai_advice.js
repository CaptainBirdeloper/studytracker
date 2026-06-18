/**
 * AiAdviceEngine - Generates and manages customized study insights using Gemini 3.1 Flash-Lite.
 * Reuses high-fidelity visual cards and layouts from advice.css.
 */
const AiAdviceEngine = {
    currentIndex: 0,
    allAdvice: [],

    init: function() {
        const nextBtn = document.getElementById('ai-advice-next');
        const prevBtn = document.getElementById('ai-advice-prev');
        
        if (nextBtn) nextBtn.addEventListener('click', () => this.next());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prev());

        this.bindTouchEvents();
        this.render();
    },

    bindTouchEvents: function() {
        const container = document.getElementById('ai-advice-container');
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

    getHistoryHash: function(history) {
        const str = JSON.stringify(history || {});
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 33) ^ str.charCodeAt(i);
        }
        return (hash >>> 0).toString(36);
    },

    render: async function() {
        const container = document.getElementById('ai-advice-container');
        const nav = document.getElementById('ai-advice-nav');
        
        if (!container) return;

        // Reset class list of the section parent
        const section = container.closest('section');
        if (section) {
            section.classList.remove('card-strength', 'card-warning', 'card-danger', 'card-info');
        }

        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Add API key in settings</p>';
            if (nav) nav.classList.add('hidden');
            return;
        }

        const data = loadData();
        const currentHash = this.getHistoryHash(data.history);
        const cachedHash = localStorage.getItem('gemini_ai_advice_hash');
        const cachedAdvice = localStorage.getItem('gemini_ai_advice');

        if (cachedHash === currentHash && cachedAdvice) {
            try {
                this.allAdvice = JSON.parse(cachedAdvice);
                this.currentIndex = 0;
                this.showCurrent();
                return;
            } catch (e) {
                console.error("Failed to parse cached AI advice:", e);
            }
        }

        // Check request quota for this session
        let requestsCount = parseInt(sessionStorage.getItem('gemini_session_requests') || '0');
        if (requestsCount >= 3) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center py-6">Session request limit reached (max 3).<br><span class="text-[10px] text-gray-600">Reset by logging a new study entry.</span></p>';
            if (nav) nav.classList.add('hidden');
            return;
        }

        // Show loading spinner
        container.innerHTML = `
            <div class="ai-loading-container animate-fade-in">
                <div class="ai-spinner"></div>
                <p class="text-xs text-gray-400 uppercase tracking-widest font-black">Generating AI Insights...</p>
            </div>
        `;
        if (nav) nav.classList.add('hidden');

        try {
            const advice = await this.fetchAiAdvice(apiKey, data);
            
            // Save to cache
            localStorage.setItem('gemini_ai_advice', JSON.stringify(advice));
            localStorage.setItem('gemini_ai_advice_hash', currentHash);

            // Increment request quota count
            sessionStorage.setItem('gemini_session_requests', (requestsCount + 1).toString());

            this.allAdvice = advice;
            this.currentIndex = 0;
            this.showCurrent();
        } catch (err) {
            console.error(err);
            const displayErr = window.escapeHTML ? window.escapeHTML(err.message) : err.message;
            container.innerHTML = `<p class="text-red-500 text-xs text-center py-6">Failed to load AI advice: ${displayErr}</p>`;
            if (nav) nav.classList.add('hidden');
        }
    },

    fetchAiAdvice: async function(apiKey, data) {
        // Prepare stats
        const chapters = Analytics.getChapterSummary();
        const densityStats = Analytics.getDensityStats();
        const weeklyNow = Analytics.getWeeklySummary(0);
        const weeklyLast = Analytics.getWeeklySummary(1);

        const subjectsStr = ['Physics', 'Mathematics', 'Chemistry'].map(sub => {
            const sData = densityStats.subjects[sub];
            const reps = sData ? sData.reps : 0;
            const mins = sData ? (sData.time / 60) : 0;
            const density = reps > 0 ? (mins / reps).toFixed(1) : '0.0';
            return `${sub}: ${reps} Qs solved, ${mins.toFixed(1)} mins spent, Density: ${density} min/q.`;
        }).join('\n');

        const topChaptersStr = chapters.slice(0, 8).map(ch => {
            const id = ChapterValidator.identify(ch.name);
            const sub = id ? id.subject : 'Unknown';
            return `- ${ch.name} (${sub}): ${ch.reps} Qs solved, ${(ch.time / 60).toFixed(1)} mins spent.`;
        }).join('\n');

        const statsPrompt = `
You are a highly analytical JEE study coach. Review the student's study data below and produce EXACTLY 3 highly tactical, actionable advice cards in JSON.
Highlight specific strengths, imbalances, pacing bottlenecks, or momentum changes. Do not be generic. Refer to specific chapters or numbers.

Student Stats:
- Total Solved: ${data.totalReps} questions
- Total Time: ${(data.totalTime / 3600).toFixed(1)} hours
- Current Streak: ${data.streak} consecutive days
- Subject Statistics:
${subjectsStr}
- Weekly Momentum:
  * This week: ${weeklyNow.totalReps} Qs solved, ${(weeklyNow.totalTime / 60).toFixed(1)} mins spent.
  * Last week: ${weeklyLast.totalReps} Qs solved, ${(weeklyLast.totalTime / 60).toFixed(1)} mins spent.
- Top Studied Chapters:
${topChaptersStr}

JEE target pacing ranges (minutes per question):
- Physics: 2-4m, theme color: '#7BBFDF'
- Mathematics: 3-5m, theme color: '#E8943A'
- Chemistry: 1-2m, theme color: '#B8E04A'
`;

        const responseSchema = {
            type: "OBJECT",
            properties: {
                advice: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            tag: { type: "STRING" },
                            icon: { type: "STRING", description: "Material Symbols Outlined icon name (e.g., speed, balance, star, auto_stories, rocket_launch, trending_up, trending_down, analytics, warning, info, check_circle, or lightbulb)." },
                            text: { type: "STRING" },
                            type: { type: "STRING" },
                            metric: {
                                type: "OBJECT",
                                properties: {
                                    type: { type: "STRING" },
                                    val: { type: "NUMBER" },
                                    target: { type: "NUMBER" },
                                    label: { type: "STRING" },
                                    data: {
                                        type: "ARRAY",
                                        items: {
                                            type: "OBJECT",
                                            properties: {
                                                name: { type: "STRING" },
                                                reps: { type: "NUMBER" },
                                                color: { type: "STRING" }
                                            },
                                            required: ["name", "reps", "color"]
                                        }
                                    },
                                    subject: { type: "STRING" },
                                    userVal: { type: "NUMBER" },
                                    targetVal: { type: "NUMBER" },
                                    targetLabel: { type: "STRING" },
                                    color: { type: "STRING" },
                                    now: { type: "NUMBER" },
                                    last: { type: "NUMBER" },
                                    trend: { type: "STRING" },
                                    all: {
                                        type: "ARRAY",
                                        items: { type: "STRING" }
                                    },
                                    active: {
                                        type: "ARRAY",
                                        items: { type: "STRING" }
                                    }
                                },
                                required: ["type"]
                            }
                        },
                        required: ["tag", "icon", "text", "type"]
                    }
                }
            },
            required: ["advice"]
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
        const body = {
            contents: [{
                parts: [{ text: statsPrompt }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            const msg = errBody.error && errBody.error.message ? errBody.error.message : `HTTP ${res.status}`;
            throw new Error(`Gemini API Error: ${msg}`);
        }

        const json = await res.json();
        if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0].text) {
            const parsed = JSON.parse(json.candidates[0].content.parts[0].text);
            if (parsed && Array.isArray(parsed.advice)) {
                return parsed.advice;
            }
        }
        throw new Error("Invalid response format received from Gemini API.");
    },

    showCurrent: function() {
        const container = document.getElementById('ai-advice-container');
        const nav = document.getElementById('ai-advice-nav');
        const page = document.getElementById('ai-advice-page');
        const nextBtn = document.getElementById('ai-advice-next');
        const prevBtn = document.getElementById('ai-advice-prev');

        if (!container) return;

        const section = container.closest('section');
        if (section) {
            section.classList.remove('card-strength', 'card-warning', 'card-danger', 'card-info');
        }

        if (this.allAdvice.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center py-6">No insights generated. Try logging more study sessions.</p>';
            if (nav) nav.classList.add('hidden');
            return;
        }

        if (nav) nav.classList.remove('hidden');
        if (page) page.textContent = `${this.currentIndex + 1} / ${this.allAdvice.length}`;
        
        if (nextBtn) nextBtn.disabled = this.currentIndex === this.allAdvice.length - 1;
        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;

        const advice = this.allAdvice[this.currentIndex];

        // Map and normalize dynamic Gemini icon names to Material Symbols ligatures
        const rawIcon = advice.icon || 'lightbulb';
        const iconMap = {
            'alert_triangle': 'warning',
            'alert-triangle': 'warning',
            'warning': 'warning',
            'error': 'warning',
            'danger': 'warning',
            'info': 'info',
            'info_sign': 'info',
            'info-sign': 'info',
            'book_open': 'menu_book',
            'book-open': 'menu_book',
            'book': 'menu_book',
            'menu_book': 'menu_book',
            'menu-book': 'menu_book',
            'trending_up': 'trending_up',
            'trending-up': 'trending_up',
            'trending_down': 'trending_down',
            'trending-down': 'trending_down',
            'rocket_launch': 'rocket_launch',
            'rocket-launch': 'rocket_launch',
            'rocket': 'rocket_launch',
            'check_circle': 'check_circle',
            'check-circle': 'check_circle',
            'check': 'check_circle',
            'speed': 'speed',
            'speedometer': 'speed',
            'balance': 'balance',
            'scale': 'balance',
            'star': 'star',
            'analytics': 'analytics',
            'chart': 'analytics',
            'graph': 'analytics',
            'lightbulb': 'lightbulb',
            'idea': 'lightbulb'
        };
        const normalizedIconName = rawIcon.toLowerCase().replace(/-/g, '_');
        const cleanIcon = iconMap[normalizedIconName] || normalizedIconName;

        if (section) {
            section.classList.add(`card-${advice.type}`);
        }

        // Build visual HTML reusing standard classes from advice.css
        let visualHtml = '';
        if (advice.metric) {
            const m = advice.metric;
            if (m.type === 'progress') {
                const target = m.target || 100;
                const val = m.val || 0;
                const pct = Math.min(100, (val / target) * 100);
                const qtyLabel = m.target ? `${val} / ${target}` : `${val}`;
                visualHtml = `
                    <div class="advice-gradient-container space-y-4">
                        <span class="text-[10px] uppercase tracking-widest text-gray-400 font-extrabold block leading-none">${(m.label || 'Progress').toUpperCase()}</span>
                        <div class="capsule-row">
                            <div class="capsule-fill" data-pct="${pct}" style="width: 0%; background-color: var(--accent-lime);">
                                <span>QS</span>
                                <span class="material-symbols-outlined text-[14px]" style="font-variation-fill: 1">analytics</span>
                            </div>
                            <span class="capsule-qty">${qtyLabel}</span>
                        </div>
                    </div>
                `;
            } else if (m.type === 'balance') {
                const maxReps = Math.max(...m.data.map(d => d.reps), 1);
                visualHtml = `
                    <div class="advice-gradient-container space-y-4">
                        <span class="text-[10px] uppercase tracking-widest text-gray-400 font-extrabold block leading-none">SUBJECT LOG COMPARISON</span>
                        <div class="space-y-2.5">
                            ${m.data.map(d => {
                                const pct = Math.min(100, (d.reps / maxReps) * 100);
                                return `
                                    <div class="capsule-row">
                                        <div class="capsule-fill" data-pct="${pct}" style="width: 0%; background-color: ${d.color};">
                                            <span>${d.name.substring(0, 3).toUpperCase()}</span>
                                            <span class="material-symbols-outlined text-[14px]" style="font-variation-fill: 1">balance</span>
                                        </div>
                                        <span class="capsule-qty">${d.reps} Qs</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            } else if (m.type === 'pace') {
                const maxPace = Math.max(m.userVal, m.targetVal * 2, 10);
                const userPct = Math.min(100, Math.max(15, (m.userVal / maxPace) * 100));
                const targetPct = Math.min(100, Math.max(15, (m.targetVal / maxPace) * 100));
                visualHtml = `
                    <div class="advice-gradient-container space-y-4">
                        <span class="text-[10px] uppercase tracking-widest text-gray-400 font-extrabold block leading-none">PACING COMPARISON</span>
                        <div class="space-y-2.5">
                            <div class="capsule-row">
                                <div class="capsule-fill" data-pct="${userPct}" style="width: 0%; background-color: ${m.color};">
                                    <span>YOU</span>
                                    <span class="material-symbols-outlined text-[14px]" style="font-variation-fill: 1">speed</span>
                                </div>
                                <span class="capsule-qty">${m.userVal.toFixed(1)} m/q</span>
                            </div>
                            <div class="capsule-row">
                                <div class="capsule-fill" data-pct="${targetPct}" style="width: 0%; background-color: rgba(255, 255, 255, 0.15); color: #ffffff;">
                                    <span>TARGET</span>
                                    <span class="material-symbols-outlined text-[14px]" style="font-variation-fill: 1">track_changes</span>
                                </div>
                                <span class="capsule-qty">${m.targetLabel} m/q</span>
                            </div>
                        </div>
                    </div>
                `;
            } else if (m.type === 'momentum') {
                const maxVal = Math.max(m.now, m.last, 1);
                const nowPct = Math.min(100, Math.max(15, (m.now / maxVal) * 100));
                const lastPct = Math.min(100, Math.max(15, (m.last / maxVal) * 100));
                const isUp = m.trend === 'up';
                const trendColor = isUp ? 'var(--accent-lime)' : 'var(--accent-orange)';
                const trendIcon = isUp ? 'trending_up' : 'trending_down';

                visualHtml = `
                    <div class="advice-gradient-container space-y-4">
                        <span class="text-[10px] uppercase tracking-widest text-gray-400 font-extrabold block leading-none">WEEKLY MOMENTUM</span>
                        <div class="space-y-2.5">
                            <div class="capsule-row">
                                <div class="capsule-fill" data-pct="${lastPct}" style="width: 0%; background-color: rgba(255, 255, 255, 0.15); color: #ffffff;">
                                    <span>LAST WK</span>
                                    <span class="material-symbols-outlined text-[14px]">history</span>
                                </div>
                                <span class="capsule-qty">${m.last} Qs</span>
                            </div>
                            <div class="capsule-row">
                                <div class="capsule-fill" data-pct="${nowPct}" style="width: 0%; background-color: ${trendColor};">
                                    <span>THIS WK</span>
                                    <span class="material-symbols-outlined text-[14px]" style="font-variation-fill: 1">${trendIcon}</span>
                                </div>
                                <span class="capsule-qty">${m.now} Qs</span>
                            </div>
                        </div>
                    </div>
                `;
            } else if (m.type === 'diversity') {
                const allSources = m.all || ['module', 'pathfinder', 'blackbook', 'kota'];
                const activeSources = m.active || [];
                visualHtml = `
                    <div class="advice-gradient-container space-y-4">
                        <span class="text-[10px] uppercase tracking-widest text-gray-400 font-extrabold block leading-none">SOURCE PRACTICE COVERAGE</span>
                        <div class="grid grid-cols-1 gap-2">
                            ${allSources.slice(0, 4).map(src => {
                                const isActive = activeSources.includes(src);
                                const label = src.charAt(0).toUpperCase() + src.slice(1);
                                const icon = isActive ? 'check_circle' : 'cancel';
                                const color = isActive ? 'var(--card-sky)' : 'rgba(255, 255, 255, 0.1)';
                                const textColor = isActive ? '#000000' : 'rgba(255, 255, 255, 0.4)';
                                const pct = isActive ? 100 : 0;
                                return `
                                    <div class="capsule-row" style="opacity: ${isActive ? 1 : 0.5};">
                                        <div class="capsule-fill" data-pct="${pct}" style="width: 0%; background-color: ${color}; color: ${textColor}; ${pct === 0 ? 'min-width: 0px !important;' : ''}">
                                            <span>${label}</span>
                                            <span class="material-symbols-outlined text-[14px]" style="font-variation-fill: 1">${icon}</span>
                                        </div>
                                        <span class="capsule-qty text-[10px] font-bold" style="color: ${pct ? '#ffffff' : 'rgba(255, 255, 255, 0.3)'};">${isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        }

        container.innerHTML = `
            <div class="w-full opacity-0 translate-y-2 animate-fade-in flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 py-4 px-2">
                <!-- Left Column: Text & Badge -->
                <div class="flex-1 space-y-5 flex flex-col justify-center text-left">
                    <div>
                        <span class="advice-tag tag-${advice.type} inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-opacity-10 border">
                            <span class="material-symbols-outlined text-[12px]" style="font-variation-fill: 1">${cleanIcon}</span>
                            ${advice.tag}
                        </span>
                    </div>
                    <p class="text-[20px] lg:text-[24px] font-bold text-white leading-snug tracking-tight">${advice.text}</p>
                </div>
                <!-- Right Column: Card Visualizer -->
                ${visualHtml ? `
                <div class="flex-grow-0 flex-shrink-0 w-full lg:w-[48%] lg:max-w-[450px]">
                    ${visualHtml}
                </div>
                ` : ''}
            </div>
        `;

        // Trigger capsule width animations on render
        setTimeout(() => {
            container.querySelectorAll('.capsule-fill').forEach(bar => {
                const target = bar.getAttribute('data-pct');
                if (target !== null) {
                    bar.style.width = target + '%';
                }
            });
        }, 50);
    }
};

window.AiAdviceEngine = AiAdviceEngine;
document.addEventListener('DOMContentLoaded', () => {
    AiAdviceEngine.init();
});
