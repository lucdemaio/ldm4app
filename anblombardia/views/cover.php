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
  <div id="container" class="container_12">
  
    <!--Inizio header div -->
    <div id="header" class="grid_12">
      <div id="TopImage"> 
      	<!-- 
        <h1 id="anb">ASSOCIAZIONE NAZIONALE BERSAGLIERI</h1>
        <h2 id="presidenza">PRESIDENZA REGIONALE LOMBARDIA</h2>
        -->
      </div> 
    </div>
    <!--Fine header div -->
     
    <!--Inizio mainSpace div -->    
    <div id="mainSpace" class="grid_12">    
    
  <?php 
          // Pagina con Contenuti
          foreach (array_values($Texts) as $Text) {
            if ($Text[0] != ""){
              echo($Text[0]);
            }
          }
  ?>           

    </div><!-- end mainSpace div --> 

           
    <div id="footer" class="grid_12">
      <p>Associazione Nazionale Bersaglieri - Presidenza Regionale Lombardia | email:
        <script type="text/javascript">
          composeEmail("presidenza", "anblombardia", "it");
        </script>
      </p>
    </div><!-- end footer div -->
                           
  </div><!-- end container -->
    

</body>
</html>