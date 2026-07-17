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
        
        // --- Migration for Mains/Advanced ---
        if (parsed.mainsReps === undefined) parsed.mainsReps = parsed.totalReps || 0;
        if (parsed.mainsTime === undefined) parsed.mainsTime = parsed.totalTime || 0;
        if (parsed.advReps === undefined) parsed.advReps = 0;
        if (parsed.advTime === undefined) parsed.advTime = 0;
        
        if (parsed.history) {
            Object.values(parsed.history).forEach(day => {
                if (day.mainsReps === undefined) day.mainsReps = day.reps || 0;
                if (day.mainsTime === undefined) day.mainsTime = day.time || 0;
                if (day.advReps === undefined) day.advReps = 0;
                if (day.advTime === undefined) day.advTime = 0;
                if (day.chapters) {
                    Object.values(day.chapters).forEach(ch => {
                        if (typeof ch === 'object') {
                            if (ch.mainsReps === undefined) ch.mainsReps = ch.reps || 0;
                            if (ch.mainsTime === undefined) ch.mainsTime = ch.time || 0;
                            if (ch.advReps === undefined) ch.advReps = 0;
                            if (ch.advTime === undefined) ch.advTime = 0;
                        }
                    });
                }
            });
        }
        if (!parsed.customSources) parsed.customSources = [];
        return parsed;
    }
    return {
        streak: 0,
        lastDate: null,
        totalReps: 0,
        totalTime: 0,
        mainsReps: 0,
        mainsTime: 0,
        advReps: 0,
        advTime: 0,
        history: {},
        customSources: [],
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

function updateStats(reps, timeSeconds, chapter, source = 'module', level = 'mains') {
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

    if (level === 'mains') {
        data.mainsReps = (data.mainsReps || 0) + reps;
        data.mainsTime = (data.mainsTime || 0) + timeSeconds;
    } else {
        data.advReps = (data.advReps || 0) + reps;
        data.advTime = (data.advTime || 0) + timeSeconds;
    }

    if (!data.history[today]) {
        data.history[today] = { reps: 0, time: 0, mainsReps: 0, mainsTime: 0, advReps: 0, advTime: 0, chapters: {} };
    }
    data.history[today].reps += reps;
    data.history[today].time += timeSeconds;
    
    if (level === 'mains') {
        data.history[today].mainsReps = (data.history[today].mainsReps || 0) + reps;
        data.history[today].mainsTime = (data.history[today].mainsTime || 0) + timeSeconds;
    } else {
        data.history[today].advReps = (data.history[today].advReps || 0) + reps;
        data.history[today].advTime = (data.history[today].advTime || 0) + timeSeconds;
    }
    
    if (chapter) {
        const normalizedChapter = chapter.trim().toLowerCase();
        if (!data.history[today].chapters) {
            data.history[today].chapters = {};
        }
        
        // Handle migration/initialization
        if (!data.history[today].chapters[normalizedChapter]) {
            data.history[today].chapters[normalizedChapter] = { reps: 0, time: 0, mainsReps: 0, mainsTime: 0, advReps: 0, advTime: 0, sources: [] };
        }
        
        const chData = data.history[today].chapters[normalizedChapter];
        chData.reps += reps;
        chData.time += timeSeconds;
        
        if (chData.mainsReps === undefined) chData.mainsReps = 0;
        if (chData.mainsTime === undefined) chData.mainsTime = 0;
        if (chData.advReps === undefined) chData.advReps = 0;
        if (chData.advTime === undefined) chData.advTime = 0;

        if (level === 'mains') {
            chData.mainsReps += reps;
            chData.mainsTime += timeSeconds;
        } else {
            chData.advReps += reps;
            chData.advTime += timeSeconds;
        }
        
        // Add source if not already present in the list for today/this chapter
        if (!chData.sources) chData.sources = [];
        if (!chData.sources.includes(source)) {
            chData.sources.push(source);
        }
    }

    saveData(data);
    
    // Reset Gemini session request limit and invalidate cache
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('gemini_session_requests');
    }
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('gemini_ai_advice_hash');
    }
}

if (typeof window !== 'undefined') {
    window.deleteChapterData = function(chapterName, callback) {
        const data = loadData();
        const normalizedChapter = chapterName.trim().toLowerCase();
        let totalDeletedReps = 0;
        let totalDeletedTime = 0;
        let totalDeletedMainsReps = 0;
        let totalDeletedMainsTime = 0;
        let totalDeletedAdvReps = 0;
        let totalDeletedAdvTime = 0;

        Object.keys(data.history).forEach(date => {
            if (data.history[date].chapters && data.history[date].chapters[normalizedChapter]) {
                const chapterData = data.history[date].chapters[normalizedChapter];
                
                // If it's the new object format
                if (typeof chapterData === 'object') {
                    const delMainsReps = chapterData.mainsReps !== undefined ? chapterData.mainsReps : chapterData.reps || 0;
                    const delMainsTime = chapterData.mainsTime !== undefined ? chapterData.mainsTime : chapterData.time || 0;
                    const delAdvReps = chapterData.advReps || 0;
                    const delAdvTime = chapterData.advTime || 0;

                    totalDeletedReps += chapterData.reps;
                    totalDeletedTime += chapterData.time;
                    totalDeletedMainsReps += delMainsReps;
                    totalDeletedMainsTime += delMainsTime;
                    totalDeletedAdvReps += delAdvReps;
                    totalDeletedAdvTime += delAdvTime;

                    data.history[date].reps = Math.max(0, data.history[date].reps - chapterData.reps);
                    data.history[date].time = Math.max(0, data.history[date].time - chapterData.time);
                    data.history[date].mainsReps = Math.max(0, (data.history[date].mainsReps || 0) - delMainsReps);
                    data.history[date].mainsTime = Math.max(0, (data.history[date].mainsTime || 0) - delMainsTime);
                    data.history[date].advReps = Math.max(0, (data.history[date].advReps || 0) - delAdvReps);
                    data.history[date].advTime = Math.max(0, (data.history[date].advTime || 0) - delAdvTime);
                } else {
                    // Fallback for old number-only format
                    totalDeletedReps += chapterData;
                    totalDeletedMainsReps += chapterData;
                    data.history[date].reps = Math.max(0, data.history[date].reps - chapterData);
                    data.history[date].mainsReps = Math.max(0, (data.history[date].mainsReps || 0) - chapterData);
                }
                
                delete data.history[date].chapters[normalizedChapter];
            }
        });

        data.totalReps = Math.max(0, data.totalReps - totalDeletedReps);
        data.totalTime = Math.max(0, data.totalTime - totalDeletedTime);
        data.mainsReps = Math.max(0, (data.mainsReps || 0) - totalDeletedMainsReps);
        data.mainsTime = Math.max(0, (data.mainsTime || 0) - totalDeletedMainsTime);
        data.advReps = Math.max(0, (data.advReps || 0) - totalDeletedAdvReps);
        data.advTime = Math.max(0, (data.advTime || 0) - totalDeletedAdvTime);
        
        saveData(data);

        // Reset Gemini session request limit and invalidate cache
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('gemini_session_requests');
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('gemini_ai_advice_hash');
        }

        if (callback) callback();
    };
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: #000000;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease-out;
        `;
        
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 32px;
            height: 32px;
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-top-color: #AAFF00;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
        `;
        
        if (!document.getElementById('loader-style')) {
            const style = document.createElement('style');
            style.id = 'loader-style';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        loader.appendChild(spinner);
        document.body.appendChild(loader);

        // Bind clicks on navbar items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (item.classList.contains('active')) return;
                
                const onclickAttr = item.getAttribute('onclick');
                const targetUrl = onclickAttr ? onclickAttr.match(/'([^']+)'/)?.[1] : null;
                if (targetUrl) {
                    e.preventDefault();
                    loader.style.opacity = '1';
                    loader.style.pointerEvents = 'all';
                    setTimeout(() => {
                        window.location.href = targetUrl;
                    }, 100);
                }
            });
        });
    });

    window.addEventListener('pageshow', (event) => {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none';
        }
    });

    window.addCustomSource = function(source) {
        if (!source) return;
        const data = loadData();
        if (!data.customSources) data.customSources = [];
        const exists = data.customSources.some(s => s.toLowerCase() === source.trim().toLowerCase());
        if (!exists) {
            const allPresets = [
                'NCERT Physics', 'NCERT Chemistry', 'NCERT Maths', 'HCV', 'DC Pandey', 
                'RD Sharma', 'SK Goyal', 'OP Tandon', 'P Bahadur', 'RC Mukherjee', 
                'Arihant Master Resource', 'Modules', 'Kota Material', 'PYQs',
                'Cengage', 'Irodov', 'Physics Galaxy', 'Pathfinder', 'N Avasthi', 
                'MS Chauhan', 'VK Jaiswal', 'JD Lee', 'Morrison and Boyd', 
                'Himanshu Pandey', 'Wileys Solomons', 'Blackbook', 'A Das Gupta', 
                'Play with Graphs', 'Sameer Bansal', 'SL Loney', 'GN Berman'
            ];
            const isPreset = allPresets.some(p => p.toLowerCase() === source.trim().toLowerCase());
            if (!isPreset) {
                data.customSources.push(source.trim());
                saveData(data);
            }
        }
    };
}
