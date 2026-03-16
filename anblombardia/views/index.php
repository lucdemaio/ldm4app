<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="Author" content="Stefano Sampietro" />
  <meta name="Description" content="Il sito ufficiale dell'Associazione Nazionale Bersaglieri Lombardia" />
  <meta name="Keywords" content="bersaglieri lombardia ANB" />
  <meta name="google-site-verification" content="uchAaCkmougtF9OyNoLW5BXfN8Rnv7GrEpkyH0GSc7k" />
  
  <?php
    // Il titolo è fisso per tutte le pagine, definito nell'indexController.php.
    echo('<title>' . $PageTitle . '</title>');
  ?>
  <!-- to correct the unsightly Flash of Unstyled Content. http://www.bluerobot.com/web/css/fouc.asp -->
  <script type="text/javascript">
	try {
	var piwikTracker = Piwik.getTracker(pkBaseURL + "piwik.php", 1);
	piwikTracker.trackPageView();
	piwikTracker.enableLinkTracking();
	} catch( err ) {}
	</script><noscript><p><img src="http://www.anblombardia.it/piwik/piwik.php?idsite=1" style="border:0" alt="" /></p></noscript>
	<!-- End Piwik Tracking Code -->	
*/
?>
	
</head>

<?php 
echo('<body id="' . $BodyID . '">');
?>
  <div id="container" class="container_16">
  
    <!--Inizio header div -->
    <div id="header" class="grid_16">
      <div id="TopImage"> 
      	<!-- 
        <h1 id="anb">ASSOCIAZIONE NAZIONALE BERSAGLIERI</h1>
        <h2 id="presidenza">PRESIDENZA REGIONALE LOMBARDIA</h2>
        -->
      </div> 
    </div>
    <!--Fine header div -->
     
    <!--Inizio mainSpace div -->    
    <div id="mainSpace" class="grid_16">    
    
      <!--Inizio content div -->
      <div id="content" class="grid_13 omega">
      
        <!--Inizio mainContent div -->
        <div id="mainContent">
  <?php 
          // Pagina con Contenuti
          
          // Titolo
          foreach (array_values($Titles) as $Title) {
            if ($Title[0] != ""){
              echo('<h1>' . $Title[0] . '</h1>');
            }
          }
          
          // Contenuti
          foreach (array_values($Texts) as $Text) {
            if (isset($Text[2])){
              // Texts derived from function IntroText
              if ($Text[2] != ""){
                
                if ($Text[4] != ""){
                  if (is_numeric($Text[4])){
                    // We link the DIV to the page ID set in Parameter [4]
                    echo('<div class="introText pointer" onclick="location.href = &#39;index.php?rt=' . $Text[4] . '&#39;" title="Clicca nel riquadro per visualizzare la notizia completa">');
                  }
                  else{
                    // We link the DIV to the external page set in Parameter [4]
                    echo('<div class="introText pointer" onclick="window.open(&#39;' . $Text[4] . '&#39;)" title="Clicca nel riquadro per visualizzare la notizia completa">');
                  }
                }
                else{
                  // No link to pages
                  echo('<div class="introText">');                  
                }

                // Parameter [2] is the Date of insertion of the linked page
                echo('<p class="DateIntroText">' . $Text[2] . '</p>');
                
                if ($Text[1] != "")
                {
                  // Parameter [1] is the title of the linked page
                  echo('<h2>' . $Text[1] . '</h2>');
                }

                // Parameter [0] is the IntroText of the linked page
                echo($Text[0]);
                
                if ($Text[4] != ""){
                  // We create a pagagraph saying to the user that there is a link to the news. The link is created at DIV level.
                  echo('<div class="GoToPage">Clicca nel riquadro per visualizzare la notizia completa</div>');                  
                }
                
              }

              echo('</div>');
            
            }
            else{
              // Standard text
              if ($Text[0] != ""){
                echo($Text[0]);
              }
            }
            
          }
  ?>           
        </div><!-- end mainContent -->
      
      </div><!-- end content div -->
      
      <!--Inizio sidebar div -->
      <div id="sidebar" class="grid_3 alpha">
        <!--Inizio navBar div (Menu Principale Laterale) -->
        <div id="navBar" >
          <ul>
<?php        

  // TROUBLESHOOTING  
//  echo '<br/>' . count($MainMenuVoices);
//  echo '<br/>' . ($MainMenuVoices[0]);
//  echo '<br/>' . ($MainMenuVoices[1]);
  foreach (array_values($MainMenuVoices) as $MainMenuVoice) {
    // TROUBLESHOOTING     
//    echo '<br/> Records totali' . count($MainMenuVoice);
    // Se c'è un link, lo inseriamo
    if ($MainMenuVoice[1] != ""){
      echo('<li class="s' . $MainMenuVoice[2] . ' p' . $MainMenuVoice[3] . '">
        <a href="' . $MainMenuVoice[1] . '">' . $MainMenuVoice[0] . '</a></li>' . "\n"); 
    }
    else{
      echo('<li class="s' . $MainMenuVoice[2] . ' p' . $MainMenuVoice[3] . '">' . $MainMenuVoice[0] . '</li>' . "\n");
    }

  }

?>
          </ul>
        </div><!-- end navBar div -->
      </div><!-- end sidebar div -->
    
    </div><!-- end mainSpace div --> 

           
    <div id="footer" class="grid_16">
      <p>Associazione Nazionale Bersaglieri - Presidenza Regionale Lombardia | email:
        <script type="text/javascript">
          composeEmail("presidenza", "anblombardia", "it");
        </script>
      </p>
    </div><!-- end footer div -->
                           
  </div><!-- end container -->


</body>
</html>