/**
 * JaénSports — AI Reminders Module
 * Automated reminders for matches, payments, and status changes
 */

const JaenReminders = (() => {
    const CHECK_INTERVAL = 30000; // Check every 30s
    let intervalId = null;

    function init() {
        // Initial check after 5s
        setTimeout(checkReminders, 5000);
        // Periodic checks
        intervalId = setInterval(checkReminders, CHECK_INTERVAL);
    }

    function checkReminders() {
        checkMatchReminders();
        checkPaymentReminders();
        checkSlotUpdates();
    }

    function checkMatchReminders() {
        const matches = JaenDB.getMatches();
        const userName = JaenAuth.getUserName();
        const now = new Date();

        matches.forEach(match => {
            if (!match.players.includes(userName)) return;
            const matchDate = new Date(match.date);
            const hoursUntil = (matchDate - now) / (1000 * 60 * 60);

            // 24-hour reminder (simulated as 10-second delay for demo)
            if (hoursUntil > 0 && hoursUntil < 36) {
                const reminderKey = `reminder_24h_${match.id}`;
                if (!sessionStorage.getItem(reminderKey)) {
                    sessionStorage.setItem(reminderKey, 'sent');
                    // Send to chat if chat is available
                    const sc = JaenDB.getSportConfig(match.sport);
                    const facility = JaenDB.getFacility(match.facilityId);
                    const timeStr = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    const dateStr = matchDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

                    const reminderText = `Recordatorio: tu partido de ${sc.name} es ${dateStr} a las ${timeStr} en ${facility ? facility.name : 'Jaén'}. ¡No faltes!`;

                    // Add to match chat as AI message
                    JaenDB.addChatMessage(match.id, {
                        text: reminderText,
                        sender: 'ai',
                        author: 'Asistente IA'
                    });
                }
            }
        });
    }

    function checkPaymentReminders() {
        const user = typeof JaenAuth !== 'undefined' ? JaenAuth.getCurrentUser() : null;
        if (!user || !user.payments) return;

        const pending = user.payments.filter(p => p.status === 'pending');
        if (pending.length > 0) {
            const reminderKey = 'reminder_payment_' + new Date().toDateString();
            if (!sessionStorage.getItem(reminderKey)) {
                sessionStorage.setItem(reminderKey, 'sent');
                // Schedule a subtle notification after some delay
                setTimeout(() => {
                    JaenNotifications.addNotification(
                        'reminder',
                        'Pago pendiente',
                        `Tienes ${pending.length} pago${pending.length > 1 ? 's' : ''} pendiente${pending.length > 1 ? 's' : ''} por valor de ${pending.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}€.`
                    );
                }, 15000);
            }
        }
    }

    function checkSlotUpdates() {
        const matches = JaenDB.getMatches();
        matches.forEach(match => {
            const spotsLeft = match.maxPlayers - match.players.length;
            // Auto-close when full
            if (spotsLeft === 0 && match.status === 'open') {
                JaenDB.updateMatch(match.id, { status: 'full' });
            }
            // Auto-reopen when spots available
            if (spotsLeft > 0 && match.status === 'full') {
                JaenDB.updateMatch(match.id, { status: 'open' });
            }
        });
    }

    // Generate match summary for chat
    function generateMatchSummary(matchId) {
        const match = JaenDB.getMatch(matchId);
        if (!match) return null;

        const sc = JaenDB.getSportConfig(match.sport);
        const facility = JaenDB.getFacility(match.facilityId);
        const d = new Date(match.date);
        const spotsLeft = match.maxPlayers - match.players.length;
        const perPlayer = (match.totalPrice / match.maxPlayers).toFixed(2);

        return {
            title: match.title || sc.name,
            sport: sc.name,
            date: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
            time: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            facility: facility ? facility.name : 'Por definir',
            players: `${match.players.length}/${match.maxPlayers}`,
            spotsLeft,
            pricePerPlayer: perPlayer + '€',
            status: spotsLeft === 0 ? 'Completo' : 'Plazas disponibles',
            suggestion: spotsLeft <= 2 && spotsLeft > 0
                ? `¡Solo quedan ${spotsLeft} plaza${spotsLeft > 1 ? 's' : ''}! Comparte el enlace para completar el partido.`
                : spotsLeft === 0
                    ? 'El partido está completo. Se abrirán plazas si alguien cancela.'
                    : `Faltan ${spotsLeft} jugadores. Invita a tus amigos.`
        };
    }

    // Suggest who should book the facility
    function suggestBooker(matchId) {
        const match = JaenDB.getMatch(matchId);
        if (!match) return null;
        // Suggest the organizer
        return {
            suggested: match.organizer,
            reason: `${match.organizer} es el organizador del partido y puede reservar la pista en el Patronato de Deportes.`
        };
    }

    function stop() {
        if (intervalId) clearInterval(intervalId);
    }

    return { init, checkReminders, generateMatchSummary, suggestBooker, stop };
})();

document.addEventListener('DOMContentLoaded', () => JaenReminders.init());
