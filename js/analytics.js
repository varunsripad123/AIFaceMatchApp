/* ============================================
   NEXWAVE - Analytics Service
   Tracks matches, downloads, and visitor metrics
   ============================================ */

const ANALYTICS_STORAGE_KEY = 'nexwave_analytics';

// Get analytics data
function getAnalytics() {
    return storage.get(ANALYTICS_STORAGE_KEY, {
        events: {},  // eventId -> { matches, downloads, visitors, dailyStats }
        global: {
            totalMatches: 0,
            totalDownloads: 0,
            lastUpdated: null
        }
    });
}

// Save analytics data
function saveAnalytics(data) {
    data.global.lastUpdated = new Date().toISOString();
    storage.set(ANALYTICS_STORAGE_KEY, data);
}

// Initialize analytics for an event
function initEventAnalytics(eventId) {
    const analytics = getAnalytics();
    if (!analytics.events[eventId]) {
        analytics.events[eventId] = {
            matches: 0,
            downloads: 0,
            visitors: [],  // Unique session IDs
            dailyStats: [] // [{date: 'YYYY-MM-DD', matches: 0, downloads: 0}]
        };
        saveAnalytics(analytics);
    }
    return analytics.events[eventId];
}

// Track a face match event
function trackMatch(eventId, matchCount = 1) {
    const analytics = getAnalytics();
    initEventAnalytics(eventId);

    const today = new Date().toISOString().split('T')[0];
    const eventStats = analytics.events[eventId];

    // Update event stats
    eventStats.matches += matchCount;

    // Update daily stats
    let dailyStat = eventStats.dailyStats.find(d => d.date === today);
    if (!dailyStat) {
        dailyStat = { date: today, matches: 0, downloads: 0 };
        eventStats.dailyStats.push(dailyStat);
        // Keep only last 30 days
        if (eventStats.dailyStats.length > 30) {
            eventStats.dailyStats.shift();
        }
    }
    dailyStat.matches += matchCount;

    // Update global stats
    analytics.global.totalMatches += matchCount;

    saveAnalytics(analytics);
    console.log(`[Analytics] Tracked ${matchCount} match(es) for event ${eventId}`);
}

// Track a photo download
function trackDownload(eventId, downloadCount = 1) {
    const analytics = getAnalytics();
    initEventAnalytics(eventId);

    const today = new Date().toISOString().split('T')[0];
    const eventStats = analytics.events[eventId];

    // Update event stats
    eventStats.downloads += downloadCount;

    // Update daily stats
    let dailyStat = eventStats.dailyStats.find(d => d.date === today);
    if (!dailyStat) {
        dailyStat = { date: today, matches: 0, downloads: 0 };
        eventStats.dailyStats.push(dailyStat);
        if (eventStats.dailyStats.length > 30) {
            eventStats.dailyStats.shift();
        }
    }
    dailyStat.downloads += downloadCount;

    // Update global stats
    analytics.global.totalDownloads += downloadCount;

    saveAnalytics(analytics);
    console.log(`[Analytics] Tracked ${downloadCount} download(s) for event ${eventId}`);
}

// Track unique visitor
function trackVisitor(eventId) {
    const sessionId = getOrCreateSessionId();
    const analytics = getAnalytics();
    initEventAnalytics(eventId);

    const eventStats = analytics.events[eventId];

    if (!eventStats.visitors.includes(sessionId)) {
        eventStats.visitors.push(sessionId);
        saveAnalytics(analytics);
        console.log(`[Analytics] New visitor for event ${eventId}`);
    }
}

// Get or create session ID
function getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('nexwave_session_id');
    if (!sessionId) {
        sessionId = 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('nexwave_session_id', sessionId);
    }
    return sessionId;
}

// Get analytics for a specific event
function getEventAnalytics(eventId) {
    const analytics = getAnalytics();
    return analytics.events[eventId] || initEventAnalytics(eventId);
}

// Get analytics for all events by a photographer
function getPhotographerAnalytics(events) {
    const analytics = getAnalytics();

    let totalMatches = 0;
    let totalDownloads = 0;
    let totalVisitors = 0;
    const allDailyStats = {};

    events.forEach(event => {
        const eventStats = analytics.events[event.id] || { matches: 0, downloads: 0, visitors: [], dailyStats: [] };
        totalMatches += eventStats.matches;
        totalDownloads += eventStats.downloads;
        totalVisitors += eventStats.visitors.length;

        // Aggregate daily stats
        eventStats.dailyStats.forEach(stat => {
            if (!allDailyStats[stat.date]) {
                allDailyStats[stat.date] = { date: stat.date, matches: 0, downloads: 0 };
            }
            allDailyStats[stat.date].matches += stat.matches;
            allDailyStats[stat.date].downloads += stat.downloads;
        });
    });

    // Convert to sorted array (last 7 days)
    const last7Days = getLast7Days();
    const weeklyStats = last7Days.map(date => {
        return allDailyStats[date] || { date, matches: 0, downloads: 0 };
    });

    return {
        totalMatches,
        totalDownloads,
        totalVisitors,
        weeklyStats
    };
}

// Get last 7 days as YYYY-MM-DD strings
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
    }
    return days;
}

// Calculate trend (compare current period to previous period)
function calculateTrend(currentValue, previousValue) {
    if (previousValue === 0) {
        return currentValue > 0 ? { value: 100, isPositive: true } : { value: 0, isPositive: true };
    }
    const change = ((currentValue - previousValue) / previousValue) * 100;
    return {
        value: Math.abs(Math.round(change)),
        isPositive: change >= 0
    };
}

// Render a mini sparkline chart (pure SVG)
function renderSparkline(data, color = 'var(--primary)') {
    if (!data || data.length === 0) {
        return '<div style="height: 40px;"></div>';
    }

    const max = Math.max(...data, 1);
    const width = 100;
    const height = 40;
    const barWidth = width / data.length - 2;

    const bars = data.map((val, i) => {
        const barHeight = (val / max) * (height - 4);
        const x = i * (barWidth + 2);
        const y = height - barHeight - 2;
        return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="2" fill="${color}" opacity="0.8"/>`;
    }).join('');

    return `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display: block;">
            ${bars}
        </svg>
    `;
}

// Render a bar chart for weekly activity
function renderWeeklyChart(weeklyStats) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const maxVal = Math.max(
        ...weeklyStats.map(s => s.matches),
        ...weeklyStats.map(s => s.downloads),
        1
    );

    return `
        <div class="weekly-chart" style="background: var(--card); border-radius: var(--radius-xl); padding: var(--space-6); border: 1px solid var(--border);">
            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: var(--space-4); color: var(--text-primary);">Weekly Activity</h3>
            <div style="display: flex; gap: var(--space-2); align-items: flex-end; height: 120px;">
                ${weeklyStats.map((stat, i) => {
        const date = new Date(stat.date);
        const dayLabel = days[date.getDay()];
        const matchHeight = (stat.matches / maxVal) * 100;
        const downloadHeight = (stat.downloads / maxVal) * 100;

        return `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--space-1);">
                            <div style="flex: 1; display: flex; gap: 2px; align-items: flex-end; width: 100%; min-height: 80px;">
                                <div style="flex: 1; background: var(--primary); border-radius: 4px 4px 0 0; height: ${matchHeight}%; min-height: ${stat.matches > 0 ? '4px' : '0'};"></div>
                                <div style="flex: 1; background: var(--accent); border-radius: 4px 4px 0 0; height: ${downloadHeight}%; min-height: ${stat.downloads > 0 ? '4px' : '0'};"></div>
                            </div>
                            <span style="font-size: 0.625rem; color: var(--text-secondary);">${dayLabel}</span>
                        </div>
                    `;
    }).join('')}
            </div>
            <div style="display: flex; gap: var(--space-4); margin-top: var(--space-4); justify-content: center;">
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                    <div style="width: 12px; height: 12px; background: var(--primary); border-radius: 2px;"></div>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">Matches</span>
                </div>
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                    <div style="width: 12px; height: 12px; background: var(--accent); border-radius: 2px;"></div>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">Downloads</span>
                </div>
            </div>
        </div>
    `;
}
