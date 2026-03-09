/**
 * JaénSports — Database Layer
 * localStorage-backed data store — ONLY football sports, NO seed data
 */

const JaenDB = (() => {
    const STORAGE_KEY = 'jaensports_db';
    const DB_VERSION = 5; // Bump to force reset of old data

    // ONLY football sports
    const SPORT_CONFIG = {
        futsal: { name: 'Fútbol Sala', maxPlayers: 10, icon: 'futsal' },
        futbol7: { name: 'Fútbol 7', maxPlayers: 14, icon: 'football' },
        futbol11: { name: 'Fútbol 11', maxPlayers: 22, icon: 'football' }
    };

    const FACILITIES = [
        // FUTBOL SALA
        { id: 'futsal-salobreja-pab', name: 'Pabellón Salobreja', address: 'Jaén', covered: true, lights: true, sports: ['futsal'], bookingUrl: 'https://dmzwin.aytojaen.es/CronosWeb/Login', image: 'assets/images/pabellon-salobreja.jpg' },
        { id: 'futsal-fuentezuelas-pab', name: 'Pista pabellón Fuentezuelas', address: 'Jaén', covered: true, lights: true, sports: ['futsal'], bookingUrl: 'https://dmzwin.aytojaen.es/CronosWeb/Login', image: 'assets/images/pabellon-fuentezuelas.jpg' },
        { id: 'futsal-salobreja-ext3', name: 'Pista 3 Exterior Salobreja', address: 'Jaén', covered: false, lights: true, sports: ['futsal'], bookingUrl: 'https://dmzwin.aytojaen.es/CronosWeb/Login', image: 'assets/images/facility-outdoor.png' },
        { id: 'futsal-fuentezuelas-p1', name: 'P1 Fuentezuelas (Aire libre)', address: 'Jaén', covered: false, lights: true, sports: ['futsal'], bookingUrl: 'https://dmzwin.aytojaen.es/CronosWeb/Login', image: 'assets/images/pista1-fuentezuelas.jpg' },
        { id: 'futsal-fuentezuelas-p2', name: 'P2 Fuentezuelas (Aire libre)', address: 'Jaén', covered: false, lights: true, sports: ['futsal'], bookingUrl: 'https://dmzwin.aytojaen.es/CronosWeb/Login', image: 'assets/images/pista2-fuentezuelas.jpg' },
        { id: 'futsal-salobreja-cub5', name: 'Pista 5 Salobreja (Cubierta)', address: 'Jaén', covered: true, lights: true, sports: ['futsal'], bookingUrl: 'https://dmzwin.aytojaen.es/CronosWeb/Login', image: 'assets/images/pista-cover-salobreja.jpg' },
        { id: 'futsal-salobreja-cub6', name: 'Pista 6 Salobreja (Cubierta)', address: 'Jaén', covered: true, lights: true, sports: ['futsal'], bookingUrl: 'https://dmzwin.aytojaen.es/CronosWeb/Login', image: 'assets/images/pista-cover-salobreja.jpg' },
        // FUTBOL 11
        { id: 'f11-fuentezuelas', name: 'Campo de fútbol Fuentezuelas', address: 'Jaén', covered: false, lights: true, sports: ['futbol11'], bookingUrl: 'https://dmzwin.aytojaen.es/CronosWeb/Login', image: 'assets/images/campo-fuentezuelas.jpg' },
        // FUTBOL 7
        { id: 'f7-fernando-arevalo', name: 'Campo fútbol 7 Salobreja', address: 'Jaén', covered: false, lights: true, sports: ['futbol7'], bookingUrl: 'https://dmzwin.aytojaen.es/CronosWeb/Login', image: 'assets/images/campo-arevalo.jpg' },
        { id: 'f7-fuentezuelas-1', name: 'Fútbol 7 nº 1 Fuentezuelas', address: 'Jaén', covered: false, lights: true, sports: ['futbol7'], bookingUrl: 'https://dmzwin.aytojaen.es/CronosWeb/Login', image: 'assets/images/facility-outdoor.png' },
        { id: 'f7-fuentezuelas-2', name: 'Fútbol 7 nº 2 Fuentezuelas', address: 'Jaén', covered: false, lights: true, sports: ['futbol7'], bookingUrl: 'https://dmzwin.aytojaen.es/CronosWeb/Login', image: 'assets/images/facility-outdoor.png' }
    ];

    // Init or retrieve DB — version check forces reset of old/fake data
    function getDB() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const db = JSON.parse(raw);
                if (db.version === DB_VERSION) return db;
                // Old version → reset everything
            } catch (e) { /* fall through */ }
        }
        // Clean init — no fake data
        const db = { matches: [], users: [], version: DB_VERSION };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        return db;
    }

    function saveDB(db) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }

    // Public API
    return {
        SPORT_CONFIG,
        FACILITIES,

        getMatches() { return getDB().matches; },

        getMatch(id) { return getDB().matches.find(m => m.id === id) || null; },

        createMatch(match) {
            const db = getDB();

            // Overlapping validation logic (Timestamp based)
            if (match.date && match.facilityId) {
                const newStartMs = new Date(match.date).getTime();

                // Prevent scheduling in the past
                if (newStartMs < Date.now()) {
                    return { success: false, error: 'Oye, ¡no puedes viajar en el tiempo! Selecciona una hora y fecha futura en la que jugar el partido.' };
                }

                const durationMinutes = match.duration || 90; // Default 90 minutos de partido
                const newEndMs = newStartMs + durationMinutes * 60000;

                const hasConflict = db.matches.some(m => {
                    if (m.status === 'cancelled') return false;
                    if (m.facilityId !== match.facilityId) return false;

                    const existingStartMs = new Date(m.date).getTime();
                    if (isNaN(existingStartMs)) return false;
                    const existingDurationMinutes = m.duration || 90;
                    const existingEndMs = existingStartMs + existingDurationMinutes * 60000;

                    // Comprobar solapamiento: empieza antes de que el otro acabe, y acaba después de que el otro empiece
                    return (existingStartMs < newEndMs) && (existingEndMs > newStartMs);
                });

                if (hasConflict) {
                    return { success: false, error: 'A esa hora y en esa pista ya hay un partido programado (o se cruzan los horarios). Por favor elige otra.' };
                }
            }

            match.id = 'm' + Date.now();
            match.status = 'open';
            match.chatMessages = [];
            match.createdAt = new Date().toISOString();
            db.matches.unshift(match);
            saveDB(db);
            return { success: true, match };
        },

        updateMatch(id, updates) {
            const db = getDB();
            const idx = db.matches.findIndex(m => m.id === id);
            if (idx === -1) return null;
            db.matches[idx] = { ...db.matches[idx], ...updates };
            saveDB(db);
            return db.matches[idx];
        },

        deleteMatch(id) {
            const db = getDB();
            const idx = db.matches.findIndex(m => m.id === id);
            if (idx === -1) return false;
            db.matches.splice(idx, 1);
            saveDB(db);
            return true;
        },

        joinMatch(matchId, playerName) {
            const db = getDB();
            const match = db.matches.find(m => m.id === matchId);
            if (!match) return { success: false, error: 'Partido no encontrado' };
            if (match.players.length >= match.maxPlayers) return { success: false, error: 'Partido completo' };
            if (match.players.includes(playerName)) return { success: false, error: 'Ya estás inscrito' };
            match.players.push(playerName);
            // System message to chat
            match.chatMessages.push({
                id: 'msg' + Date.now(),
                text: `${playerName} se ha unido al partido. ¡Bienvenid@!`,
                sender: 'system',
                author: 'Sistema',
                timestamp: new Date().toISOString()
            });
            if (match.players.length >= match.maxPlayers) {
                match.status = 'full';
                match.chatMessages.push({
                    id: 'msg' + (Date.now() + 1),
                    text: '🎉 ¡Partido completo! Ya podéis reservar la pista.',
                    sender: 'system',
                    author: 'Sistema',
                    timestamp: new Date().toISOString()
                });
            }
            saveDB(db);
            return { success: true, match };
        },

        leaveMatch(matchId, playerName) {
            const db = getDB();
            const match = db.matches.find(m => m.id === matchId);
            if (!match) return { success: false, error: 'Partido no encontrado' };
            const idx = match.players.indexOf(playerName);
            if (idx === -1) return { success: false, error: 'No estás inscrito' };
            match.players.splice(idx, 1);
            if (match.status === 'full') match.status = 'open';
            match.chatMessages.push({
                id: 'msg' + Date.now(),
                text: `${playerName} ha salido del partido. Se ha liberado una plaza.`,
                sender: 'system',
                author: 'Sistema',
                timestamp: new Date().toISOString()
            });
            saveDB(db);
            return { success: true, match };
        },

        addChatMessage(matchId, message) {
            const db = getDB();
            const match = db.matches.find(m => m.id === matchId);
            if (!match) return null;
            match.chatMessages.push({ ...message, id: 'msg' + Date.now(), timestamp: new Date().toISOString() });
            saveDB(db);
            return match.chatMessages;
        },

        // ========== USERS ==========
        getUsers() { return getDB().users || []; },

        findUserByEmail(email) {
            return (getDB().users || []).find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
        },

        findUserById(id) {
            return (getDB().users || []).find(u => u.id === id) || null;
        },

        createUser(userData) {
            const db = getDB();
            if (!db.users) db.users = [];
            const user = {
                id: 'u' + Date.now(),
                name: userData.name,
                email: userData.email,
                password: userData.password || null,
                phone: userData.phone || '',
                avatar: null,
                location: 'Jaén Capital',
                matchesPlayed: 0,
                matchesOrganized: 0,
                reliability: 100,
                notifications: { reminders: true, confirmations: true, payments: true, weekly: false },
                payments: [],
                createdAt: new Date().toISOString()
            };
            db.users.push(user);
            saveDB(db);
            return user;
        },

        updateUser(userId, updates) {
            const db = getDB();
            if (!db.users) return null;
            const idx = db.users.findIndex(u => u.id === userId);
            if (idx === -1) return null;
            db.users[idx] = { ...db.users[idx], ...updates };
            saveDB(db);
            return db.users[idx];
        },

        getFacilities(sport) {
            if (sport) return FACILITIES.filter(f => f.sports.includes(sport));
            return FACILITIES;
        },
        getFacility(id) { return FACILITIES.find(f => f.id === id) || null; },
        getSportConfig(sport) { return SPORT_CONFIG[sport] || null; },

        // Stats helpers — real data only
        getStats() {
            const db = getDB();
            return {
                totalUsers: (db.users || []).length,
                totalMatches: db.matches.length,
                openMatches: db.matches.filter(m => m.status === 'open').length
            };
        },

        resetDB() {
            localStorage.removeItem(STORAGE_KEY);
            return getDB();
        }
    };
})();
