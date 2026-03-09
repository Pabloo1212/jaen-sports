/**
 * JaénSports — Parties Module
 * Match listing, filtering, calendar view, create flow, match chat
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('matches-grid')) initPartiesPage();
    if (document.getElementById('create-form')) initCreatePage();
});

// ========== PARTIES PAGE ==========
function initPartiesPage() {
    renderPartiesPage();
    initFilters();
    initViewToggle();
    initCalendar();
    initMatchModal();
}

async function renderPartiesPage() {
    const grid = document.getElementById('matches-grid');
    if (!grid) return;

    const filters = {
        sport: document.getElementById('filter-sport')?.value || 'all',
        date: document.getElementById('filter-date')?.value || '',
        location: document.getElementById('filter-location')?.value || 'all',
        sort: document.getElementById('sort-select')?.value || 'date'
    };

    const matches = await JaenAPI.getMatches(filters);
    const count = document.getElementById('results-count');
    if (count) count.textContent = `${matches.length} partido${matches.length !== 1 ? 's' : ''} encontrado${matches.length !== 1 ? 's' : ''}`;

    if (matches.length === 0) {
        grid.innerHTML = `
        <div class="text-center" style="grid-column:1/-1;padding:var(--space-16)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-300)" stroke-width="1.5" style="width:64px;height:64px;margin:0 auto var(--space-4)">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="12,6 15.5,9.5 14,14 10,14 8.5,9.5"/>
            </svg>
            <h3 style="color:var(--color-gray-400);margin-bottom:var(--space-4)">No hay partidos disponibles</h3>
            <p class="text-muted" style="margin-bottom:var(--space-4)">Prueba a cambiar los filtros o crea un partido nuevo.</p>
            <a href="create.html" class="btn btn-primary" style="margin-top:var(--space-4)">Crea tu Partido</a>
        </div>`;
    } else {
        grid.innerHTML = matches.map(m => renderMatchCard(m)).join('');
    }

    initRevealAnimations();
}

function initFilters() {
    const sportFilter = document.getElementById('filter-sport');
    const dateFilter = document.getElementById('filter-date');
    const locationFilter = document.getElementById('filter-location');
    const sortSelect = document.getElementById('sort-select');

    [sportFilter, dateFilter, locationFilter, sortSelect].forEach(el => {
        if (el) el.addEventListener('change', debounce(renderPartiesPage, 200));
    });

    // Set sport from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('sport') && sportFilter) {
        sportFilter.value = params.get('sport');
        renderPartiesPage();
    }
}

function initViewToggle() {
    const gridBtn = document.getElementById('view-grid');
    const calBtn = document.getElementById('view-calendar');
    const gridView = document.getElementById('matches-grid');
    const calView = document.getElementById('calendar-view');

    if (!gridBtn || !calBtn) return;

    gridBtn.addEventListener('click', () => {
        gridBtn.classList.add('active'); calBtn.classList.remove('active');
        gridView.style.display = ''; calView.style.display = 'none';
    });

    calBtn.addEventListener('click', () => {
        calBtn.classList.add('active'); gridBtn.classList.remove('active');
        gridView.style.display = 'none'; calView.style.display = '';
        renderCalendar();
    });
}

// ========== CALENDAR VIEW ==========
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

function initCalendar() {
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');
    if (!prevBtn) return;
    prevBtn.addEventListener('click', () => { calendarMonth--; if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; } renderCalendar(); });
    nextBtn.addEventListener('click', () => { calendarMonth++; if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; } renderCalendar(); });
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('cal-month-title');
    if (!grid) return;

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    title.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const today = new Date();

    const matches = JaenDB.getMatches().filter(m => {
        const d = new Date(m.date);
        return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
    });

    let html = dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

    const prevDays = new Date(calendarYear, calendarMonth, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month"><div class="calendar-day-number">${prevDays - i}</div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
        const dayMatches = matches.filter(m => new Date(m.date).getDate() === day);
        html += `<div class="calendar-day ${isToday ? 'today' : ''}">
      <div class="calendar-day-number">${day}</div>
      ${dayMatches.slice(0, 2).map(m => `<div class="calendar-event ${m.sport}" onclick="openMatchModal('${m.id}')">${new Date(m.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} ${JaenDB.getSportConfig(m.sport).name}</div>`).join('')}
      ${dayMatches.length > 2 ? `<div style="font-size:9px;color:var(--color-gray-500)">+${dayMatches.length - 2} más</div>` : ''}
    </div>`;
    }

    const totalCells = startDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month"><div class="calendar-day-number">${i}</div></div>`;
    }

    grid.innerHTML = html;
}

// ========== MATCH MODAL (with Chat) ==========
function initMatchModal() {
    const overlay = document.getElementById('match-modal');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    if (!overlay) return;

    closeBtn?.addEventListener('click', () => overlay.classList.remove('active'));
    cancelBtn?.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
}

function openMatchModal(matchId, openChat = false) {
    const match = JaenDB.getMatch(matchId);
    if (!match) return;
    const overlay = document.getElementById('match-modal');
    const title = document.getElementById('modal-match-title');
    const body = document.getElementById('modal-match-body');
    const joinBtn = document.getElementById('modal-join-btn');
    const facility = JaenDB.getFacility(match.facilityId);
    const sc = JaenDB.getSportConfig(match.sport);
    const d = new Date(match.date);
    const pricePerPlayer = (match.totalPrice / match.maxPlayers).toFixed(2);
    const spotsLeft = match.maxPlayers - match.players.length;
    const isFull = match.status === 'full' || spotsLeft === 0;
    const isLoggedIn = JaenAuth.isLoggedIn();
    const userName = JaenAuth.getUserName();
    const isInMatch = isLoggedIn && match.players.includes(userName);

    title.textContent = match.title || sc.name;

    // Setup "Ir al Chat de Grupo" button logic if user is in the match
    let chatButtonHTML = '';
    if (isInMatch) {
        chatButtonHTML = `
        <div style="margin-top:var(--space-4);text-align:center;">
             <a href="chat.html" class="btn btn-secondary btn-md" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                Ir al Chat de Grupo
             </a>
        </div>`;
    }

    let bookingHTML = '';
    if (isFull && facility) {
        bookingHTML = `
        <div style="margin-top:var(--space-4);background:linear-gradient(135deg, var(--color-success-50), var(--color-primary-50));border-radius:var(--radius-lg);padding:var(--space-4);text-align:center;border:1px solid var(--color-success-200)">
            <p style="font-size:var(--text-md);font-weight:var(--weight-semibold);color:var(--color-success-700);margin-bottom:var(--space-2)">🎉 ¡Partido completo! Ya podéis reservar la pista</p>
            
            <div style="background:var(--color-white);padding:16px;border-radius:8px;margin:16px 0;text-align:left;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
                <p style="font-size:14px;font-weight:600;color:var(--color-primary-800);margin-bottom:12px;display:flex;align-items:center;gap:6px">
                    <span>⚠️</span> PASOS OBLIGATORIOS PARA PAGAR LA PISTA
                </p>
                <ol style="margin:0;padding-left:22px;font-size:13px;color:#475569;margin-bottom:14px;line-height:1.6">
                    <li style="margin-bottom:6px">Haz clic en el botón de abajo para ir al Patronato Municipal.</li>
                    <li style="margin-bottom:6px">Selecciona obligatoriamente la opción <strong>"Acceso con usuario/contraseña"</strong> e inicia sesión.</li>
                    <li>Busca la instalación asignada y realiza el pago.</li>
                </ol>
                <img src="assets/images/patronato-login.jpg" style="width:100%;border-radius:6px;border:1px solid #cbd5e1;cursor:pointer" alt="Login Patronato" title="Ejemplo de inicio de sesión">
            </div>

            <a href="${facility.bookingUrl}" target="_blank" rel="noopener" class="btn btn-accent btn-md" style="width:100%">
                ${getIconSVG('externalLink')} Reservar en ${facility.name}
            </a>
        </div>`;
    }

    body.innerHTML = `
    <div>
        <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-4)">
          <span class="sport-badge ${match.sport}">${sc.name}</span>
          <span class="badge ${isFull ? 'badge-success' : spotsLeft <= 2 ? 'badge-warning' : 'badge-primary'}">${isFull ? '✅ Completo' : spotsLeft + ' plazas libres'}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-6)">
          <div><p style="font-size:var(--text-xs);color:var(--color-gray-500);margin-bottom:2px">Fecha</p><p style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${formatDate(d)}</p></div>
          <div><p style="font-size:var(--text-xs);color:var(--color-gray-500);margin-bottom:2px">Hora</p><p style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${formatTime(d)}</p></div>
          <div><p style="font-size:var(--text-xs);color:var(--color-gray-500);margin-bottom:2px">Pista</p><p style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${facility ? facility.name : '—'}</p></div>
          <div><p style="font-size:var(--text-xs);color:var(--color-gray-500);margin-bottom:2px">Jugadores</p><p style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${match.players.length}/${match.maxPlayers}</p></div>
        </div>
        <div>
          <p style="font-size:var(--text-sm);font-weight:var(--weight-semibold);margin-bottom:var(--space-3)">Lista de Jugadores</p>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">${match.players.map(p => `<span class="badge badge-primary">${p}</span>`).join('')}</div>
        </div>
        ${bookingHTML}
        ${chatButtonHTML}
    </div>
  `;

    // Handle initial state of join button
    if (isInMatch) {
        joinBtn.textContent = 'Ya estás apuntado';
        joinBtn.disabled = true;
        joinBtn.className = 'btn btn-secondary';
    } else if (isFull) {
        joinBtn.textContent = 'Partido Completo';
        joinBtn.disabled = true;
        joinBtn.className = 'btn btn-primary';
        joinBtn.onclick = null;
    } else {
        joinBtn.textContent = 'Apúntate al partido';
        joinBtn.disabled = false;
        joinBtn.className = 'btn btn-primary';
        joinBtn.onclick = async () => {
            if (!JaenAuth.requireLogin()) return;
            await handleJoinMatch(match.id);
            overlay.classList.remove('active');
        };
    }

    overlay.classList.add('active');
}

// Send chat message from modal
async function sendMatchChat(matchId) {
    const input = document.getElementById('modal-chat-input');
    if (!input || !input.value.trim()) return;
    if (!JaenAuth.requireLogin()) return;

    await JaenAPI.sendChatMessage(matchId, input.value.trim());
    input.value = '';
    // Re-open modal with Chat Tab active to refresh chat and scroll to bottom
    openMatchModal(matchId, true);
}

// ========== CREATE PAGE ==========
let createState = { step: 1, sport: null, facilityId: null, maxPlayers: 0 };

function initCreatePage() {
    initSportSelector();
    initCreateNav();
    initPublish();
}

function initSportSelector() {
    const options = document.querySelectorAll('.sport-option');
    const nextBtn = document.getElementById('next-1');
    options.forEach(opt => {
        const select = () => {
            options.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            createState.sport = opt.dataset.sport;
            createState.maxPlayers = parseInt(opt.dataset.max);
            nextBtn.disabled = false;

            const groupSelect = document.getElementById('match-group-size');
            if (groupSelect) {
                let html = '<option value="1" selected>Soy yo solo (1 persona)</option>';
                for (let i = 2; i <= createState.maxPlayers - 1; i++) {
                    html += `<option value="${i}">Tengo un grupo (${i} personas)</option>`;
                }
                groupSelect.innerHTML = html;
            }
        };
        opt.addEventListener('click', select);
        opt.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
    });
}

function initCreateNav() {
    document.getElementById('next-1')?.addEventListener('click', () => { goToStep(2); renderFacilitySelector(); });
    document.getElementById('next-2')?.addEventListener('click', () => goToStep(3));
    document.getElementById('next-3')?.addEventListener('click', () => {
        const dateInput = document.getElementById('match-date')?.value;
        const timeInput = document.getElementById('match-time')?.value;

        if (!dateInput || !timeInput) {
            if (typeof showToast === 'function') {
                showToast('error', 'Faltan datos', 'La fecha y la hora del partido son obligatorias.');
            } else {
                alert('La fecha y la hora del partido son obligatorias.');
            }
            return;
        }

        goToStep(4);
        renderMatchPreview();
    });

    document.getElementById('prev-2')?.addEventListener('click', () => goToStep(1));
    document.getElementById('prev-3')?.addEventListener('click', () => goToStep(2));
    document.getElementById('prev-4')?.addEventListener('click', () => goToStep(3));


}

function goToStep(step) {
    createState.step = step;
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.getElementById('step-' + step)?.classList.add('active');

    document.querySelectorAll('#form-steps .step').forEach(s => {
        const n = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');
        if (n === step) s.classList.add('active');
        else if (n < step) s.classList.add('completed');
    });
}

async function renderFacilitySelector() {
    const container = document.getElementById('facility-selector');
    const nextBtn = document.getElementById('next-2');
    if (!container) return;

    const facilities = await JaenAPI.getFacilities(createState.sport);
    container.innerHTML = facilities.map(f => `
    <div class="facility-card" data-facility="${f.id}" onclick="selectFacility('${f.id}')" style="cursor:pointer" role="button" tabindex="0">
      <img src="${f.image}" alt="${f.name}" class="facility-card-img" loading="lazy" width="400" height="180">
      <div class="facility-card-body">
        <h4>${f.name}</h4>
        <div class="facility-tags">
          ${f.covered ? '<span class="facility-tag">Cubierta</span>' : '<span class="facility-tag">Exterior</span>'}
          ${f.lights ? '<span class="facility-tag">Iluminación</span>' : ''}

        </div>
        <p style="font-size:var(--text-xs);color:var(--color-gray-500)">${f.address}</p>
      </div>
    </div>
  `).join('');

    nextBtn.disabled = true;
}

function selectFacility(id) {
    createState.facilityId = id;
    document.querySelectorAll('#facility-selector .facility-card').forEach(c => c.style.borderColor = '');
    const selected = document.querySelector(`[data-facility="${id}"]`);
    if (selected) selected.style.borderColor = 'var(--color-primary-500)';
    document.getElementById('next-2').disabled = false;

    const f = JaenDB.getFacility(id);
    if (f) {
        const priceInput = document.getElementById('match-price');
        if (priceInput && !priceInput.value) {
            priceInput.value = f.price;
            priceInput.dispatchEvent(new Event('input'));
        }
    }
}

function renderMatchPreview() {
    const preview = document.getElementById('match-preview');
    if (!preview) return;
    const timeSelect = document.getElementById('match-time');
    const timeDisplay = timeSelect && timeSelect.selectedIndex > 0
        ? timeSelect.options[timeSelect.selectedIndex].text
        : (timeSelect ? timeSelect.value : '');

    const sc = JaenDB.getSportConfig(createState.sport);
    const f = JaenDB.getFacility(createState.facilityId);
    const dateInput = document.getElementById('match-date')?.value || '';
    const dateStr = dateInput ? new Date(dateInput).toLocaleDateString('es-ES') : '';

    // Group size
    const groupSizeEl = document.getElementById('match-group-size');
    const groupSize = groupSizeEl ? parseInt(groupSizeEl.value) : 1;

    preview.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4)"><span class="sport-badge ${createState.sport}">${sc.name}</span><h4 style="font-size:var(--text-lg)">${sc.name}</h4></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
      <div><p style="font-size:var(--text-xs);color:var(--color-gray-500)">Pista</p><p style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${f ? f.name : '—'}</p></div>
      <div><p style="font-size:var(--text-xs);color:var(--color-gray-500)">Fecha y hora</p><p style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${dateStr} · ${timeDisplay}</p></div>
      <div><p style="font-size:var(--text-xs);color:var(--color-gray-500)">Plazas ocupadas</p><p style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${groupSize} / ${createState.maxPlayers}</p></div>
    </div>
    <div style="margin-top:var(--space-4);padding:var(--space-3);background:var(--color-primary-50);border-radius:var(--radius-md);border:1px solid var(--color-primary-200)">
        <p style="font-size:var(--text-xs);color:var(--color-primary-700)">📋 Al publicar el partido se creará un chat grupal para organizar el pago y la reserva de la pista.</p>
    </div>
  `;
}

function initPublish() {
    const btn = document.getElementById('publish-match');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        // Require login
        if (!JaenAuth.requireLogin()) return;

        const sc = JaenDB.getSportConfig(createState.sport);
        const userName = JaenAuth.getUserName();

        const groupSizeEl = document.getElementById('match-group-size');
        const groupSize = groupSizeEl ? parseInt(groupSizeEl.value) : 1;
        let initialPlayers = [userName];
        const firstName = userName.split(' ')[0];
        for (let i = 1; i < groupSize; i++) {
            initialPlayers.push(`${firstName} +${i}`);
        }

        const match = {
            sport: createState.sport,
            title: sc.name,
            facilityId: createState.facilityId,
            date: new Date(document.getElementById('match-date')?.value + 'T' + document.getElementById('match-time')?.value).toISOString(),
            totalPrice: 0,
            players: initialPlayers,
            maxPlayers: createState.maxPlayers,
            organizer: userName,
            notes: ''
        };

        const result = await JaenAPI.createMatch(match);

        if (!result.success) {
            showToast('error', 'Error al crear partido', result.error);
            // Re-enable button
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><polyline points="20 6 9 17 4 12"/></svg> Publicar Partido`;
            btn.disabled = false;
            return;
        }

        const created = result.match;

        // Add initial chat message from Bot
        JaenDB.addChatMessage(created.id, {
            text: `🤖 JaénSports Bot<br><br>¡Partido publicado! 🚀 En este grupo gestionáis entre vosotros el método de pago (Bizum, efectivo, etc.).<br><br>⚠️ IMPORTANTE PARA RESERVAR ⚠️<br>Para reservar la pista, es obligatorio iniciar sesión en el Patronato de Deportes de Jaén.<br><br>1️⃣ Haz clic en el enlace: https://dmzwin.aytojaen.es/CronosWeb/Login<br><br>2️⃣ Selecciona la opción "Acceso con usuario/contraseña".`,
            sender: 'user',
            author: '🤖 JaénSports Bot'
        });

        // System message for Patronato Login instructions with image
        match.chatMessages.push({
            id: 'msg' + Date.now() + '_img',
            text: `<div style="text-align:center;margin-top:10px;">
                <img src="assets/images/patronato-login.jpg" style="width:100%;border-radius:6px;border:1px solid #cbd5e1;box-shadow:0 2px 4px rgba(0,0,0,0.05)" alt="Indicación de Login Patronato">
                <a href="https://dmzwin.aytojaen.es/CronosWeb/Login" target="_blank" style="display:block;background:var(--color-primary-600);color:white;text-align:center;padding:10px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;margin-top:10px;transition:background 0.2s">👉 Ir al Patronato Municipal</a>
            </div>`,
            sender: 'system',
            author: 'Sistema',
            timestamp: new Date().toISOString()
        });

        showToast('success', '¡Partido creado!', 'Tu partido ya está visible. Se ha creado el chat grupal.');
        setTimeout(() => window.location.href = 'parties.html', 1500);
    });
}
