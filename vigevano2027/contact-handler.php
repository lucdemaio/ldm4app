<?php
header('Content-Type: application/json');

// Abilita CORS se necessario
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Raccogli i dati dal form
    $name = isset($_POST['name']) ? strip_tags($_POST['name']) : '';
    $email = isset($_POST['email']) ? filter_var($_POST['email'], FILTER_SANITIZE_EMAIL) : '';
    $subject = isset($_POST['subject']) ? strip_tags($_POST['subject']) : '';
    $message = isset($_POST['message']) ? strip_tags($_POST['message']) : '';
    
    // Validazione base
    if (empty($name) || empty($email) || empty($subject) || empty($message)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Tutti i campi sono obbligatori']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email non valida']);
        exit;
    }
    
    // Email di destinazione
    $to = 'info@radunobersaglieri2027.com';
    
    // Intestazioni email
    $headers = "From: " . $name . " <" . $email . ">\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    // Corpo dell'email
    $email_subject = "Nuovo messaggio da: " . $name . " - " . $subject;
    
    $body = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .header { background-color: #c45b3e; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .content { line-height: 1.6; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #c45b3e; }
            .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>Nuovo Messaggio - Raduno Bersaglieri 2027</h2>
            </div>
            <div class='content'>
                <div class='field'>
                    <span class='label'>Nome:</span><br>
                    " . htmlspecialchars($name) . "
                </div>
                <div class='field'>
                    <span class='label'>Email:</span><br>
                    <a href='mailto:" . htmlspecialchars($email) . "'>" . htmlspecialchars($email) . "</a>
                </div>
                <div class='field'>
                    <span class='label'>Oggetto:</span><br>
                    " . htmlspecialchars($subject) . "
                </div>
                <div class='field'>
                    <span class='label'>Messaggio:</span><br>
                    " . nl2br(htmlspecialchars($message)) . "
                </div>
            </div>
            <div class='footer'>
                <p>Messaggio inviato da: Raduno Nazionale Bersaglieri 2027</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    // Invia l'email
    if (mail($to, $email_subject, $body, $headers)) {
        // Invia anche una ricevuta all'utente
        $receipt_headers = "From: Raduno Bersaglieri 2027 <" . $to . ">\r\n";
        $receipt_headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        
        $receipt_body = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                .header { background-color: #27ae60; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>✅ Messaggio Ricevuto</h2>
                </div>
                <div class='content'>
                    <p>Caro " . htmlspecialchars($name) . ",</p>
                    <p>Grazie per aver contattato il Raduno Nazionale Bersaglieri 2027!</p>
                    <p>Il tuo messaggio è stato ricevuto correttamente. Ti risponderemo al tuo indirizzo email entro <strong>48 ore lavorative</strong>.</p>
                    <p><strong>Dati del messaggio:</strong></p>
                    <ul>
                        <li>Oggetto: " . htmlspecialchars($subject) . "</li>
                        <li>Data e ora: " . date('d/m/Y H:i:s') . "</li>
                    </ul>
                </div>
                <div class='footer'>
                    <p>Raduno Nazionale Bersaglieri 2027 - Vigevano<br>
                    Email: <a href='mailto:info@radunobersaglieri2027.com'>info@radunobersaglieri2027.com</a></p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        mail($email, "Ricevuta: Il tuo messaggio è stato ricevuto", $receipt_body, $receipt_headers);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Messaggio inviato con successo!']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Errore nell\'invio del messaggio']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metodo non consentito']);
}
?>
