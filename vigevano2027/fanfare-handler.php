<?php
header('Content-Type: application/json');

// Abilita CORS se necessario
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Raccogli i dati dal form
    $fanfaraNome = isset($_POST['fanfaraNome']) ? strip_tags($_POST['fanfaraNome']) : '';
    $regione = isset($_POST['regione']) ? strip_tags($_POST['regione']) : '';
    $provincia = isset($_POST['provincia']) ? strip_tags($_POST['provincia']) : '';
    $sezione = isset($_POST['sezione']) ? strip_tags($_POST['sezione']) : '';
    $sito = isset($_POST['sito']) ? strip_tags($_POST['sito']) : '';
    $elementiFantarfa = isset($_POST['elementiFantarfa']) ? intval($_POST['elementiFantarfa']) : 0;
    $accompagnatori = isset($_POST['accompagnatori']) ? intval($_POST['accompagnatori']) : 0;
    $responsabile = isset($_POST['responsabile']) ? strip_tags($_POST['responsabile']) : '';
    $qualifica = isset($_POST['qualifica']) ? strip_tags($_POST['qualifica']) : '';
    $telefono = isset($_POST['telefono']) ? strip_tags($_POST['telefono']) : '';
    $cellulare = isset($_POST['cellulare']) ? strip_tags($_POST['cellulare']) : '';
    $email = isset($_POST['email']) ? filter_var($_POST['email'], FILTER_SANITIZE_EMAIL) : '';
    $presidente = isset($_POST['presidente']) ? strip_tags($_POST['presidente']) : '';
    $data = isset($_POST['data']) ? strip_tags($_POST['data']) : '';
    $note = isset($_POST['note']) ? strip_tags($_POST['note']) : '';
    $privacy = isset($_POST['privacy']) ? $_POST['privacy'] : '';
    
    // Validazione base
    if (empty($fanfaraNome) || empty($regione) || empty($provincia) || empty($sezione) || 
        empty($responsabile) || empty($qualifica) || empty($telefono) || empty($email) || 
        empty($presidente) || empty($data) || empty($elementiFantarfa) || empty($privacy)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Tutti i campi obbligatori devono essere compilati']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email non valida']);
        exit;
    }
    
    // Email di destinazione
    $to = 'fanfare@radunobersaglieri2027.com';
    
    // Intestazioni email
    $headers = "From: " . $responsabile . " <" . $email . ">\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    // Corpo dell'email
    $email_subject = "Nuova Richiesta Ospitalità Fanfara: " . $fanfaraNome;
    
    $body = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .header { background-color: #c45b3e; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .section { background-color: #f9f9f9; padding: 15px; margin-bottom: 15px; border-radius: 5px; border-left: 4px solid #c45b3e; }
            .section-title { font-weight: bold; color: #c45b3e; font-size: 1.1em; margin-bottom: 10px; }
            .field { margin-bottom: 10px; padding: 8px; background-color: white; border-radius: 3px; }
            .label { font-weight: bold; color: #c45b3e; display: inline-block; width: 150px; }
            .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>🎺 Richiesta Ospitalità Fanfara</h2>
                <p>Raduno Nazionale Bersaglieri 2027 - Vigevano</p>
            </div>
            
            <div class='section'>
                <div class='section-title'>📋 Informazioni Fanfara</div>
                <div class='field'><span class='label'>Nome Fanfara:</span> " . htmlspecialchars($fanfaraNome) . "</div>
                <div class='field'><span class='label'>Regione:</span> " . htmlspecialchars($regione) . "</div>
                <div class='field'><span class='label'>Provincia:</span> " . htmlspecialchars($provincia) . "</div>
                <div class='field'><span class='label'>Sezione:</span> " . htmlspecialchars($sezione) . "</div>
                <div class='field'><span class='label'>Sito Internet:</span> " . ($sito ? "<a href='" . htmlspecialchars($sito) . "' target='_blank'>" . htmlspecialchars($sito) . "</a>" : "Non fornito") . "</div>
            </div>
            
            <div class='section'>
                <div class='section-title'>👥 Composizione Fanfara</div>
                <div class='field'><span class='label'>Elementi Fanfara:</span> " . $elementiFantarfa . " musicisti</div>
                <div class='field'><span class='label'>Accompagnatori:</span> " . $accompagnatori . "</div>
            </div>
            
            <div class='section'>
                <div class='section-title'>👤 Responsabile Fanfara</div>
                <div class='field'><span class='label'>Nome:</span> " . htmlspecialchars($responsabile) . "</div>
                <div class='field'><span class='label'>Qualifica:</span> " . htmlspecialchars($qualifica) . "</div>
                <div class='field'><span class='label'>Telefono:</span> " . htmlspecialchars($telefono) . "</div>
                <div class='field'><span class='label'>Cellulare:</span> " . ($cellulare ? htmlspecialchars($cellulare) : "Non fornito") . "</div>
                <div class='field'><span class='label'>Email:</span> <a href='mailto:" . htmlspecialchars($email) . "'>" . htmlspecialchars($email) . "</a></div>
            </div>
            
            <div class='section'>
                <div class='section-title'>📝 Dati Aggiuntivi</div>
                <div class='field'><span class='label'>Presidente Sezione:</span> " . htmlspecialchars($presidente) . "</div>
                <div class='field'><span class='label'>Data Compilazione:</span> " . htmlspecialchars($data) . "</div>
                <div class='field'><span class='label'>Note:</span> " . ($note ? nl2br(htmlspecialchars($note)) : "Nessuna nota") . "</div>
            </div>
            
            <div class='footer'>
                <p><strong>Azione richiesta:</strong> Confermare la ricezione e contattare il responsabile per procedere con la gestione della richiesta.</p>
                <p>Raduno Nazionale Bersaglieri 2027 - Vigevano<br>
                Email: <a href='mailto:fanfare@radunobersaglieri2027.com'>fanfare@radunobersaglieri2027.com</a></p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    // Invia l'email al responsabile dell'ospitalità
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
                .content { line-height: 1.6; }
                .highlight { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #27ae60; }
                .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>✅ Richiesta Ricevuta</h2>
                </div>
                <div class='content'>
                    <p>Caro " . htmlspecialchars($responsabile) . ",</p>
                    <p>Grazie per aver inoltrato la richiesta di ospitalità per la fanfara <strong>" . htmlspecialchars($fanfaraNome) . "</strong> al Raduno Nazionale Bersaglieri 2027 di Vigevano!</p>
                    
                    <div class='highlight'>
                        <p><strong>Dati ricevuti a breve invieremo una risposta.</strong></p>
                        <p>La tua richiesta è stata registrata correttamente e verrà esaminata dal nostro ufficio ospitalità.</p>
                        <p>Ti contatteremo al numero <strong>" . htmlspecialchars($telefono) . "</strong> entro <strong>48 ore lavorative</strong> per confermare gli accordi.</p>
                    </div>
                    
                    <p><strong>Riepilogo della richiesta:</strong></p>
                    <ul>
                        <li>Fanfara: " . htmlspecialchars($fanfaraNome) . "</li>
                        <li>Persone: " . $elementiFantarfa . " musicisti + " . $accompagnatori . " accompagnatori</li>
                        <li>Data registrazione: " . date('d/m/Y H:i:s') . "</li>
                    </ul>
                </div>
                <div class='footer'>
                    <p>Raduno Nazionale Bersaglieri 2027 - Vigevano<br>
                    Email: <a href='mailto:fanfare@radunobersaglieri2027.com'>fanfare@radunobersaglieri2027.com</a></p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        mail($email, "✅ Richiesta Ospitalità Ricevuta - Raduno Bersaglieri 2027", $receipt_body, $receipt_headers);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Richiesta inviata con successo!']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Errore nell\'invio della richiesta']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metodo non consentito']);
}
?>
