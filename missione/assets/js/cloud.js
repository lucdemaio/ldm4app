// assets/js/cloud.js
// Funzione placeholder per "Collega Cloud"
// Google Drive API integration (client-side)
// 1. Serve una Google Cloud Console app con OAuth2 e Drive API abilitata
// 2. Inserisci il tuo CLIENT_ID qui sotto
const GOOGLE_CLIENT_ID = 'INSERISCI_CLIENT_ID_GOOGLE_OAUTH';
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive.file';

window.connectCloud = function() {
    if (!window.gapi) {
        alert('Caricamento libreria Google...');
        const s = document.createElement('script');
        s.src = 'https://apis.google.com/js/api.js';
        s.onload = startGoogleAuth;
        document.body.appendChild(s);
    } else {
        startGoogleAuth();
    }
};

function startGoogleAuth() {
    gapi.load('client:auth2', async function() {
        await gapi.client.init({
            clientId: GOOGLE_CLIENT_ID,
            scope: GOOGLE_SCOPES
        });
        gapi.auth2.getAuthInstance().signIn().then(function(user) {
            alert('Google Drive collegato come: ' + user.getBasicProfile().getEmail());
            // Mostra bottone per caricare file
            showDriveUploadButton();
        });
    });
}

function showDriveUploadButton() {
    let btn = document.getElementById('drive-upload-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'drive-upload-btn';
        btn.className = 'btn btn-outline';
        btn.innerHTML = '<i data-lucide="upload"></i><span style="margin-left:0.5rem;">Carica file su Drive</span>';
        btn.onclick = uploadSampleFileToDrive;
        document.querySelector('.navbar-actions').appendChild(btn);
        if (window.lucide) lucide.createIcons();
    }
}

async function uploadSampleFileToDrive() {
    const fileContent = 'Esempio di file da Missione Manager';
    const file = new Blob([fileContent], {type: 'text/plain'});
    const metadata = { name: 'missione-esempio.txt', mimeType: 'text/plain' };

    const accessToken = gapi.auth.getToken().access_token;
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
    form.append('file', file);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form
    });
    const result = await res.json();
    if (result.id) {
        alert('File caricato su Google Drive! ID: ' + result.id);
    } else {
        alert('Errore nel caricamento su Drive');
    }
}
