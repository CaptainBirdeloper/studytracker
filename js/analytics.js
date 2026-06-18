/**
 * Analytics Engine for STUDY.LOG
 * Handles data aggregation and processing for graphs and history.
 */

const Analytics = {
    /**
     * Aggregates all chapter data across all history entries.
     * Ensures case-insensitive grouping.
     */
    getChapterSummary: function() {
        const data = loadData();
        const summary = {};
        
        Object.values(data.history).forEach(day => {
            if (day.chapters) {
                Object.entries(day.chapters).forEach(([chapter, chapterData]) => {
                    // Normalization is handled at storage level (lowercase), 
                    // but we ensure it here just in case.
                    const key = chapter.trim().toLowerCase();
                    if (!summary[key]) {
                        summary[key] = { reps: 0, time: 0, sources: [] };
                    }
                    
                    if (typeof chapterData === 'object') {
                        summary[key].reps += chapterData.reps || 0;
                        summary[key].time += chapterData.time || 0;
                        if (chapterData.sources) {
                            chapterData.sources.forEach(s => {
                                if (!summary[key].sources.includes(s)) {
                                    summary[key].sources.push(s);
                                }
                            });
                        }
                    } else {
                        // Legacy support
                        summary[key].reps += chapterData || 0;
                    }
                });
            }
        });
        
        return Object.entries(summary)
            .map(([name, counts]) => ({ name, ...counts }))
            .sort((a, b) => b.reps - a.reps);
    },

    /**
     * Processes all-time history for Chart.js line graph.
     */
    getAllTimeTrend: function() {
        const data = loadData();
        const dates = Object.keys(data.history).sort();
        
        return {
            labels: dates.map(d => {
                const date = new Date(d);
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }),
            data: dates.map(d => data.history[d].reps || 0)
        };
    },

    /**
     * Gets summary for the specified week offset, optionally filtered by subject.
     * @param {number} offset - 0 for current week, 1 for previous, etc.
     * @param {string} filterSubject - Optional subject name to filter by.
     */
    getWeeklySummary: function(offset = 0, filterSubject = null) {
        const data = loadData();
        const end = new Date();
        end.setDate(end.getDate() - (offset * 7));
        
        const history = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(end);
            d.setDate(d.getDate() - i);
            const dateStr = getLocalISODate(d);
            const dayData = data.history[dateStr] || { reps: 0, time: 0, chapters: {} };
            
            if (filterSubject) {
                let filteredReps = 0;
                let filteredTime = 0;
                if (dayData.chapters) {
                    Object.entries(dayData.chapters).forEach(([chapterName, chapterStats]) => {
                        const id = ChapterValidator.identify(chapterName);
                        if (id && id.subject === filterSubject) {
                            if (typeof chapterStats === 'object') {
                                filteredReps += chapterStats.reps || 0;
                                filteredTime += chapterStats.time || 0;
                            } else {
                                filteredReps += chapterStats || 0;
                            }
                        }
                    });
                }
                history.push({ reps: filteredReps, time: filteredTime });
            } else {
                history.push({ reps: dayData.reps || 0, time: dayData.time || 0 });
            }
        }
        
        const totalReps = history.reduce((sum, d) => sum + (d.reps || 0), 0);
        const totalTime = history.reduce((sum, d) => sum + (d.time || 0), 0);
        
        return {
            history,
            totalReps,
            totalTime,
            maxReps: Math.max(...history.map(d => d.reps), 1),
            maxTime: Math.max(...history.map(d => d.time), 1)
        };
    },

    /**
     * Calculates Question Density (Time per Question)
     * Groups data by Subject and Source.
     */
    getDensityStats: function(weekOffset = null) {
        const data = loadData();
        const stats = {
            overall: { time: 0, reps: 0 },
            subjects: {
                'Physics': { time: 0, reps: 0, sources: {}, chapters: {} },
                'Mathematics': { time: 0, reps: 0, sources: {}, chapters: {} },
                'Chemistry': { time: 0, reps: 0, sources: {}, chapters: {} }
            }
        };

        // Determine allowed dates if weekOffset is specified
        let allowedDates = null;
        if (weekOffset !== null) {
            allowedDates = [];
            const end = new Date();
            end.setDate(end.getDate() - (weekOffset * 7));
            for (let i = 6; i >= 0; i--) {
                const d = new Date(end);
                d.setDate(d.getDate() - i);
                allowedDates.push(getLocalISODate(d));
            }
        }

        Object.entries(data.history).forEach(([dateStr, day]) => {
            if (allowedDates && !allowedDates.includes(dateStr)) return;

            if (day.chapters) {
                Object.entries(day.chapters).forEach(([chapterName, chData]) => {
                    if (typeof chData !== 'object') return;
                    
                    const reps = chData.reps || 0;
                    const time = chData.time || 0;
                    const sources = chData.sources || ['other'];
                    const id = ChapterValidator.identify(chapterName);
                    const subject = id ? id.subject : null;

                    if (reps > 0) {
                        const hasInternal = sources.some(s => s === 'module' || s === 'kota');
                        
                        if (hasInternal) {
                            stats.overall.time += time;
                            stats.overall.reps += reps;
                        }

                        if (subject && stats.subjects[subject]) {
                            if (hasInternal) {
                                stats.subjects[subject].time += time;
                                stats.subjects[subject].reps += reps;
                            }

                            const normalizedChKey = id.chapter.toLowerCase();
                            if (!stats.subjects[subject].chapters[normalizedChKey]) {
                                stats.subjects[subject].chapters[normalizedChKey] = { time: 0, reps: 0, sources: {} };
                            }
                            const chStats = stats.subjects[subject].chapters[normalizedChKey];
                            if (hasInternal) {
                                chStats.time += time;
                                chStats.reps += reps;
                            }

                            sources.forEach(src => {
                                // Subject-level sources
                                if (!stats.subjects[subject].sources[src]) {
                                    stats.subjects[subject].sources[src] = { time: 0, reps: 0 };
                                }
                                stats.subjects[subject].sources[src].time += time;
                                stats.subjects[subject].sources[src].reps += reps;

                                // Chapter-level sources
                                if (!chStats.sources[src]) {
                                    chStats.sources[src] = { time: 0, reps: 0 };
                                }
                                chStats.sources[src].time += time;
                                chStats.sources[src].reps += reps;
                            });
                        }
                    }
                });
            }
        });

        return stats;
    },

    /**
     * Calculates the density trend over time for a subject and a specific source.
     * Returns an array of { date, density } sorted chronologically for days that matching work was logged.
     */
    getDensityTrend: function(subject, source = 'total') {
        const data = loadData();
        const dates = Object.keys(data.history).sort();
        const trend = [];

        dates.forEach(dateStr => {
            const dayData = data.history[dateStr];
            if (!dayData || !dayData.chapters) return;

            let dailyTime = 0;
            let dailyReps = 0;

            Object.entries(dayData.chapters).forEach(([chapterName, chData]) => {
                if (typeof chData !== 'object') return;
                const id = ChapterValidator.identify(chapterName);
                if (id && id.subject === subject) {
                    const reps = chData.reps || 0;
                    const time = chData.time || 0;
                    const sources = chData.sources || ['other'];

                    if (reps > 0) {
                        if (source === 'total') {
                            const hasInternal = sources.some(s => s === 'module' || s === 'kota');
                            if (hasInternal) {
                                dailyTime += time;
                                dailyReps += reps;
                            }
                        } else if (sources.includes(source)) {
                            dailyTime += time;
                            dailyReps += reps;
                        }
                    }
                }
            });

            if (dailyReps > 0) {
                const density = ((dailyTime / 60) / dailyReps).toFixed(1);
                trend.push({
                    date: dateStr,
                    density: parseFloat(density)
                });
            }
        });

        return trend;
    }
};

window.Analytics = Analytics;