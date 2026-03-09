/**
 * JaénSports — Payments Module
 * Cost calculation, payment simulation (Bizum/Stripe)
 */

const JaenPayments = (() => {
    function calculatePerPlayer(totalPrice, numPlayers) {
        if (numPlayers <= 0) return 0;
        return Math.ceil((totalPrice / numPlayers) * 100) / 100;
    }

    function showPaymentModal(matchId) {
        const match = JaenDB.getMatch(matchId);
        if (!match) return;

        const perPlayer = calculatePerPlayer(match.totalPrice, match.players.length);
        const overlay = document.getElementById('match-modal') || createPaymentOverlay();

        const modalTitle = overlay.querySelector('.modal-header h3') || overlay.querySelector('h3');
        const modalBody = overlay.querySelector('.modal-body');
        const modalFooter = overlay.querySelector('.modal-footer');

        if (modalTitle) modalTitle.textContent = 'Confirmar pago';
        if (modalBody) {
            modalBody.innerHTML = `
        <div style="text-align:center;margin-bottom:var(--space-6)">
          <div style="font-size:var(--text-4xl);font-weight:var(--weight-extrabold);color:var(--color-primary-500);margin-bottom:var(--space-2)">${perPlayer.toFixed(2)}€</div>
          <p style="font-size:var(--text-sm);color:var(--color-gray-500)">${match.title} — ${match.players.length} jugadores</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-3)">
          <label class="form-check" style="padding:var(--space-4);border:2px solid var(--color-gray-200);border-radius:var(--radius-lg);cursor:pointer;transition:border-color 0.2s" id="pay-bizum-option">
            <input type="radio" name="payment-method" value="bizum" checked>
            <div>
              <span style="font-weight:var(--weight-semibold);font-size:var(--text-sm)">Bizum</span>
              <p style="font-size:var(--text-xs);color:var(--color-gray-500)">Pago instantáneo desde tu banco</p>
            </div>
          </label>
          <label class="form-check" style="padding:var(--space-4);border:2px solid var(--color-gray-200);border-radius:var(--radius-lg);cursor:pointer;transition:border-color 0.2s" id="pay-stripe-option">
            <input type="radio" name="payment-method" value="stripe">
            <div>
              <span style="font-weight:var(--weight-semibold);font-size:var(--text-sm)">Stripe (Tarjeta)</span>
              <p style="font-size:var(--text-xs);color:var(--color-gray-500)">Visa, Mastercard, American Express</p>
            </div>
          </label>
        </div>
      `;

            // Highlight selected
            const options = modalBody.querySelectorAll('.form-check');
            options.forEach(opt => {
                opt.querySelector('input').addEventListener('change', () => {
                    options.forEach(o => o.style.borderColor = 'var(--color-gray-200)');
                    opt.style.borderColor = 'var(--color-primary-500)';
                });
            });
            options[0].style.borderColor = 'var(--color-primary-500)';
        }

        if (modalFooter) {
            modalFooter.innerHTML = `
        <button class="btn btn-ghost" onclick="document.getElementById('match-modal').classList.remove('active')">Cancelar</button>
        <button class="btn btn-accent" id="confirm-payment-btn">Confirmar Pago</button>
      `;
            document.getElementById('confirm-payment-btn').addEventListener('click', async () => {
                const method = modalBody.querySelector('input[name="payment-method"]:checked').value;
                const btn = document.getElementById('confirm-payment-btn');
                btn.disabled = true;
                btn.textContent = 'Procesando...';

                const result = await JaenAPI.processPayment(matchId, method);
                if (result.success) {
                    overlay.classList.remove('active');
                    showToast('success', '¡Pago confirmado!', `${result.amount.toFixed(2)}€ pagados vía ${result.method.charAt(0).toUpperCase() + result.method.slice(1)}.`);
                } else {
                    showToast('error', 'Error en el pago', result.error);
                    btn.disabled = false;
                    btn.textContent = 'Confirmar Pago';
                }
            });
        }

        overlay.classList.add('active');
    }

    function createPaymentOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'payment-modal';
        overlay.innerHTML = `<div class="modal"><div class="modal-header"><h3>Pago</h3><button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('active')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><div class="modal-body"></div><div class="modal-footer"></div></div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
        return overlay;
    }

    return { calculatePerPlayer, showPaymentModal };
})();
