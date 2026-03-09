/**
 * JaénSports — API Facade
 * Promise-based API wrapping localStorage operations
 */
const JaenAPI = (() => {
    // Simulate network delay
    const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

    return {
        // Matches
        async getMatches(filters = {}) {
            await delay(150);
            let matches = JaenDB.getMatches();
            if (filters.sport && filters.sport !== 'all') matches = matches.filter(m => m.sport === filters.sport);
            if (filters.date) matches = matches.filter(m => m.date.startsWith(filters.date));
            if (filters.location && filters.location !== 'all') matches = matches.filter(m => m.facilityId === filters.location);
            if (filters.sort === 'price') matches.sort((a, b) => (a.totalPrice / a.maxPlayers) - (b.totalPrice / b.maxPlayers));
            else if (filters.sort === 'spots') matches.sort((a, b) => (a.maxPlayers - a.players.length) - (b.maxPlayers - b.players.length));
            else matches.sort((a, b) => new Date(a.date) - new Date(b.date));
            return matches;
        },

        async getMatch(id) {
            await delay(100);
            return JaenDB.getMatch(id);
        },

        async createMatch(data) {
            await delay(300);
            return JaenDB.createMatch(data);
        },

        async deleteMatch(id) {
            await delay(200);
            return JaenDB.deleteMatch(id);
        },

        async joinMatch(matchId) {
            await delay(250);
            const userName = JaenAuth.getUserName();
            return JaenDB.joinMatch(matchId, userName);
        },

        async leaveMatch(matchId) {
            await delay(250);
            const userName = JaenAuth.getUserName();
            return JaenDB.leaveMatch(matchId, userName);
        },

        // Facilities
        async getFacilities(sportFilter) {
            await delay(100);
            let facilities = JaenDB.getFacilities();
            if (sportFilter) facilities = facilities.filter(f => f.sports.includes(sportFilter));
            return facilities;
        },

        async getFacility(id) {
            await delay(50);
            return JaenDB.getFacility(id);
        },

        // User
        async getUser() {
            await delay(100);
            return JaenDB.getUser();
        },

        async updateUser(updates) {
            await delay(200);
            return JaenAuth.updateProfile(updates);
        },

        // Chat
        async sendChatMessage(matchId, text, sender = 'user') {
            await delay(150);
            return JaenDB.addChatMessage(matchId, { text, sender, author: JaenAuth.getUserName() });
        },

        // Payments
        async processPayment(matchId, method) {
            await delay(500);
            const match = JaenDB.getMatch(matchId);
            if (!match) return { success: false, error: 'Partido no encontrado' };
            const amount = (match.totalPrice / match.players.length).toFixed(2);
            return { success: true, amount: parseFloat(amount), method, matchTitle: match.title };
        },

        // Contact
        async sendContactMessage(data) {
            await delay(400);
            return { success: true, message: 'Mensaje enviado correctamente' };
        }
    };
})();
