/**
 * JaénSports — Dedicated Match Chat Page Logic (WhatsApp Style)
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('chat-sidebar-list')) return;

    function checkAndInit() {
        if (JaenAuth.isLoggedIn()) {
            initChatPage();
        } else {
            document.getElementById('chat-sidebar-list').innerHTML = '';
            document.querySelector('.chat-layout').innerHTML = `
            <div style="width:100%;height:calc(100vh - 80px);display:flex;align-items:center;justify-content:center;background:#f8fafc;flex-direction:column;text-align:center;padding:24px">
                <h3>Debes iniciar sesión para ver tus chats</h3>
                <p style="color:var(--color-gray-500);margin-bottom:20px">Accede a tu cuenta para coordinar tus partidos.</p>
                <a href="index.html" class="btn btn-primary">Volver al inicio</a>
            </div>`;
            if (typeof updateHeaderAuth === 'function') updateHeaderAuth();
        }
    }

    setTimeout(checkAndInit, 1200);
});

let chatCurrentMatchId = null;
let joinedMatches = [];

async function initChatPage() {
    const user = JaenAuth.getCurrentUser();
    const listEl = document.getElementById('chat-sidebar-list');

    // Load matches user is in
    const allMatches = await JaenAPI.getMatches();
    joinedMatches = allMatches.filter(m => m.players.includes(user.name));

    if (joinedMatches.length === 0) {
        listEl.innerHTML = `
        <div style="padding: 32px 16px; text-align: center;">
            <p style="color: var(--color-gray-500); margin-bottom: 16px;">No estás apuntado a ningún partido aún.</p>
            <a href="parties.html" class="btn btn-primary btn-sm">Buscar partidos</a>
        </div>`;
        return;
    }

    // Sort by date closest first
    joinedMatches.sort((a, b) => new Date(a.date) - new Date(b.date));

    renderSidebar();

    // Handle back button on mobile
    document.getElementById('chat-back-btn')?.addEventListener('click', () => {
        document.getElementById('chat-layout').classList.remove('chat-active');
    });

    // Handle send message
    document.getElementById('active-chat-send')?.addEventListener('click', sendCurrentMessage);
    document.getElementById('active-chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendCurrentMessage();
    });
}

const colorCache = {};
function getAvatarColor(name) {
    if (colorCache[name]) return colorCache[name];
    const colors = ['#f56565', '#ed8936', '#ecc94b', '#48bb78', '#38b2ac', '#4299e1', '#667eea', '#9f7aea', '#ed64a6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const color = colors[Math.abs(hash) % colors.length];
    colorCache[name] = color;
    return color;
}

function renderSidebar() {
    const listEl = document.getElementById('chat-sidebar-list');

    listEl.innerHTML = joinedMatches.map(m => {
        const sc = JaenDB.getSportConfig(m.sport);
        const d = new Date(m.date);
        const dateStr = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

        let lastMsgTxt = 'Partido creado';
        if (m.chatMessages && m.chatMessages.length > 0) {
            let txt = m.chatMessages[m.chatMessages.length - 1].text;
            lastMsgTxt = txt.replace(/<br\s*[\/]?>/gi, ' ').replace(/<[^>]*>?/gm, '').substring(0, 60);
        }

        const title = m.title || sc.name;
        const color = getAvatarColor(title);
        const initial = title.charAt(0).toUpperCase();

        return `
        <div class="chat-list-item ${m.id === chatCurrentMatchId ? 'active' : ''}" onclick="selectChat('${m.id}')" data-match="${m.id}">
            <div class="avatar" style="background:${color}">${initial}</div>
            <div class="chat-list-item-content">
                <div class="chat-list-item-title">${title} · ${dateStr}</div>
                <div class="chat-list-item-meta">${lastMsgTxt}</div>
            </div>
        </div>`;
    }).join('');
}

function selectChat(matchId) {
    chatCurrentMatchId = matchId;

    // Update sidebar UI
    document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.chat-list-item[data-match="${matchId}"]`)?.classList.add('active');

    const match = joinedMatches.find(m => m.id === matchId);
    if (!match) return;

    // Switch view
    document.getElementById('chat-empty-state').style.display = 'none';
    document.getElementById('chat-active-state').style.display = 'flex';
    document.getElementById('chat-layout').classList.add('chat-active'); // For mobile

    // Set Header
    const sc = JaenDB.getSportConfig(match.sport);
    const d = new Date(match.date);
    document.getElementById('active-chat-title').textContent = `${match.title || sc.name} · ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`;
    document.getElementById('active-chat-meta').textContent = `${match.players.length}/${match.maxPlayers} jugadores · ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

    // Render Messages
    renderMessages(match);
}

function renderMessages(match) {
    const container = document.getElementById('active-chat-messages');
    const userName = JaenAuth.getUserName();

    if (!match.chatMessages || match.chatMessages.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--color-gray-500);margin-top:20px">No hay mensajes aún. ¡Comienza a chatear!</div>';
        return;
    }

    const messagesHTML = match.chatMessages.map(msg => {
        const isSystem = msg.sender === 'system' || msg.author === '🤖 JaénSports Bot' || msg.author === 'Asistente IA';
        const isMe = msg.author === userName;

        let timeStr = '';
        if (msg.timestamp) {
            const t = new Date(msg.timestamp);
            timeStr = t.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }

        if (isSystem) {
            return `
            <div class="message-row system">
                <div class="message-bubble">
                    ${msg.text.replace(/\\n/g, '<br>')}
                    ${timeStr ? `<span class="message-time">${timeStr}</span>` : ''}
                </div>
            </div>`;
        }

        const color = getAvatarColor(msg.author);
        const initial = msg.author.charAt(0).toUpperCase();

        return `
        <div class="message-row ${isMe ? 'me' : 'other'}">
            <div class="message-avatar" style="background:${color}">${initial}</div>
            <div class="message-bubble">
                <div class="message-sender-name" style="color:${color}">${msg.author}</div>
                <div class="message-text">${msg.text.replace(/\\n/g, '<br>')}</div>
                <span class="message-time">${timeStr}</span>
            </div>
        </div>`;
    }).join('');

    const isFull = match.players.length >= match.maxPlayers;
    const viralPromptHTML = `
        <div class="message-row system" style="margin-top:24px;">
            <div class="message-bubble" style="background:var(--color-primary-50); border:1px solid var(--color-primary-200); color:var(--color-gray-800);">
                <strong>🤖 JaénSports Bot</strong><br>
                ${isFull ? '¡El partido ya está completo!' : 'Quedan pocas plazas para llenar este partido.'}<br>
                Si conoces a alguien más que quiera jugar, invítale a la web o <a href="create.html" style="color:var(--color-primary-600);font-weight:bold;text-decoration:underline;">crea un partido nuevo aquí ⚽</a>
            </div>
        </div>
    `;

    container.innerHTML = messagesHTML + viralPromptHTML;

    // Scroll to bottom
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 50);
}

async function sendCurrentMessage() {
    if (!chatCurrentMatchId) return;
    const input = document.getElementById('active-chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';

    // Simulate generic API/Local DB sending
    await JaenAPI.sendChatMessage(chatCurrentMatchId, msg);

    // Update local state and UI
    const match = joinedMatches.find(m => m.id === chatCurrentMatchId);
    if (!match.chatMessages) match.chatMessages = [];

    // API already added it to DB, but get it to re-render. Easiest is to force refresh current chat
    const updatedMatch = JaenDB.getMatch(chatCurrentMatchId);

    // Update local array ref
    const matchIndex = joinedMatches.findIndex(m => m.id === chatCurrentMatchId);
    joinedMatches[matchIndex] = updatedMatch;

    renderSidebar();
    renderMessages(updatedMatch);
}
