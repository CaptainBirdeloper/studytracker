const STORAGE_KEY = 'study_log_data';

if (typeof window !== 'undefined' && !window.escapeHTML) {
    window.escapeHTML = function(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };
}

function getLocalISODate(date = new Date()) {
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, -1);
    return localISOTime.split('T')[0];
}

function getTodayString() {
    return getLocalISODate();
}

function getPast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(getLocalISODate(d));
    }
    return days;
}

function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        const parsed = JSON.parse(data);
        // Ensure settings exist
        if (!parsed.settings) {
            parsed.settings = {
                fontSize: 16,
                fontFamily: "'Inter', sans-serif"
            };
        }
        return parsed;
    }
    return {
        streak: 0,
        lastDate: null,
        totalReps: 0,
        totalTime: 0,
        history: {},
        settings: {
            fontSize: 16,
            fontFamily: "'Inter', sans-serif"
        }
    };
}

function saveSettings(settings) {
    const data = loadData();
    data.settings = settings;
    saveData(data);
    applySettings();
}

function applySettings() {
    const data = loadData();
    const settings = data.settings;
    if (settings) {
        document.documentElement.style.fontSize = `${settings.fontSize}px`;
        document.body.style.fontFamily = settings.fontFamily;
    }
}

// Apply settings on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', applySettings);
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearAllData() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
}

// Snappy Navigation Helper
window.navigateTo = function(url) {
    window.location.href = url;
};

function updateStats(reps, timeSeconds, chapter, source = 'module') {
    const data = loadData();
    const today = getTodayString();
    
    // Streak logic
    if (data.lastDate !== today) {
        if (data.lastDate) {
            const last = new Date(data.lastDate);
            const current = new Date(today);
            const diffDays = Math.floor((current - last) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                data.streak += 1;
            } else if (diffDays > 1) {
                data.streak = 1;
            }
        } else {
            data.streak = 1;
        }
        data.lastDate = today;
    }

    data.totalReps += reps;
    data.totalTime += timeSeconds;

    if (!data.history[today]) {
        data.history[today] = { reps: 0, time: 0, chapters: {} };
    }
    data.history[today].reps += reps;
    data.history[today].time += timeSeconds;
    
    if (chapter) {
        const normalizedChapter = chapter.trim().toLowerCase();
        if (!data.history[today].chapters) {
            data.history[today].chapters = {};
        }
        
        // Handle migration/initialization
        if (!data.history[today].chapters[normalizedChapter]) {
            data.history[today].chapters[normalizedChapter] = { reps: 0, time: 0, sources: [] };
        }
        
        const chData = data.history[today].chapters[normalizedChapter];
        chData.reps += reps;
        chData.time += timeSeconds;
        
        // Add source if not already present in the list for today/this chapter
        if (!chData.sources) chData.sources = [];
        if (!chData.sources.includes(source)) {
            chData.sources.push(source);
        }
    }

    saveData(data);
}

if (typeof window !== 'undefined') {
    window.deleteChapterData = function(chapterName, callback) {
        const data = loadData();
        const normalizedChapter = chapterName.trim().toLowerCase();
        let totalDeletedReps = 0;
        let totalDeletedTime = 0;

        Object.keys(data.history).forEach(date => {
            if (data.history[date].chapters && data.history[date].chapters[normalizedChapter]) {
                const chapterData = data.history[date].chapters[normalizedChapter];
                
                // If it's the new object format
                if (typeof chapterData === 'object') {
                    totalDeletedReps += chapterData.reps;
                    totalDeletedTime += chapterData.time;
                    data.history[date].reps = Math.max(0, data.history[date].reps - chapterData.reps);
                    data.history[date].time = Math.max(0, data.history[date].time - chapterData.time);
                } else {
                    // Fallback for old number-only format
                    totalDeletedReps += chapterData;
                    data.history[date].reps = Math.max(0, data.history[date].reps - chapterData);
                }
                
                delete data.history[date].chapters[normalizedChapter];
            }
        });

        data.totalReps = Math.max(0, data.totalReps - totalDeletedReps);
        data.totalTime = Math.max(0, data.totalTime - totalDeletedTime);
        
        saveData(data);
        if (callback) callback();
    };
}
