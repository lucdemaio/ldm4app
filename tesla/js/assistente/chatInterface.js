// Chat Interface - Gestione UI e logica chat
// Coordina il flusso di messaggi, visualizzazione e interazioni

import { modelManager } from './modelManager.js';
import { analysisService } from './analysisService.js';

let chatHistory = [];
let isProcessing = false;

async function initializeAssistant() {
    try {
        console.log('Inizializzazione assistente...');
        updateStatus('Caricamento modelli AI...', true);
        
        // Inizializza i modelli
        const success = await modelManager.initializeModels();
        
        if (success) {
            updateStatus('Pronto!', false);
            console.log('✓ Assistente pronto!');
            
            // Aggiungi messaggio di benvenuto aggiornato
            const welcomeMsg = document.createElement('div');
            welcomeMsg.className = 'message assistant';
            welcomeMsg.style.justifyContent = 'flex-start';
            welcomeMsg.innerHTML = `
                <div class="icon">✓</div>
                <div>
                    <div class="message-content">
                        Tutti i modelli AI sono stati caricati con successo! 🎉
                        <br><br>
                        Ora puoi chiedermi di:
                        <ul style="margin-top: 8px; padding-left: 20px;">
                            <li>📊 Analizzare il sentimento di un testo</li>
                            <li>❓ Risposte da una knowledge base Tesla</li>
                            <li>🏷️ Classificare l'intento delle tue domande</li>
                            <li>🔍 Estrarre informazioni rilevanti</li>
                        </ul>
                        <br>
                        Tutto elaborato localmente nel tuo browser, nessun dato inviato a server!
                    </div>
                    <div class="message-meta">Assistente • ora</div>
                </div>
            `;
            document.getElementById('chatMessages').appendChild(welcomeMsg);
            document.getElementById('messageInput').focus();
        } else {
            updateStatus('Errore caricamento', false);
            showError('Errore nel caricamento dei modelli AI. Ricarica la pagina.');
        }
    } catch (error) {
        console.error('Errore inizializzazione:', error);
        updateStatus('Errore', false);
        showError('Errore inizializzazione: ' + error.message);
    }
}

function updateStatus(text, isLoading) {
    const badge = document.getElementById('statusBadge');
    const dot = badge.querySelector('.status-dot');
    
    badge.textContent = text;
    
    // Ricrea il dot
    const newDot = document.createElement('span');
    newDot.className = `status-dot ${isLoading ? 'loading' : ''}`;
    badge.insertBefore(newDot, badge.firstChild);
    
    // Aggiorna colore
    if (isLoading) {
        badge.classList.add('loading');
    } else {
        badge.classList.remove('loading');
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.getElementById('chatMessages').insertBefore(errorDiv, document.getElementById('chatMessages').firstChild);
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message || isProcessing) return;

    if (!modelManager.isReady()) {
        showError('I modelli AI non sono ancora pronti. Aspetta qualche secondo...');
        return;
    }

    // Disabilita input
    input.value = '';
    input.disabled = true;
    document.getElementById('sendBtn').disabled = true;
    isProcessing = true;

    try {
        // Mostra messaggio utente
        addMessage(message, 'user');

        // Mostra typing indicator
        const typingDiv = createTypingIndicator();
        document.getElementById('chatMessages').appendChild(typingDiv);
        scrollToBottom();

        // Genera risposta
        updateStatus('Elaborazione...', true);
        const result = await analysisService.generateResponse(message);

        // Rimuovi typing indicator
        typingDiv.remove();

        // Mostra risposta
        addMessage(result.response, 'assistant');

        // Aggiungi info sentiment (se positivo/negativo)
        if (result.sentiment && result.sentiment.score > 0.85) {
            const sentimentBadge = document.createElement('div');
            sentimentBadge.className = `sentiment-badge sentiment-${result.sentiment.sentiment.toLowerCase()}`;
            sentimentBadge.textContent = `${result.sentiment.sentiment} (${result.sentiment.confidence}%)`;
            
            const lastMessage = document.getElementById('chatMessages').lastElementChild;
            const content = lastMessage.querySelector('.message-content');
            if (content) {
                content.appendChild(sentimentBadge);
            }
        }

        // Salva nella history
        chatHistory.push({
            userMessage: message,
            assistantResponse: result.response,
            sentiment: result.sentiment,
            intent: result.intent,
            timestamp: new Date()
        });

        updateStatus('Pronto', false);
        scrollToBottom();
    } catch (error) {
        console.error('Errore:', error);
        addMessage(`❌ Errore: ${error.message}`, 'assistant');
        updateStatus('Errore', false);
    } finally {
        input.disabled = false;
        document.getElementById('sendBtn').disabled = false;
        input.focus();
        isProcessing = false;
    }
}

function sendQuestion(question) {
    document.getElementById('messageInput').value = question;
    sendMessage();
}

function addMessage(text, type) {
    const messagesDiv = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.style.justifyContent = type === 'user' ? 'flex-end' : 'flex-start';

    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = type === 'user' ? '👤' : '🤖';

    const contentDiv = document.createElement('div');
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Formatta il testo con markdown semplice
    messageContent.innerHTML = formatMessage(text);

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = `${type === 'user' ? 'Tu' : 'Assistente'} • ${new Date().toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})}`;

    contentDiv.appendChild(messageContent);
    contentDiv.appendChild(meta);

    if (type === 'user') {
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(icon);
    } else {
        messageDiv.appendChild(icon);
        messageDiv.appendChild(contentDiv);
    }

    messagesDiv.appendChild(messageDiv);
}

function formatMessage(text) {
    // Converti markdown semplice in HTML
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/^- (.*?)$/gm, '<li>$1</li>')
        .replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');

    return html;
}

function createTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.style.justifyContent = 'flex-start';
    
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = '🤖';
    
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    
    div.appendChild(icon);
    div.appendChild(typing);
    
    return div;
}

function scrollToBottom() {
    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function clearChat() {
    if (confirm('Sei sicuro di voler cancellare la chat?')) {
        document.getElementById('chatMessages').innerHTML = '';
        chatHistory = [];
        
        // Ricarica il messaggio iniziale
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'message assistant';
        welcomeMsg.style.justifyContent = 'flex-start';
        welcomeMsg.innerHTML = `
            <div class="icon">🤖</div>
            <div>
                <div class="message-content">
                    Chat cancellata. Come posso aiutarti? 🚗
                </div>
                <div class="message-meta">Assistente • ora</div>
            </div>
        `;
        document.getElementById('chatMessages').appendChild(welcomeMsg);
        document.getElementById('messageInput').focus();
    }
}

function downloadChatHistory() {
    const json = JSON.stringify(chatHistory, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tesla-chat-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

// Debug: funzione per mostrare stats
function getAssistantStats() {
    return {
        chatMessages: chatHistory.length,
        modelStatus: modelManager.getStatus(),
        positiveMessages: chatHistory.filter(m => m.sentiment?.isPositive).length,
        negativeMessages: chatHistory.filter(m => m.sentiment?.isNegative).length,
        totalIntents: [...new Set(chatHistory.map(m => m.intent?.primaryCategory))].length
    };
}

// Esponi globalmente per console debug e DOM onclick
window.initializeAssistant = initializeAssistant;
window.sendMessage = sendMessage;
window.sendQuestion = sendQuestion;
window.clearChat = clearChat;
window.getAssistantStats = getAssistantStats;
window.downloadChatHistory = downloadChatHistory;
window.getChatHistory = () => chatHistory;
