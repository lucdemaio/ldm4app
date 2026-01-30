// payments.js - payment integration skeleton and donation recorder
const PaymentsModule = (function(){
    function init(){
        document.getElementById('payments-link')?.addEventListener('click', showPaymentForm);
    }

    function showPaymentForm(){
        const body = document.getElementById('modal-body'); if (!body) return; document.getElementById('modal-title').textContent='Donazioni & Pagamenti';
        body.innerHTML = `
            <p class="modal-subtitle">Registra una donazione manuale o apri il collegamento di pagamento (sandbox).</p>
            <div class="form-grid">
                <div class="form-field"><label>Nome donatore</label><input id="pdname" placeholder="Nome donatore"/></div>
                <div class="form-field"><label>Importo (EUR)</label><input id="pdamount" placeholder="Importo (es: 50.00)"/></div>
            </div>
            <div class="form-actions">
                <button id="cancel-p-btn" class="btn btn-secondary">Annulla</button>
                <button id="record-donation" class="btn btn-primary">Registra Donazione</button>
                <a id="paypal-sandbox" class="btn btn-outline" href="https://www.sandbox.paypal.com/" target="_blank" style="margin-left:8px">Apri PayPal Sandbox</a>
            </div>
            <p class="muted" style="margin-top:8px;">Nota: integrazione reale richiede server sicuro per chiavi e webhook.</p>
        `;
        const modal = document.getElementById('modal'); if (!modal) return; modal.classList.add('open'); const first = modal.querySelector('input,textarea,select'); if (first && typeof first.focus === 'function') first.focus();
        const escHandler = (e)=>{ if (e.key === 'Escape') { modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        document.getElementById('cancel-p-btn').onclick = ()=>{ modal.classList.remove('open'); document.removeEventListener('keydown', escHandler); };
        document.getElementById('record-donation').onclick = ()=>{
            const name = (document.getElementById('pdname').value || 'Anonimo').trim();
            const amount = parseFloat(document.getElementById('pdamount').value || 0);
            if (!amount || amount <= 0) { showToast('Inserisci importo valido', 'error'); return; }
            const donors = Storage.load('donors') || [];
            donors.push({name, amount, contact:''}); Storage.save('donors', donors);
            showToast('Donazione registrata', 'success');
            if (typeof DonorsModule !== 'undefined') DonorsModule.renderList();
            if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats();
            modal.classList.remove('open'); document.removeEventListener('keydown', escHandler);
            if (typeof showView === 'function') showView('dashboard');
        };
    }

    return {init, showPaymentForm};
})();

document.addEventListener('DOMContentLoaded', PaymentsModule.init);