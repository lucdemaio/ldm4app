// File ads.js - Pubblicità disabilitate
// Banner Adsterra rimosso dall'utente

// Funzione placeholder per evitare errori se richiamata
window.initAds = function() {
    console.log('Pubblicità disabilitate');
};

// Blocca eventuali tentativi di caricamento ads
if (typeof window.adsbygoogle !== 'undefined') {
    window.adsbygoogle = [];
}

console.log('ads.js: Modulo pubblicità disabilitato');
