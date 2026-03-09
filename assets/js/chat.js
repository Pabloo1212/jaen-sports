/**
 * JaénSports — Group Chat Module
 * Chat per match with AI moderation features
 */

const JaenGroupChat = (() => {
    let currentMatchId = null;

    function openMatchChat(matchId) {
        currentMatchId = matchId;
        const match = JaenDB.getMatch(matchId);
        if (!match) return;

        const sc = JaenDB.getSportConfig(match.sport);
        const panel = document.getElementById('chat-panel');
        const messages = document.getElementById('chat-messages');
        const header = panel.querySelector('.chat-header h4');

        if (header) header.textContent = `Chat — ${match.title || sc.name}`;

        // Load existing messages
        messages.innerHTML = '';
        if (match.chatMessages && match.chatMessages.length > 0) {
            match.chatMessages.forEach(msg => {
                addGroupMessage(msg.text, msg.sender, msg.author);
            });
        } else {
            // Welcome message
            const welcomeMsg = `¡Bienvenidos al chat del partido de ${sc.name}! Soy el asistente IA y os ayudaré con recordatorios y coordinación. Actualmente hay ${match.players.length}/${match.maxPlayers} jugadores inscritos.`;
            addGroupMessage(welcomeMsg, 'ai', 'Asistente IA');
            JaenDB.addChatMessage(matchId, { text: welcomeMsg, sender: 'ai', author: 'Asistente IA' });
        }

        // Open panel
        panel.classList.add('open');

        // Override send behavior
        const sendBtn = document.getElementById('chat-send');
        const input = document.getElementById('chat-input');
        const newSend = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSend, sendBtn);
        newSend.id = 'chat-send';

        const sendGroupMsg = () => {
            const text = input.value.trim();
            if (!text) return;
            const userName = JaenAuth.getUserName();
            addGroupMessage(text, 'user', userName);
            JaenDB.addChatMessage(matchId, { text, sender: 'user', author: userName });
            input.value = '';

            // AI auto-moderation responses
            setTimeout(() => checkForAIResponse(text, matchId), 800);
        };

        newSend.addEventListener('click', sendGroupMsg);
        input.onkeypress = (e) => { if (e.key === 'Enter') sendGroupMsg(); };
    }

    function addGroupMessage(text, sender, author) {
        const messages = document.getElementById('chat-messages');
        if (!messages) return;

        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender === 'user' ? 'user' : 'bot'}`;

        if (sender !== 'user') {
            const label = document.createElement('div');
            label.style.cssText = 'font-size:11px;font-weight:600;margin-bottom:2px;opacity:0.7';
            label.textContent = author || (sender === 'ai' ? 'Asistente IA' : 'Sistema');
            bubble.appendChild(label);
        }

        const textEl = document.createElement('span');
        textEl.textContent = text;
        bubble.appendChild(textEl);

        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
    }

    function checkForAIResponse(text, matchId) {
        const lower = text.toLowerCase();
        let response = null;

        if (lower.includes('pago') || lower.includes('bizum') || lower.includes('pagado')) {
            const match = JaenDB.getMatch(matchId);
            if (match) {
                const perPlayer = (match.totalPrice / match.players.length).toFixed(2);
                response = `Recordatorio de pago: cada jugador debe abonar ${perPlayer}€. Podéis pagar por Bizum o tarjeta desde la app. ¡Gracias por colaborar!`;
            }
        } else if (lower.includes('hora') || lower.includes('cuando') || lower.includes('cuándo')) {
            const match = JaenDB.getMatch(matchId);
            if (match) {
                const d = new Date(match.date);
                response = `El partido es el ${d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}. ¡No lleguéis tarde!`;
            }
        } else if (lower.includes('quién falta') || lower.includes('plazas') || lower.includes('cuántos')) {
            const match = JaenDB.getMatch(matchId);
            if (match) {
                const left = match.maxPlayers - match.players.length;
                response = left > 0
                    ? `Faltan ${left} jugador${left > 1 ? 'es' : ''} para completar el partido. Inscritos: ${match.players.join(', ')}.`
                    : `¡El partido está completo! Jugadores: ${match.players.join(', ')}.`;
            }
        } else if (lower.includes('reserva') || lower.includes('pista') || lower.includes('quién reserva')) {
            const match = JaenDB.getMatch(matchId);
            if (match) {
                response = `Sugerencia: ${match.organizer} (organizador) podría encargarse de reservar la pista en el Patronato de Deportes. Enlace directo: jaen.es/patronato-municipal-deportes`;
            }
        }

        if (response) {
            addGroupMessage(response, 'ai', 'Asistente IA');
            JaenDB.addChatMessage(matchId, { text: response, sender: 'ai', author: 'Asistente IA' });
        }
    }

    // Generate conversation summary
    function summarizeChat(matchId) {
        const match = JaenDB.getMatch(matchId);
        if (!match || !match.chatMessages.length) return 'No hay mensajes en este chat.';

        const userMessages = match.chatMessages.filter(m => m.sender === 'user');
        const topics = [];
        userMessages.forEach(m => {
            const lower = m.text.toLowerCase();
            if (lower.includes('pago') || lower.includes('bizum')) topics.push('pagos');
            if (lower.includes('hora') || lower.includes('cuando')) topics.push('horarios');
            if (lower.includes('falta') || lower.includes('plaza')) topics.push('plazas');
        });

        const uniqueTopics = [...new Set(topics)];
        return `Resumen del chat: ${match.chatMessages.length} mensajes de ${new Set(match.chatMessages.filter(m => m.sender === 'user').map(m => m.author)).size} participantes. Temas tratados: ${uniqueTopics.length ? uniqueTopics.join(', ') : 'conversación general'}.`;
    }

    return { openMatchChat, addGroupMessage, summarizeChat };
})();
