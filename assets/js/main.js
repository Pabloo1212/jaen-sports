/**
 * JaénSports — Main Application
 * Navigation, animations, utilities, FAQ, features, profile rendering
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initAuthGuards();
  initScrollEffects();
  initFAQ();
  renderFeatures();
  renderFacilities();
  renderUpcomingMatches();
  initContactForm();
  initProfilePage();
  updateHeroStats();

  // initRevealAnimations MUST run after all dynamic DOM injections otherwise .reveal items stay invisible
  initRevealAnimations();
});

// ========== AUTH GUARDS ==========
function initAuthGuards() {
  document.querySelectorAll('a[href="create.html"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!JaenAuth.isLoggedIn()) {
        e.preventDefault();
        if (typeof showToast === 'function') {
          showToast('warning', 'Inicio de sesión requerido', 'Debes iniciar sesión o registrarte para crear un partido.');
        }
        JaenAuth.requireLogin();
      }
    });
  });
}

// ========== NAVIGATION ==========
function initNavigation() {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav-links');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => { nav.classList.remove('open'); toggle.classList.remove('active'); });
    });
  }

  // Notification bell
  const bell = document.getElementById('notification-bell');
  const dropdown = document.getElementById('notification-dropdown');
  if (bell && dropdown) {
    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
    dropdown.addEventListener('click', (e) => e.stopPropagation());
    renderNotifications();
  }
}

function renderNotifications() {
  const list = document.getElementById('notification-list');
  if (!list) return;

  if (!JaenAuth.isLoggedIn()) {
    list.innerHTML = '<div style="padding:var(--space-4);text-align:center;color:var(--color-gray-400);font-size:var(--text-sm)">Inicia sesión para ver tus notificaciones</div>';
    return;
  }

  if (typeof JaenNotifications !== 'undefined') {
    const notifications = JaenNotifications.getNotifications();
    if (notifications.length === 0) {
      list.innerHTML = '<div style="padding:var(--space-4);text-align:center;color:var(--color-gray-400);font-size:var(--text-sm)">No tienes notificaciones</div>';
      return;
    }
    list.innerHTML = notifications.slice(0, 5).map(n => `
        <div class="notification-item ${n.read ? '' : 'unread'}">
          <div class="notification-item-icon">${getIconSVG(n.type === 'reminder' ? 'bell' : n.type === 'confirmation' ? 'check' : 'users')}</div>
          <div class="notification-item-content">
            <h5>${n.title}</h5>
            <p>${n.message}</p>
          </div>
        </div>
      `).join('');
  } else {
    list.innerHTML = '<div style="padding:var(--space-4);text-align:center;color:var(--color-gray-400);font-size:var(--text-sm)">No tienes notificaciones</div>';
  }
}

// ========== HERO STATS (100% dynamic from real data) ==========
function updateHeroStats() {
  const stats = JaenDB.getStats();
  const statValues = document.querySelectorAll('.hero-stat-value');
  const statLabels = document.querySelectorAll('.hero-stat-label');
  if (statValues.length >= 3) {
    statValues[0].textContent = stats.totalUsers || '0';
    statLabels[0].textContent = 'Jugadores registrados';
    statValues[1].textContent = stats.totalMatches || '0';
    statLabels[1].textContent = 'Partidos creados';
    statValues[2].textContent = stats.openMatches || '0';
    statLabels[2].textContent = 'Partidos abiertos';
  }
}

// ========== SCROLL EFFECTS ==========
function initScrollEffects() {
  const header = document.getElementById('site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ========== INTERSECTION OBSERVER REVEAL ==========
function initRevealAnimations() {
  const reveals = document.querySelectorAll('.reveal:not(.visible)');
  if (!reveals.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  reveals.forEach(el => observer.observe(el));
}

// ========== FAQ ACCORDION ==========
function initFAQ() {
  const faqList = document.getElementById('faq-list');
  if (!faqList) return;

  const faqs = [
    { q: '¿Cómo puedo unirme a un partido en Jaén?', a: 'Registrate en JaénSports, busca los partidos disponibles por deporte y ubicación, y pulsa "Apúntate". Recibirás confirmación y acceso al chat grupal del partido.' },
    { q: '¿Cuánto cuesta usar JaénSports?', a: 'La plataforma es completamente gratuita. Solo pagas tu parte del alquiler de la pista, que se calcula dividiendo el coste total entre los jugadores inscritos.' },
    { q: '¿Cómo se gestionan los pagos?', a: 'Calculamos el coste por jugador de la pista. Tras apuntarse, los jugadores deciden y acuerdan ellos mismos cómo se pagan y reparten el dinero a través del chat de grupo del partido.' },
    { q: '¿Puedo cancelar mi inscripción?', a: 'Sí, puedes cancelar en cualquier momento. La plaza se reabre automáticamente y se notifica al grupo por chat.' },
    { q: '¿Qué deportes están disponibles?', a: 'Ofrecemos fútbol sala (10 jugadores), fútbol 7 (14 jugadores) y fútbol 11 (22 jugadores). Cada deporte tiene su cupo automático.' },
    { q: '¿Cómo funciona el chat grupal?', a: 'Cada partido tiene un chat grupal donde los jugadores se coordinan. Cuando el partido se completa, aparece el enlace para reservar la pista.' }
  ];

  faqList.innerHTML = faqs.map((faq, i) => `
    <div class="faq-item reveal ${i < 3 ? 'delay-' + (i + 1) : ''}" id="faq-${i}">
      <button class="faq-question" onclick="toggleFAQ(${i})" aria-expanded="false">
        ${faq.q}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="faq-answer"><p>${faq.a}</p></div>
    </div>
  `).join('');
}

function toggleFAQ(index) {
  const item = document.getElementById('faq-' + index);
  const btn = item.querySelector('.faq-question');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => {
    el.classList.remove('open');
    el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
  });
  if (!isOpen) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

// ========== FEATURES GRID ==========
function renderFeatures() {
  const grid = document.getElementById('features-grid');
  if (!grid) return;

  const features = [
    { icon: 'calendar', title: 'Calendario Visual', desc: 'Consulta los partidos próximos en un calendario interactivo. Filtra por deporte, fecha y ubicación.' },
    { icon: 'users', title: 'Gestión de Cupos', desc: 'Control automático de plazas: 10 para fútbol sala, 14 para fútbol 7, 22 para fútbol 11. Inscripción instantánea.' },
    { icon: 'chat', title: 'Chat Grupal', desc: 'Chat por partido donde los jugadores se coordinan. Cuando el partido se llena, aparece el enlace de reserva.' },
    { icon: 'bell', title: 'Notificaciones', desc: 'Confirmaciones, recordatorios 24h antes, cambios de estado y alertas de plazas disponibles.' },
    { icon: 'shield', title: 'Fiabilidad', desc: 'Sistema de puntuación que premia la asistencia. Tu historial de partidos siempre visible.' }
  ];

  grid.innerHTML = features.map((f, i) => `
    <div class="feature-card reveal delay-${(i % 3) + 1}">
      <div class="feature-icon">${getIconSVG(f.icon)}</div>
      <h3>${f.title}</h3>
      <p>${f.desc}</p>
    </div>
  `).join('');

  setTimeout(initRevealAnimations, 100);
}

// ========== UPCOMING MATCHES (HOME) ==========
function renderUpcomingMatches() {
  const container = document.getElementById('upcoming-matches');
  if (!container) return;

  const matches = JaenDB.getMatches().filter(m => m.status === 'open').slice(0, 3);

  if (matches.length === 0) {
    container.innerHTML = `
        <div class="text-center reveal" style="grid-column:1/-1;padding:var(--space-12)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-300)" stroke-width="1.5" style="width:64px;height:64px;margin:0 auto var(--space-4)">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="12,6 15.5,9.5 14,14 10,14 8.5,9.5"/>
            </svg>
            <h3 style="color:var(--color-gray-400);margin-bottom:var(--space-2)">Todavía no hay partidos</h3>
            <p style="color:var(--color-gray-400);margin-bottom:var(--space-6)">¡Sé el primero en crear un partido y empieza a jugar!</p>
            <a href="create.html" class="btn btn-primary">Crea el primer partido</a>
        </div>`;
  } else {
    container.innerHTML = matches.map(m => renderMatchCard(m)).join('');
  }
  setTimeout(initRevealAnimations, 100);
}

// ========== FACILITIES GRID (HOME) ==========
function renderFacilities() {
  const grid = document.getElementById('facilities-grid');
  if (!grid) return;

  const facilities = JaenDB.getFacilities();
  grid.innerHTML = facilities.map((f, i) => `
    <div class="facility-card reveal delay-${(i % 3) + 1}">
      <img src="${f.image}" alt="${f.name}" class="facility-card-img" loading="lazy" width="400" height="180" style="object-fit: cover;">
      <div class="facility-card-body">
        <h4>${f.name}</h4>
        <div class="facility-tags">
          ${f.covered ? '<span class="facility-tag">' + getIconSVG('roof') + ' Cubierta</span>' : '<span class="facility-tag">Exterior</span>'}
          ${f.lights ? '<span class="facility-tag">' + getIconSVG('lightbulb') + ' Iluminación</span>' : ''}
        </div>
      </div>
    </div>
  `).join('');

  setTimeout(initRevealAnimations, 100);
}

// ========== MATCH CARD RENDERER ==========
function renderMatchCard(match) {
  const facility = JaenDB.getFacility(match.facilityId);
  const sportConfig = JaenDB.getSportConfig(match.sport);
  const date = new Date(match.date);
  const spotsLeft = match.maxPlayers - match.players.length;
  const pricePerPlayer = (match.totalPrice / match.maxPlayers).toFixed(2);
  const fillPercent = (match.players.length / match.maxPlayers) * 100;
  const fillClass = fillPercent >= 100 ? 'full' : fillPercent >= 70 ? 'almost-full' : '';
  const isFull = match.status === 'full' || spotsLeft === 0;
  const isLoggedIn = JaenAuth.isLoggedIn();
  const userName = JaenAuth.getUserName();
  const isInMatch = isLoggedIn && match.players.includes(userName);

  return `
    <div class="match-card reveal" data-sport="${match.sport}" data-id="${match.id}">
      <div class="match-card-header">
        <span class="sport-badge ${match.sport}">${sportConfig ? sportConfig.name : match.sport}</span>
        <span class="badge ${isFull ? 'badge-error' : spotsLeft <= 2 ? 'badge-warning' : 'badge-success'}">
          ${isFull ? '✅ Completo' : spotsLeft + ' plazas'}
        </span>
      </div>
      <h4 class="match-card-title">${match.title || (sportConfig ? sportConfig.name : '') + ' en ' + (facility ? facility.name : 'Jaén')}</h4>
      <div class="match-card-meta">
        <div class="match-card-meta-item">
          ${getIconSVG('calendar')}
          <span>${formatDate(date)}</span>
        </div>
        <div class="match-card-meta-item">
          ${getIconSVG('clock')}
          <span>${formatTime(date)}</span>
        </div>
        <div class="match-card-meta-item">
          ${getIconSVG('location')}
          <span>${facility ? facility.name : 'Por definir'}</span>
        </div>
      </div>
      <div class="match-card-footer">
        <div class="spots-indicator">
          <div class="spots-bar">
            <div class="spots-bar-fill ${fillClass}" style="width:${fillPercent}%"></div>
          </div>
          <span class="spots-text">${match.players.length}/${match.maxPlayers}</span>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <span class="price-tag">${pricePerPlayer}€<small>/jugador</small></span>
          ${isFull
      ? `<a href="${facility ? facility.bookingUrl : '#'}" target="_blank" rel="noopener" class="btn btn-accent btn-sm">${getIconSVG('externalLink')} Reservar</a>`
      : isInMatch
        ? `<button class="btn btn-secondary btn-sm" onclick="openMatchModal('${match.id}')">💬 Chat</button>`
        : `<button class="btn btn-primary btn-sm" onclick="handleJoinMatch('${match.id}')">Apúntate</button>`
    }
        </div>
      </div>
    </div>
  `;
}

// ========== CONTACT FORM ==========
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('contact-name').value,
      email: document.getElementById('contact-email').value,
      subject: document.getElementById('contact-subject').value,
      message: document.getElementById('contact-message').value
    };
    const result = await JaenAPI.sendContactMessage(data);
    if (result.success) {
      showToast('success', 'Mensaje enviado', 'Te responderemos en menos de 24 horas.');
      form.reset();
    }
  });
}

// ========== PROFILE PAGE ==========
function initProfilePage() {
  const profileHeader = document.getElementById('profile-header');
  if (!profileHeader) return; // Not on profile page

  // "Editar perfil" button → switch to settings tab
  const editBtn = document.getElementById('edit-profile-btn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      if (!JaenAuth.requireLogin()) return;
      // Switch to settings tab
      const settingsTab = document.querySelector('[data-tab="settings"]');
      if (settingsTab) settingsTab.click();
    });
  }

  // Profile tabs
  const tabs = document.querySelectorAll('#profile-tabs .tab');
  if (tabs.length) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const target = document.getElementById('tab-' + tab.dataset.tab);
        if (target) target.classList.add('active');
      });
    });
  }

  // Save settings
  const saveBtn = document.getElementById('save-settings');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!JaenAuth.isLoggedIn()) { JaenAuth.requireLogin(); return; }
      const avatar = document.getElementById('setting-avatar').value;
      const name = document.getElementById('setting-name').value;
      const email = document.getElementById('setting-email').value;
      const phone = document.getElementById('setting-phone').value;
      JaenAuth.updateProfile({ avatar, name, email, phone });
      showToast('success', 'Perfil actualizado', 'Tus datos se han guardado correctamente.');
      renderProfileData();
      updateHeaderAuth();
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => JaenAuth.logout());
  }

  renderProfileData();
  window.renderProfileData = renderProfileData;
}

function renderProfileData() {
  const user = typeof JaenAuth !== 'undefined' ? JaenAuth.getCurrentUser() : null;
  const profileHeader = document.getElementById('profile-header');
  if (!profileHeader) return;

  if (!user) {
    profileHeader.innerHTML = `
            <div style="text-align:center;padding:var(--space-8);width:100%">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-300)" stroke-width="1.5" style="width:64px;height:64px;margin-bottom:var(--space-4)">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                <h3 style="color:var(--color-gray-500);margin-bottom:var(--space-3)">Inicia sesión para ver tu perfil</h3>
                <button class="btn btn-primary" onclick="openAuthModal()">Iniciar Sesión</button>
            </div>`;
    const tabsEl = document.getElementById('profile-tabs');
    if (tabsEl) tabsEl.style.display = 'none';
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    return;
  }

  // Show tabs & content
  const tabsEl = document.getElementById('profile-tabs');
  if (tabsEl) tabsEl.style.display = '';
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = '');

  // Header
  const nameEl = document.getElementById('profile-name');
  if (nameEl) nameEl.textContent = user.name;
  const avatarEl = document.getElementById('profile-avatar');
  if (avatarEl) {
    if (user.avatar) {
      avatarEl.innerHTML = `<img src="${user.avatar}" alt="${user.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      avatarEl.style.background = 'transparent';
    } else {
      avatarEl.textContent = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      avatarEl.style.background = 'var(--color-primary-600)';
    }
  }

  // Stats
  const sp = document.getElementById('stat-played');
  if (sp) sp.textContent = user.matchesPlayed || 0;
  const so = document.getElementById('stat-organized');
  if (so) so.textContent = user.matchesOrganized || 0;
  const sr = document.getElementById('stat-reliability');
  if (sr) sr.textContent = (user.reliability || 100) + '%';

  // Settings form
  const sav = document.getElementById('setting-avatar');
  if (sav) sav.value = user.avatar || '';

  const avatarSelector = document.getElementById('setting-avatar-selector');
  if (avatarSelector) {
    const avatars = [
      '', // default initials
      'assets/images/avatar1.jpg',
      'assets/images/avatar2.jpg',
      'assets/images/avatar3.jpg',
      'assets/images/avatar4.jpg',
      'assets/images/avatar5.jpg',
      'assets/images/avatar6.jpg'
    ];

    avatarSelector.innerHTML = avatars.map((src, i) => {
      const isSelected = (user.avatar || '') === src;
      const borderStyles = isSelected ? 'border: 2px solid var(--color-primary-600); transform: scale(1.1);' : 'border: 2px solid transparent;';

      if (!src) {
        const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        return `<div onclick="window.selectAvatar(this, '${src}')" style="width:48px;height:48px;border-radius:50%;background:var(--color-primary-600);color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;font-weight:bold;transition:all 0.2s;${borderStyles}">${initials}</div>`;
      }
      return `<img src="${src}" onclick="window.selectAvatar(this, '${src}')" style="width:48px;height:48px;border-radius:50%;object-fit:cover;cursor:pointer;transition:all 0.2s;${borderStyles}" alt="Avatar ${i}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'48\\' height=\\'48\\'><rect width=\\'48\\' height=\\'48\\' fill=\\'%23e2e8f0\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' font-size=\\'14\\' fill=\\'%2364748b\\'>A${i}</text></svg>'">`;
    }).join('');
  }

  const sn = document.getElementById('setting-name');
  if (sn) sn.value = user.name || '';
  const se = document.getElementById('setting-email');
  if (se) se.value = user.email || '';
  const sph = document.getElementById('setting-phone');
  if (sph) sph.value = user.phone || '';

  // Upcoming matches for profile
  const upcomingJoinedList = document.getElementById('upcoming-joined-list');
  const upcomingCreatedList = document.getElementById('upcoming-created-list');

  // Match item template generator
  const renderMatchRow = (m, actionButtonHTML) => {
    const f = JaenDB.getFacility(m.facilityId);
    const sc = JaenDB.getSportConfig(m.sport);
    const d = new Date(m.date);
    return `<div class="history-item" style="cursor:pointer" onclick="if(typeof openMatchModal==='function')openMatchModal('${m.id}')">
      <div class="history-item-sport ${m.sport}">${getIconSVG(sc ? sc.icon : 'football')}</div>
      <div style="flex:1"><h5 style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${m.title || (sc ? sc.name : '')}</h5><p style="font-size:var(--text-xs);color:var(--color-gray-500)">${formatDate(d)} · ${formatTime(d)} · ${f ? f.name : ''}</p></div>
      <div style="display:flex;align-items:center;gap:var(--space-2)">
        <span class="badge badge-primary">${m.players.length}/${m.maxPlayers}</span>
        ${actionButtonHTML}
      </div>
    </div>`;
  };

  if (upcomingJoinedList && upcomingCreatedList) {
    const allMatches = JaenDB.getMatches();
    const joined = allMatches.filter(m => m.players.includes(user.name) && m.organizer !== user.name);
    const created = allMatches.filter(m => m.organizer === user.name);

    // Render Joined
    if (joined.length) {
      document.getElementById('no-upcoming-joined').style.display = 'none';
      upcomingJoinedList.innerHTML = joined.map(m => renderMatchRow(m, `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.profileLeaveMatch('${m.id}')">Desapuntarse</button>`)).join('');
      upcomingJoinedList.style.display = 'block';
    } else {
      document.getElementById('no-upcoming-joined').style.display = 'block';
      upcomingJoinedList.style.display = 'none';
    }

    // Render Created
    if (created.length) {
      document.getElementById('no-upcoming-created').style.display = 'none';
      upcomingCreatedList.innerHTML = created.map(m => renderMatchRow(m, `<button class="btn btn-ghost btn-sm" style="color:var(--color-error-500);border:1px solid var(--color-error-200);" onclick="event.stopPropagation(); window.profileCancelMatch('${m.id}')">Cancelar/Eliminar</button>`)).join('');
      upcomingCreatedList.style.display = 'block';
    } else {
      document.getElementById('no-upcoming-created').style.display = 'block';
      upcomingCreatedList.style.display = 'none';
    }
  }

  // Profile Action Handlers
  window.profileLeaveMatch = async function (id) {
    if (confirm('¿Seguro que quieres desapuntarte del partido?')) {
      const result = await JaenAPI.leaveMatch(id);
      if (result.success) {
        showToast('info', 'Te has desapuntado', 'Tu plaza vuelve a estar libre.');
        renderProfileData();
      }
    }
  };

  window.profileCancelMatch = async function (id) {
    if (confirm('¿Estás SEGURO de que quieres cancelar y eliminar permanentemente este partido que has organizado?')) {
      const result = await JaenAPI.deleteMatch(id);
      if (result) {
        showToast('success', 'Partido eliminado', 'El partido se ha cancelado y borrado correctamente.');
        renderProfileData();
      }
    }
  };

  // Payment history
  const payTable = document.getElementById('payments-table');
  if (payTable && user.payments) {
    if (user.payments.length === 0) {
      payTable.innerHTML = '<tr><td colspan="4" style="padding:var(--space-6);text-align:center;color:var(--color-gray-400)">No tienes pagos registrados</td></tr>';
    } else {
      payTable.innerHTML = user.payments.map(p => `
          <tr>
            <td style="padding:var(--space-4) var(--space-5);font-size:var(--text-sm)">${p.matchTitle}</td>
            <td style="padding:var(--space-4) var(--space-5);font-size:var(--text-sm);color:var(--color-gray-500)">${new Date(p.date).toLocaleDateString('es-ES')}</td>
            <td style="padding:var(--space-4) var(--space-5);font-size:var(--text-sm);text-align:right;font-weight:var(--weight-semibold)">${p.amount.toFixed(2)}€</td>
            <td style="padding:var(--space-4) var(--space-5);text-align:center"><span class="badge ${p.status === 'paid' ? 'badge-success' : 'badge-warning'}">${p.status === 'paid' ? 'Pagado' : 'Pendiente'}</span></td>
          </tr>
        `).join('');
    }
  }
}

// ========== JOIN MATCH HANDLER ==========
async function handleJoinMatch(matchId) {
  if (!JaenAuth.requireLogin()) return;

  const result = await JaenAPI.joinMatch(matchId);
  if (result.success) {
    showToast('success', '¡Te has apuntado!', 'Ya tienes acceso al chat grupal del partido.');
    // Re-render whatever page we're on
    if (typeof renderPartiesPage === 'function') renderPartiesPage();
    renderUpcomingMatches();
    if (typeof updateHeroStats === 'function') updateHeroStats();

    // Instead of directly opening the chat, let's open an Viral Invite Prompt first
    setTimeout(() => showInviteModal(matchId), 500);
  } else {
    showToast('error', 'No se pudo inscribir', result.error);
  }
}

// ========== VIRAL INVITE MODAL ==========
function showInviteModal(matchId) {
  const match = JaenDB.getMatch(matchId);
  if (!match) return;
  const userName = JaenAuth.getUserName();

  // Find habitual players (people you played with who aren't in this match)
  const allMatches = JaenDB.getMatches();
  const pastMatches = allMatches.filter(m => m.id !== matchId && m.players.includes(userName));
  let habituals = new Set();
  pastMatches.forEach(m => m.players.forEach(p => {
    if (p !== userName && !match.players.includes(p)) habituals.add(p);
  }));
  const habitualList = Array.from(habituals);
  let habitualUI = '';

  if (habitualList.length > 0) {
    const suggested = habitualList[Math.floor(Math.random() * habitualList.length)];
    habitualUI = `
        <div style="background:var(--color-primary-50); border:1px solid var(--color-primary-200); padding:16px; border-radius:12px; margin-bottom:20px; display:flex; align-items:center; gap:16px;">
            <div style="width:40px;height:40px;border-radius:50%;background:var(--color-primary-600);color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0;">
                ${suggested.charAt(0).toUpperCase()}
            </div>
            <div style="flex:1;">
                <p style="font-size:0.9rem; margin-bottom:4px"><strong>${suggested}</strong> jugó contigo recientemente.</p>
                <p style="font-size:0.8rem; color:var(--color-gray-600)">¡Invítalo a este partido y llénalo más rápido!</p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="showToast('success', 'Invitación enviada', 'Has avisado a ${suggested}.'); this.disabled=true; this.textContent='Enviado';">Avisar</button>
        </div>
      `;
  }

  const shareText = encodeURIComponent(`¡Me he apuntado a un partido de ${match.sport} en Jaén! Nos faltan jugadores, ¿te apuntas? Únete en: https://jaensports.es/parties.html`);

  const modalHTML = `
    <div class="modal-backdrop" id="invite-modal-backdrop" style="display:flex;"></div>
    <div class="modal open" id="invite-modal" style="display:flex; flex-direction:column; max-width:450px;">
        <div class="modal-header">
            <h3>¡Ya estás dentro! ⚽</h3>
            <button class="modal-close" onclick="closeInviteModal('${matchId}')">${getIconSVG('close')}</button>
        </div>
        <div class="modal-body" style="text-align:center;">
            <p style="font-size:1.1rem; margin-bottom:16px; color:var(--color-gray-600);">¿Quieres asegurar que el partido se juegue?</p>
            <h4 style="margin-bottom:24px;">Invita a amigos para completar las plazas más rápido.</h4>
            
            ${habitualUI}

            <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:24px;">
                <a href="https://wa.me/?text=${shareText}" target="_blank" rel="noopener" class="btn" style="background:#25D366; color:white; border:none; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                    Compartir en WhatsApp
                </a>
                <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${decodeURIComponent(shareText)}'); showToast('success', 'Enlace copiado', 'Pégalo donde quieras para invitar a amigos.');" style="display:flex; align-items:center; justify-content:center; gap:8px;">
                    ${getIconSVG('externalLink')} Copiar enlace
                </button>
            </div>
            <button class="btn btn-ghost" style="color:var(--color-gray-500); width:100%" onclick="closeInviteModal('${matchId}')">Saltar e ir al chat</button>
        </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.closeInviteModal = function (matchId) {
  const backdrop = document.getElementById('invite-modal-backdrop');
  const modal = document.getElementById('invite-modal');
  if (backdrop) backdrop.remove();
  if (modal) modal.remove();
  if (typeof openMatchModal === 'function') {
    openMatchModal(matchId);
  }
}

// ========== PROFILE AVATAR SELECTION ==========
window.selectAvatar = function (element, src) {
  const sav = document.getElementById('setting-avatar');
  if (sav) sav.value = src;

  const container = document.getElementById('setting-avatar-selector');
  if (container) {
    Array.from(container.children).forEach(child => {
      child.style.border = '2px solid transparent';
      child.style.transform = 'scale(1)';
    });
  }

  if (element) {
    element.style.border = '2px solid var(--color-primary-600)';
    element.style.transform = 'scale(1.1)';
  }
};

// ========== UTILITIES ==========
function getIconSVG(name) {
  if (typeof JaenIcons !== 'undefined' && JaenIcons[name]) return JaenIcons[name];
  return '';
}

function formatDate(date) {
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(date) {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount) {
  return amount.toFixed(2) + '€';
}

function showToast(type, title, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: 'check', error: 'close', warning: 'bell', info: 'ai' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${getIconSVG(icons[type] || 'info')}</div>
    <div class="toast-content"><h5>${title}</h5><p>${message}</p></div>
    <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Cerrar">${getIconSVG('close')}</button>
  `;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('hiding'); setTimeout(() => toast.remove(), 300); }, 5000);
}

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}
