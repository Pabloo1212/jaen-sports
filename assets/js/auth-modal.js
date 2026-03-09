/**
 * JaénSports — Auth Modal
 * Rediseño estilo Wallapop con Fix de Seguridad y OTP Mock
 */

(function () {
    let pendingRegistration = null;

    function renderAuthStyles() {
        if (document.getElementById('wallapop-auth-styles')) return;
        const style = document.createElement('style');
        style.id = 'wallapop-auth-styles';
        style.innerHTML = `
            .wp-modal-container { display: none; position: fixed; inset: 0; z-index: 9999; justify-content: center; align-items: center; }
            .wp-modal-container.active { display: flex; }
            .wp-modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
            .wp-modal-content { position: relative; background: white; width: 100%; max-width: 400px; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto; }
            .wp-modal-content.dark { background: #1a1a1a; color: white; }
            
            .wp-close-btn { position: absolute; top: 16px; right: 16px; background: transparent; border: none; cursor: pointer; padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #4b5563; z-index: 10;}
            .wp-close-btn:hover { background: #f3f4f6; }
            .wp-modal-content.dark .wp-close-btn { color: #9ca3af; }
            .wp-modal-content.dark .wp-close-btn:hover { background: #374151; }

            .wp-screen { display: none; padding: 32px 24px 24px; }
            .wp-screen.active { display: block; filter: animation(fadeIn 0.2s); }
            
            .wp-title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 8px; }
            .wp-subtitle { font-size: 18px; font-weight: 600; color: var(--color-primary-600); margin-bottom: 24px; }
            .wp-modal-content.dark .wp-title { color: white; }

            .wp-btn-outline { width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 24px; background: white; color: #374151; font-weight: 600; font-size: 15px; cursor: pointer; margin-bottom: 12px; transition: background 0.2s; }
            .wp-btn-outline:hover { background: #f9fafb; border-color: #9ca3af; }
            .wp-btn-primary { width: 100%; background: var(--color-primary-500); color: white; padding: 14px; border-radius: 24px; font-weight: 600; font-size: 15px; border: none; cursor: pointer; transition: background 0.2s; margin-top: 16px; }
            .wp-btn-primary:hover { background: var(--color-primary-600); }
            .wp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

            .wp-input-group { margin-bottom: 16px; position: relative; }
            .wp-input { width: 100%; padding: 16px 16px 8px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; outline: none; transition: border-color 0.2s; background: white; color:#111827; }
            .wp-input:focus { border-color: var(--color-primary-500); }
            .wp-label { position: absolute; left: 16px; top: 12px; font-size: 15px; color: #6b7280; transition: all 0.2s; pointer-events: none; }
            .wp-input:focus ~ .wp-label, .wp-input:not(:placeholder-shown) ~ .wp-label { top: 6px; font-size: 11px; }
            
            .wp-eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; }

            .wp-check-group { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; font-size: 13px; color: #374151; line-height: 1.4; }
            .wp-checkbox { flex-shrink: 0; width: 18px; height: 18px; margin-top: 2px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; }

            .wp-captcha { border: 1px solid #d1d5db; border-radius: 4px; padding: 12px; display: flex; align-items: center; justify-content: space-between; background: #fafafa; margin-bottom: 16px; }
            .wp-captcha-left { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #374151; }
            .wp-captcha-check { width: 24px; height: 24px; border: 2px solid #c1c1c1; border-radius: 2px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
            .wp-captcha-check.checked { border-color: #10b981; }
            
            .wp-account-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #333; transition: background 0.2s; }
            .wp-account-item:hover { background: #262626; }
            .wp-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 500; font-size: 16px; }
            
            .wp-bottom-link { text-align: center; margin-top: 24px; font-size: 14px; color: #374151; }
            .wp-link { color: var(--color-primary-600); font-weight: 600; text-decoration: none; cursor: pointer; }
            .wp-link:hover { text-decoration: underline; }
            
            .wp-otp-inputs { display: flex; gap: 8px; margin-bottom: 24px; justify-content: center; }
            .wp-otp-input { width: 44px; height: 52px; font-size: 24px; text-align: center; border: 1px solid #d1d5db; border-radius: 8px; font-weight: 600; color: #111827; }
            .wp-otp-input:focus { border-color: var(--color-primary-500); outline: none; }
        `;
        document.head.appendChild(style);
    }

    function createAuthModal() {
        if (document.getElementById('wp-auth-modal')) return;
        renderAuthStyles();

        const modal = document.createElement('div');
        modal.id = 'wp-auth-modal';
        modal.className = 'wp-modal-container';
        modal.innerHTML = `
            <div class="wp-modal-backdrop" id="wp-modal-backdrop"></div>
            <div class="wp-modal-content" id="wp-modal-content">
                <button class="wp-close-btn" id="wp-close-btn" aria-label="Cerrar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>

                <!-- PANTALLA 1: MAIN -->
                <div class="wp-screen active" id="wp-screen-main">
                    <div style="height: 120px; background: url('assets/images/hero-sports.png') center/cover; margin: -32px -24px 24px; opacity: 0.8; object-fit: cover;"></div>
                    <h2 class="wp-title">Regístrate o inicia sesión.</h2>
                    <p class="wp-subtitle">¡Te estamos esperando!</p>

                    <!-- Contenedor Oficial de Google Sign In -->
                    <button class="wp-btn-outline" style="min-height: 48px; border-color: #d1d5db; color: #374151" id="wp-google-real-btn">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 48 48" style="margin-right:8px;"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                        Continuar con Google
                    </button>
                    
                    <button class="wp-btn-outline" id="wp-btn-goto-register">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        Continuar con el email
                    </button>

                    <p class="wp-bottom-link">¿Ya tienes una cuenta? <span class="wp-link" id="wp-link-goto-login">Iniciar sesión</span></p>
                </div>

                <!-- Pantalla 2 (Google - ELIMINADA y REEMPLAZADA POR API OFICIAL) -->

                <!-- PANTALLA 3: REGISTER -->
                <div class="wp-screen" id="wp-screen-register">
                    <h2 class="wp-title" style="margin-bottom: 24px;">Únete a JaénSports</h2>
                    
                    <form id="wp-form-register">
                        <div class="wp-input-group">
                            <input type="text" class="wp-input" id="wp-reg-name" placeholder=" " required>
                            <label class="wp-label">Nombre y apellidos</label>
                        </div>
                        <div class="wp-input-group">
                            <input type="email" class="wp-input" id="wp-reg-email" placeholder=" " required>
                            <label class="wp-label">Dirección de e-mail</label>
                        </div>
                        <div class="wp-input-group">
                            <input type="password" class="wp-input" id="wp-reg-pass" placeholder=" " required minlength="8">
                            <label class="wp-label">Contraseña</label>
                            <button type="button" class="wp-eye-btn" onclick="window.togglePassword('wp-reg-pass')">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                        </div>

                        <div class="wp-check-group" style="margin-top: 24px;">
                            <input type="checkbox" class="wp-checkbox" id="wp-reg-promo">
                            <label for="wp-reg-promo">Quiero recibir comunicaciones sobre promociones y novedades de JaénSports.</label>
                        </div>
                        <div class="wp-check-group">
                            <input type="checkbox" class="wp-checkbox" id="wp-reg-terms" required>
                            <label for="wp-reg-terms">He leído y acepto las <a href="#" class="wp-link">Condiciones de uso</a> y <a href="#" class="wp-link">Política de privacidad</a>.</label>
                        </div>

                        <div id="wp-reg-error" style="color: #ef4444; font-size: 13px; margin-bottom: 12px; display: none;"></div>

                        <button type="submit" class="wp-btn-primary">Crear una cuenta</button>
                    </form>
                    <p class="wp-bottom-link" style="margin-top:16px;">¿Ya tienes una cuenta? <span class="wp-link" onclick="window.switchScreen('login')">Iniciar sesión</span></p>
                </div>

                <!-- PANTALLA 4: LOGIN -->
                <div class="wp-screen" id="wp-screen-login">
                    <h2 class="wp-title" style="margin-bottom: 24px;">¡Te damos la bienvenida!</h2>

                    <form id="wp-form-login">
                        <div class="wp-input-group">
                            <input type="email" class="wp-input" id="wp-log-email" placeholder=" " required>
                            <label class="wp-label">Dirección de e-mail</label>
                        </div>
                        <div class="wp-input-group">
                            <input type="password" class="wp-input" id="wp-log-pass" placeholder=" " required>
                            <label class="wp-label">Contraseña</label>
                            <button type="button" class="wp-eye-btn" onclick="window.togglePassword('wp-log-pass')">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                        </div>

                        <!-- FAKE RECAPTCHA -->
                        <div class="wp-captcha" id="wp-captcha-box">
                            <div class="wp-captcha-left">
                                <div class="wp-captcha-check" id="wp-captcha-tick"></div>
                                <span>No soy un robot</span>
                            </div>
                            <div style="text-align:center; display:flex; flex-direction:column; align-items:center;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#4285F4"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                <span style="font-size: 9px; color: #9ca3af; margin-top: 4px;">reCAPTCHA</span>
                            </div>
                        </div>

                        <div style="text-align: center; margin-bottom: 24px;">
                            <span class="wp-link" style="font-size: 14px;">¿Has olvidado tu contraseña?</span>
                        </div>

                        <div id="wp-log-error" style="color: #ef4444; font-size: 13px; margin-bottom: 12px; display: none;"></div>

                        <button type="submit" class="wp-btn-primary" id="wp-log-btn" disabled>Acceder a JaénSports</button>
                    </form>
                    <p class="wp-bottom-link" style="margin-top:16px;">¿Aún no tienes cuenta? <span class="wp-link" onclick="window.switchScreen('register')">Regístrate</span></p>
                </div>

                <!-- PANTALLA 5: OTP VERIFICATION (demo: no se envía email real; usa 123456) -->
                <div class="wp-screen" id="wp-screen-otp">
                    <h2 class="wp-title">Verifica tu e-mail</h2>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 12px; line-height: 1.5;">
                        Para esta demo, <strong>no se envía ningún correo</strong>. Introduce el código de prueba:
                    </p>
                    <p style="font-size: 15px; font-weight: 700; color: var(--color-primary-600); margin-bottom: 24px;">123456</p>
                    <p style="font-size: 13px; color: #6b7280; margin-bottom: 24px;">(En producción podrías recibir un enlace de confirmación de Supabase en tu correo; revisa también la carpeta de spam.)</p>

                    <div class="wp-otp-inputs" id="wp-otp-container">
                        <input type="text" class="wp-otp-input" maxlength="1" pattern="[0-9]*" inputmode="numeric">
                        <input type="text" class="wp-otp-input" maxlength="1" pattern="[0-9]*" inputmode="numeric">
                        <input type="text" class="wp-otp-input" maxlength="1" pattern="[0-9]*" inputmode="numeric">
                        <input type="text" class="wp-otp-input" maxlength="1" pattern="[0-9]*" inputmode="numeric">
                        <input type="text" class="wp-otp-input" maxlength="1" pattern="[0-9]*" inputmode="numeric">
                        <input type="text" class="wp-otp-input" maxlength="1" pattern="[0-9]*" inputmode="numeric">
                    </div>

                    <div id="wp-otp-error" style="color: #ef4444; font-size: 13px; margin-bottom: 12px; text-align:center; display: none;">Código incorrecto. Usa 123456.</div>

                    <button class="wp-btn-primary" id="wp-btn-verify-otp">Verificar y acceder</button>
                </div>

            </div>
        `;
        document.body.appendChild(modal);
        initEvents();
    }

    // Global toggle password
    window.togglePassword = function (id) {
        const input = document.getElementById(id);
        if (input.type === 'password') input.type = 'text';
        else input.type = 'password';
    }

    // Global switch screen
    window.switchScreen = function (screenId) {
        const content = document.getElementById('wp-modal-content');
        content.classList.remove('dark');
        document.querySelectorAll('.wp-screen').forEach(s => s.classList.remove('active'));

        const target = document.getElementById('wp-screen-' + screenId);
        if (target) target.classList.add('active');

        if (screenId === 'google-deprecated') {
            // kept for reference if needed
        }
    }

    function initEvents() {
        const modal = document.getElementById('wp-auth-modal');
        const content = document.getElementById('wp-modal-content');

        // Close logic
        document.getElementById('wp-close-btn').addEventListener('click', closeAll);
        document.getElementById('wp-modal-backdrop').addEventListener('click', closeAll);

        function closeAll() {
            modal.classList.remove('active');
            setTimeout(() => window.switchScreen('main'), 200);
        }

        // HELPER VALIDATOR DE EMAIL
        function isValidEmail(email) {
            const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            const tld = email.split('.').pop().toLowerCase();
            const validTLDs = ['com', 'es', 'org', 'net', 'edu', 'info'];
            return regex.test(email) && validTLDs.includes(tld);
        }

        // GOOGLE SIGN IN SCRIPT INJECTION & INIT (Supabase Auth)
        document.getElementById('wp-google-real-btn').addEventListener('click', async () => {
            if (!window.supabase) {
                if (typeof showToast === 'function') showToast('error', 'Configuración', 'Falta configurar Supabase (URL y clave anon).');
                return;
            }
            try {
                const { data, error } = await window.supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + '/index.html',
                        queryParams: { access_type: 'offline', prompt: 'consent' }
                    }
                });
                if (error) throw error;
                if (data?.url) window.location.href = data.url;
            } catch (error) {
                console.error('Error con Google Sign In', error);
                if (typeof showToast === 'function') showToast('error', 'Error con Google', error?.message || 'No se ha podido conectar con Google.');
            }
        });

        // MAIN SCREEN NAV
        document.getElementById('wp-btn-goto-register').addEventListener('click', () => window.switchScreen('register'));
        document.getElementById('wp-link-goto-login').addEventListener('click', () => window.switchScreen('login'));

        // CAPTCHA MOCK
        const captchaCheck = document.getElementById('wp-captcha-tick');
        const loginBtn = document.getElementById('wp-log-btn');
        document.getElementById('wp-captcha-box').addEventListener('click', () => {
            captchaCheck.classList.toggle('checked');
            if (captchaCheck.classList.contains('checked')) {
                captchaCheck.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
                loginBtn.disabled = false;
            } else {
                captchaCheck.innerHTML = '';
                loginBtn.disabled = true;
            }
        });

        // OTP inputs auto-advance
        const otpInputs = document.querySelectorAll('.wp-otp-input');
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
        });

        // REGISTER FORM SUBMIT
        document.getElementById('wp-form-register').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('wp-reg-name').value;
            const email = document.getElementById('wp-reg-email').value;
            const password = document.getElementById('wp-reg-pass').value;
            const errorEl = document.getElementById('wp-reg-error');
            errorEl.style.display = 'none';

            // VALIDATION STRICT FRONTEND BEFORE OTP
            if (!isValidEmail(email)) {
                errorEl.textContent = "Formato de correo inválido o dominio no permitido (usa .com, .es, etc).";
                errorEl.style.display = 'block';
                return;
            }

            const existing = JaenDB.findUserByEmail(email);
            if (existing) {
                errorEl.textContent = "Ya existe una cuenta con este correo.";
                errorEl.style.display = 'block';
                return;
            }

            // Save state and proceed to OTP
            pendingRegistration = { name, email, password };
            document.getElementById('wp-otp-email').textContent = email;
            window.switchScreen('otp');
            document.querySelector('.wp-otp-input').focus();
        });

        // OTP VERIFY BUTTON
        document.getElementById('wp-btn-verify-otp').addEventListener('click', async () => {
            const code = Array.from(otpInputs).map(i => i.value).join('');
            const errorEl = document.getElementById('wp-otp-error');

            // Accept any 6 digits for testing
            if (code.length === 6) {
                const r = await JaenAuth.register(pendingRegistration.name, pendingRegistration.email, pendingRegistration.password);
                if (r.success) {
                    closeAll();
                    if (typeof showToast === 'function') showToast('success', '¡Cuenta verificada!', 'Te damos la bienvenida a JaénSports.');
                    window.updateHeaderAuth();
                    setTimeout(() => location.reload(), 800);
                } else {
                    errorEl.textContent = r.error;
                    errorEl.style.display = 'block';
                }
            } else {
                errorEl.textContent = 'Introduce el código completo (6 dígitos).';
                errorEl.style.display = 'block';
            }
        });

        // LOGIN FORM SUBMIT
        document.getElementById('wp-form-login').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('wp-log-email').value;
            const password = document.getElementById('wp-log-pass').value;
            const errorEl = document.getElementById('wp-log-error');
            errorEl.style.display = 'none';

            // VALIDATION STRICT FRONTEND
            if (!isValidEmail(email)) {
                errorEl.textContent = "Formato de correo inválido o dominio no permitido (usa .com, .es, etc).";
                errorEl.style.display = 'block';
                return;
            }

            const result = await JaenAuth.login(email, password);
            if (result.success) {
                closeAll();
                if (typeof showToast === 'function') showToast('success', '¡Hola de nuevo!', 'Has iniciado sesión.');
                window.updateHeaderAuth();
                setTimeout(() => location.reload(), 800);
            } else {
                errorEl.textContent = result.error;
                errorEl.style.display = 'block';
            }
        });
    }

    // No longer needed: Decodes the official Google JWT
    // Supabase handles it via OAuth Redirect instead

    // Global function to open modal at main step
    window.openAuthModal = function (tab = 'main') {
        createAuthModal();
        const modal = document.getElementById('wp-auth-modal');
        modal.classList.add('active');

        // Reset inputs and errors
        document.getElementById('wp-reg-error').style.display = 'none';
        document.getElementById('wp-log-error').style.display = 'none';
        document.getElementById('wp-otp-error').style.display = 'none';
        document.getElementById('wp-form-register').reset();
        document.getElementById('wp-form-login').reset();
        document.querySelectorAll('.wp-otp-input').forEach(i => i.value = '');
        document.getElementById('wp-captcha-tick').classList.remove('checked');
        document.getElementById('wp-captcha-tick').innerHTML = '';
        document.getElementById('wp-log-btn').disabled = true;

        if (tab === 'register') {
            window.switchScreen('register');
        } else if (tab === 'login') {
            window.switchScreen('login');
        } else {
            window.switchScreen('main');
        }
    };

    // Header sync
    window.updateHeaderAuth = function () {
        const accountBtns = document.querySelectorAll('.nav-actions .btn-primary');
        const isLoggedIn = JaenAuth.isLoggedIn();
        const userName = JaenAuth.getUserName();

        accountBtns.forEach(btn => {
            if (isLoggedIn) {
                btn.textContent = userName || 'Mi Cuenta';
                btn.href = 'profile.html';
                btn.onclick = null;
            } else {
                btn.textContent = 'Iniciar Sesión';
                btn.href = '#';
                btn.onclick = (e) => { e.preventDefault(); window.openAuthModal('main'); };
            }
        });

        const badge = document.getElementById('notification-count');
        if (badge && !isLoggedIn) badge.style.display = 'none';

        // Actualizar también el contenido del perfil si estamos en esa página
        if (isLoggedIn && typeof window.renderProfileData === 'function') window.renderProfileData();
    };

    // Auto-detect login from Supabase and update header dynamically
    if (window.supabase) {
        window.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                setTimeout(window.updateHeaderAuth, 300); // Give auth.js time to fetch profile
            }
        });
    }

    // Init on DOM ready y refrescar header varias veces (por si la sesión de Google llega un poco tarde)
    document.addEventListener('DOMContentLoaded', () => {
        createAuthModal();
        window.updateHeaderAuth();
        setTimeout(window.updateHeaderAuth, 600);
        setTimeout(window.updateHeaderAuth, 2000);
    });
    // Al volver a la pestaña, actualizar por si acabo de llegar del redirect de Google
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && typeof window.updateHeaderAuth === 'function') window.updateHeaderAuth();
    });
})();
