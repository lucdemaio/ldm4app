// utils.js - funzioni d'aiuto
function showToast(message, type='info'){ const toast = document.createElement('div'); toast.className='toast ' + type; toast.textContent = message; document.body.appendChild(toast); setTimeout(()=>toast.classList.add('show'),10); setTimeout(()=>{toast.classList.remove('show'); setTimeout(()=>toast.remove(),300);},3000); }

// small helper
function formatCurrency(v){ return '€ ' + Number(v||0).toFixed(2); }