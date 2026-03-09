/**
 * JaénSports — Notifications Module
 * Toast system, reminder scheduling — NO fake defaults
 */

const JaenNotifications = (() => {
    const STORAGE_KEY = 'jaensports_notifications';

    function getNotifications() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) try { return JSON.parse(raw); } catch (e) { }
        // Start empty — no fake notifications
        return [];
    }

    function saveNotifications(notifs) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
    }

    function addNotification(type, title, message) {
        const notifs = getNotifications();
        const notif = { id: 'n' + Date.now(), type, title, message, read: false, timestamp: new Date().toISOString() };
        notifs.unshift(notif);
        saveNotifications(notifs);
        updateBadge();
        showToast(type === 'reminder' ? 'warning' : 'info', title, message);
        return notif;
    }

    function markAllRead() {
        const notifs = getNotifications();
        notifs.forEach(n => n.read = true);
        saveNotifications(notifs);
        updateBadge();
    }

    function updateBadge() {
        const count = getNotifications().filter(n => !n.read).length;
        const badge = document.getElementById('notification-count');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? '' : 'none';
        }
    }

    // Schedule match reminders (only for logged in users with real matches)
    function scheduleReminders() {
        if (!JaenAuth.isLoggedIn()) return;

        const matches = JaenDB.getMatches();
        const userName = JaenAuth.getUserName();
        if (!userName) return;
        const now = new Date();

        matches.forEach(match => {
            if (!match.players.includes(userName)) return;
            const matchDate = new Date(match.date);
            const hoursUntil = (matchDate - now) / (1000 * 60 * 60);

            if (hoursUntil > 0 && hoursUntil < 48) {
                setTimeout(() => {
                    addNotification('reminder', 'Recordatorio de partido', `Tu partido "${match.title}" es ${hoursUntil < 24 ? 'mañana' : 'pasado mañana'} a las ${matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`);
                }, 10000 + Math.random() * 5000);
            }
        });
    }

    function init() {
        updateBadge();
        if (JaenAuth.isLoggedIn()) {
            setTimeout(scheduleReminders, 3000);
        }
    }

    return { getNotifications, addNotification, markAllRead, updateBadge, init };
})();

// Auto-init
document.addEventListener('DOMContentLoaded', () => JaenNotifications.init());
