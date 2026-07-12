window.StatsController = {
    weekOffset: 0,
    subjectFilter: null,
    subjects: [null, 'Physics', 'Mathematics', 'Chemistry'],
    subjectIndex: 0,
    
    init: function() {
        document.getElementById('week-prev').addEventListener('click', () => {
            this.weekOffset++;
            this.refreshAll();
        });

        document.getElementById('week-next').addEventListener('click', () => {
            if (this.weekOffset > 0) {
                this.weekOffset--;
                this.refreshAll();
            }
        });

        document.getElementById('progress-label').addEventListener('click', () => {
            this.subjectIndex = (this.subjectIndex + 1) % this.subjects.length;
            this.subjectFilter = this.subjects[this.subjectIndex];
            this.refreshAll();
        });

        document.getElementById('sort-distribution').addEventListener('change', (e) => {
            Distribution.sortBy = e.target.value;
            Distribution.render();
        });

        document.getElementById('toggle-distribution').addEventListener('click', () => {
            Distribution.mode = Distribution.mode === 'subjects' ? 'chapters' : 'subjects';
            document.getElementById('toggle-distribution').textContent = Distribution.mode === 'subjects' ? 'Subjects' : 'Chapters';
            
            // Show/Hide sort toggle
            const sortBtn = document.getElementById('sort-distribution');
            if(sortBtn) sortBtn.style.display = Distribution.mode === 'chapters' ? 'block' : 'none';
            
            Distribution.render();
        });

        HistoryEngine.init();
        
        // Populate chapter selects
        ['Physics', 'Mathematics', 'Chemistry'].forEach(sub => {
            const key = sub.toLowerCase();
            const select = document.getElementById(`density-chapter-${key}`);
            if (select && window.ChapterDatabase && window.ChapterDatabase[sub]) {
                window.ChapterDatabase[sub].forEach(ch => {
                    const opt = document.createElement('option');
                    opt.value = ch.toLowerCase();
                    opt.textContent = ch;
                    opt.className = 'bg-black text-white';
                    select.appendChild(opt);
                });
            }
        });

        // Density Listeners
        ['physics', 'mathematics', 'chemistry'].forEach(sub => {
            document.getElementById(`density-source-${sub}`).addEventListener('change', () => this.renderDensity());
            const chSelect = document.getElementById(`density-chapter-${sub}`);
            if (chSelect) {
                chSelect.addEventListener('change', () => this.renderDensity());
            }
        });

        // Close modal button listener
        const closeBtn = document.getElementById('close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDensityModal());
        }

        // Click outside modal content to close
        const modal = document.getElementById('density-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeDensityModal();
                }
            });
        }

        const scopeWeekBtn = document.getElementById('density-scope-week');
        const scopeAllBtn = document.getElementById('density-scope-all');
        if (scopeWeekBtn && scopeAllBtn) {
            scopeWeekBtn.addEventListener('click', () => {
                this.densityScope = 'weekly';
                this.updateDensityScopeUI();
                this.renderDensity();
            });
            scopeAllBtn.addEventListener('click', () => {
                this.densityScope = 'alltime';
                this.updateDensityScopeUI();
                this.renderDensity();
            });
        }

        AdviceEngine.init();
        this.refreshAll();
    },

    updateHero: function() {
        const data = loadData();
        const repsTarget = data.totalReps || 0;
        const timeTarget = parseFloat((data.totalTime / 3600).toFixed(1)) || 0;
        
        const duration = 1200; // 1.2s
        const startTime = performance.now();
        
        const repsElement = document.getElementById('reps-val');
        const repsSuffix = document.getElementById('reps-suffix');
        const timeElement = document.getElementById('time-val');
        const timeSuffix = document.getElementById('time-suffix');
        
        if (!repsElement && !timeElement) return;
        
        function easeOutExpo(x) {
            return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
        }
        
        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeOutExpo(progress);
            
            if (repsElement) {
                const currentReps = Math.floor(repsTarget * ease);
                repsElement.textContent = currentReps;
                if (repsSuffix) {
                    repsSuffix.textContent = currentReps >= 1000 ? 'K' : '';
                }
            }
            
            if (timeElement) {
                const currentTime = (timeTarget * ease).toFixed(1);
                timeElement.textContent = currentTime;
                if (timeSuffix) {
                    timeSuffix.textContent = parseFloat(currentTime) >= 1000 ? 'K' : 'h';
                }
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (repsElement) {
                    repsElement.textContent = repsTarget;
                    if (repsSuffix) {
                        repsSuffix.textContent = repsTarget >= 1000 ? 'K' : '';
                    }
                }
                if (timeElement) {
                    timeElement.textContent = timeTarget.toFixed(1);
                    if (timeSuffix) {
                        timeSuffix.textContent = timeTarget >= 1000 ? 'K' : 'h';
                    }
                }
            }
        }
        
        requestAnimationFrame(animate);
    },

    renderDensity: function() {
        const weekOffset = this.densityScope === 'weekly' ? this.weekOffset : null;
        const stats = Analytics.getDensityStats(weekOffset);
        
        // Target Benchmarks based on research
        const targets = {
            'physics': { 'total': '2-4m', 'module': '2-3m', 'pathfinder': '10-20m', 'kota': '2-4m' },
            'mathematics': { 'total': '3-5m', 'module': '2-4m', 'blackbook': '5-8m', 'kota': '3-5m' },
            'chemistry': { 'total': '1-2m', 'module': '1-2m', 'kota': '1-2m' }
        };
        
        // Overall (Convert total seconds to minutes first)
        const overallMins = stats.overall.reps > 0 ? ((stats.overall.time / 60) / stats.overall.reps).toFixed(1) : '0.0';
        document.getElementById('overall-density').textContent = `${overallMins}m`;

        // Subjects
        ['Physics', 'Mathematics', 'Chemistry'].forEach(sub => {
            const key = sub.toLowerCase();
            const source = document.getElementById(`density-source-${key}`).value;
            const chapter = document.getElementById(`density-chapter-${key}`).value;
            const subData = stats.subjects[sub];
            
            let time = 0, reps = 0;
            if (chapter === 'all') {
                if (source === 'total') {
                    time = subData.time;
                    reps = subData.reps;
                } else {
                    const srcData = subData.sources[source] || { time: 0, reps: 0 };
                    time = srcData.time;
                    reps = srcData.reps;
                }
            } else {
                const chData = subData.chapters[chapter] || { time: 0, reps: 0, sources: {} };
                if (source === 'total') {
                    time = chData.time;
                    reps = chData.reps;
                } else {
                    const srcData = chData.sources[source] || { time: 0, reps: 0 };
                    time = srcData.time;
                    reps = srcData.reps;
                }
            }

            // Convert to minutes per question
            const val = reps > 0 ? ((time / 60) / reps).toFixed(1) : '0.0';
            document.getElementById(`density-val-${key}`).textContent = val;

            // Update Target Label
            const targetLabel = document.getElementById(`target-val-${key}`);
            const targetStr = targets[key][source];
            if (targetLabel) {
                targetLabel.textContent = `Target: ${targetStr || 'N/A'}`;
            }

            // Update Dynamic Status Badge
            const statusBadge = document.getElementById(`status-val-${key}`);
            if (statusBadge) {
                const numVal = parseFloat(val);
                
                // Reset styling classes
                statusBadge.className = 'status-badge transition-all';
                statusBadge.style.cssText = '';
                
                if (reps === 0 || numVal === 0) {
                    statusBadge.textContent = 'No Data';
                    statusBadge.style.cssText = 'color: #888888; background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08);';
                } else if (targetStr) {
                    const match = targetStr.match(/(\d+)-(\d+)m/);
                    if (match) {
                        const targetMin = parseFloat(match[1]);
                        const targetMax = parseFloat(match[2]);
                        
                        if (numVal < targetMin) {
                            statusBadge.textContent = 'Speedy';
                            statusBadge.style.cssText = 'color: #7BBFDF; background: rgba(123, 191, 223, 0.1); border-color: rgba(123, 191, 223, 0.2);';
                        } else if (numVal > targetMax) {
                            statusBadge.textContent = 'Slow';
                            statusBadge.style.cssText = 'color: #E87060; background: rgba(232, 112, 96, 0.1); border-color: rgba(232, 112, 96, 0.2);';
                        } else {
                            statusBadge.textContent = 'On Track';
                            statusBadge.style.cssText = 'color: #B8E04A; background: rgba(184, 224, 74, 0.1); border-color: rgba(184, 224, 74, 0.2);';
                        }
                    } else {
                        statusBadge.textContent = 'Active';
                        statusBadge.style.cssText = 'color: #AAFF00; background: rgba(170, 255, 0, 0.1); border-color: rgba(170, 255, 0, 0.2);';
                    }
                } else {
                    statusBadge.textContent = 'Active';
                    statusBadge.style.cssText = 'color: #AAFF00; background: rgba(170, 255, 0, 0.1); border-color: rgba(170, 255, 0, 0.2);';
                }
            }
        });
    },

    activeTrendSubject: null,
    activeTrendSource: 'total',
    trendChartInstance: null,

    showDensityTrend: function(subject) {
        this.activeTrendSubject = subject;
        this.activeTrendSource = 'total'; // default to overall

        const modal = document.getElementById('density-modal');
        const title = document.getElementById('modal-subject-title');
        
        if (title) title.textContent = `${subject} Trend`;
        
        // Build the pill/bubble source buttons
        this.buildSourcePills();

        // Show modal with animation
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
            }, 10);
        }

        // Render trend chart
        this.renderTrendChart();
    },

    buildSourcePills: function() {
        const container = document.getElementById('modal-source-pills');
        if (!container) return;

        container.innerHTML = '';

        const subject = this.activeTrendSubject;
        const stats = Analytics.getDensityStats();
        const subData = stats.subjects[subject];
        
        // Define sources list starting with "total" (labeled as "Overall")
        const sources = [{ id: 'total', label: 'Overall' }];
        
        if (subData && subData.sources) {
            Object.keys(subData.sources).forEach(src => {
                if (src !== 'total') {
                    const label = src.charAt(0).toUpperCase() + src.slice(1);
                    sources.push({ id: src, label: label });
                }
            });
        }

        sources.forEach(src => {
            const btn = document.createElement('button');
            btn.textContent = src.label;
            btn.className = `rounded-full px-3 py-1 text-[9px] uppercase tracking-widest font-black border transition-all cursor-pointer active:scale-95`;
            
            if (this.activeTrendSource === src.id) {
                btn.className += ' bg-white text-black border-white';
            } else {
                btn.className += ' bg-transparent text-gray-400 border-gray-800 hover:text-white hover:border-gray-600';
            }

            btn.addEventListener('click', () => {
                this.activeTrendSource = src.id;
                this.buildSourcePills();
                this.renderTrendChart();
            });

            container.appendChild(btn);
        });
    },

    renderTrendChart: function() {
        const subject = this.activeTrendSubject;
        const source = this.activeTrendSource;
        const trend = Analytics.getDensityTrend(subject, source);
        const canvas = document.getElementById('density-trend-canvas');
        
        if (!canvas) return;

        if (this.trendChartInstance) {
            this.trendChartInstance.destroy();
            this.trendChartInstance = null;
        }

        let color = '#7BBFDF'; // Physics (Sky Blue)
        if (subject === 'Chemistry') color = '#B8E04A'; // Chemistry (Lime Green)
        if (subject === 'Mathematics') color = '#E8943A'; // Mathematics (Warm Orange)

        if (trend.length === 0) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '10px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('NO DATA FOUND FOR THIS SOURCE', canvas.width / 2, canvas.height / 2);
            return;
        }

        const labels = trend.map(t => {
            const date = new Date(t.date);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        });
        const dataPoints = trend.map(t => t.density);

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, `${color}30`);
        gradient.addColorStop(1, `${color}00`);

        if (typeof Chart === 'undefined') {
            console.error("Chart.js is not loaded");
            return;
        }

        this.trendChartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Density (min/q)',
                    data: dataPoints,
                    borderColor: color,
                    borderWidth: 2.5,
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: color,
                    pointBorderColor: '#000000',
                    pointBorderWidth: 1.5,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#0A0A0A',
                        borderColor: '#262626',
                        borderWidth: 1,
                        titleColor: '#FFFFFF',
                        bodyColor: '#A0A0A0',
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y.toFixed(1)} min/q`;
                            }
                        }
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x'
                        },
                        pan: {
                            enabled: true,
                            mode: 'x'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6B7280',
                            font: {
                                size: 9,
                                weight: 'bold'
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6B7280',
                            font: {
                                size: 9,
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
    },

    closeDensityModal: function() {
        const modal = document.getElementById('density-modal');
        if (modal) {
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                if (this.trendChartInstance) {
                    this.trendChartInstance.destroy();
                    this.trendChartInstance = null;
                }
            }, 300);
        }
    },

    densityScope: 'weekly',

    updateDensityScopeUI: function() {
        const scopeWeekBtn = document.getElementById('density-scope-week');
        const scopeAllBtn = document.getElementById('density-scope-all');
        if (!scopeWeekBtn || !scopeAllBtn) return;

        if (this.weekOffset === 0) {
            scopeWeekBtn.textContent = 'This Week';
        } else {
            scopeWeekBtn.textContent = 'Selected Wk';
        }

        if (this.densityScope === 'weekly') {
            scopeWeekBtn.className = 'rounded-full px-3 py-1 text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer bg-[#AAFF00] text-black shadow-md shadow-[#AAFF00]/10';
            scopeAllBtn.className = 'rounded-full px-3 py-1 text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer bg-transparent text-gray-400 hover:text-white';
        } else {
            scopeWeekBtn.className = 'rounded-full px-3 py-1 text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer bg-transparent text-gray-400 hover:text-white';
            scopeAllBtn.className = 'rounded-full px-3 py-1 text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer bg-[#AAFF00] text-black shadow-md shadow-[#AAFF00]/10';
        }
    },

    refreshAll: function() {
        this.updateDensityScopeUI();
        this.updateHero();
        const weekly = Analytics.getWeeklySummary(this.weekOffset, this.subjectFilter);
        
        // Navigation UI
        const weekLabel = document.getElementById('week-label');
        const nextBtn = document.getElementById('week-next');
        const progressLabel = document.getElementById('progress-label');

        weekLabel.textContent = this.weekOffset === 0 ? 'This Week' : `${this.weekOffset} Weeks Ago`;
        nextBtn.disabled = (this.weekOffset === 0);

        // Update Progress Label based on filter
        progressLabel.textContent = this.subjectFilter || 'Progress';
        progressLabel.style.color = this.subjectFilter ? ChapterValidator.getSubjectColor(this.subjectFilter) : '#9ca3af';

        // Labels
        document.getElementById('weekly-reps-text').textContent = `+${weekly.totalReps} Total`;
        
        // Graphs
        GraphEngine.renderBarGraph('reps-graph', weekly.history, 'reps', weekly.maxReps);
        GraphEngine.renderBarGraph('time-graph', weekly.history, 'time', weekly.maxTime);
        
        HistoryEngine.render();
        Distribution.render();
        this.renderDensity();
        AdviceEngine.render();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    StatsController.init();
});