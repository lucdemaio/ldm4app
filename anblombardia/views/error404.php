<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  
  <?php
    // Il titolo è fisso per tutte le pagine, definito nell'indexController.php.
    echo('<title>' . $PageTitle . '</title>');
  ?>
  <!-- to correct the unsightly Flash of Unstyled Content. http://www.bluerobot.com/web/css/fouc.asp -->
  <script type="text/javascript">
  </script>
  
  <!-- Foglio Di Stile Esterno -->
  <link rel="stylesheet" type="text/css" media="all" href="site.css" />

  <!-- Javascript per generare e-mail al volo. Anti-spam -->
  <script type="text/javascript" src="js/emailNoSpam.js"></script>

</head>

<body>

  <div id="container" class="container_16">
  
    <!--Inizio header div -->
    <div id="header" class="grid_16">
      <div id="TopImage"> 
        <h1 id="anb">ASSOCIAZIONE NAZIONALE BERSAGLIERI</h1>
        <h2 id="presidenza">PRESIDENZA REGIONALE LOMBARDIA</h2>
      </div>  
    </div>
    <!--Fine header div -->
     
    <!--Inizio mainSpace div -->    
    <div id="mainSpace" class="grid_16">    
    
      <!--Inizio content div -->
      <div id="content" class="grid_13 omega">
      
        <!--Inizio mainContent div -->
        <div id="mainContent">
          <h1>Pagina inesistente</h1>
          <p>La pagina cercata non esiste su questo server</p>
          <p>Cliccare su "indietro" nella barra del browser e selezionare uno dei link dal menu sulla destra per visitare le altre pagine del sito.</p>         
        </div><!-- end mainContent -->
      
      </div><!-- end content div -->
      

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