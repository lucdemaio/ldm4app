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

<?php
  // Inseriamo qui tutti i javascripts esterni caricati dinamicamente dal database, in base alla pagina attuale
  foreach (array_values($HeadBodyParams) as $HeadBodyParam) {
    echo($HeadBodyParam[0]);
    $BodyPar = $HeadBodyParam[1];
  }    
  
?>
 
</head>

<?php 
echo('<body id="' . $BodyID . '">');
?>
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
            echo('<div class="introText" onclick="location.href = &#39;index.php?rt=' . $Text[3] . '/page&#39;">');
            if ($Text[2] != ""){
              // Data nel caso di IntroTexts
              echo('<p class="DateIntroText">' . $Text[2] . '</p>');
            }
            if ($Text[0] != ""){
              // Title della pagina seguente nel caso di IntroText
              if ($Text[1] != "")
              {
                echo('<h2>' . $Text[1] . '</h2>');
              }
              echo($Text[0]);
            }
            echo('<a class="GoToPage" href="index.php?rt=' . $Text[3] . '/page">Vai alla pagina</a>');
            echo('</div>');
          }
      
// TROUBLESHOOTING  
//echo('<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras malesuada sem a nunc tincidunt accumsan. Cras lacus arcu, rhoncus vitae scelerisque ut, consequat id velit. Quisque ut diam nisl. Integer lacinia congue tellus nec consequat. Suspendisse ultricies, ligula in semper volutpat, felis leo mollis ipsum, vitae condimentum metus eros nec purus. Sed a sapien tempus est aliquet posuere. Donec rutrum, eros non porttitor egestas, odio leo faucibus urna, quis adipiscing sem ante vitae orci. Etiam malesuada velit placerat magna dictum pretium. Sed non tortor ac diam tincidunt hendrerit. Integer dui mauris, ornare vel bibendum id, pellentesque eu sem. Cras lacinia commodo gravida. Ut eleifend lacus non erat interdum a auctor purus hendrerit. Sed ornare erat a ligula commodo condimentum. Integer elit turpis, dignissim et rutrum nec, rutrum elementum nulla. Phasellus elementum venenatis massa. Fusce ac massa mauris. Ut id lacus et lectus auctor rutrum. Ut ut suscipit mi. Aenean facilisis magna in arcu ali
//que.dot non dapibus neque euism</p>');
//echo('<p>Ut nunc tortor, consectetur eget tempus aliquam, bibendum sed turpis. Nam venenatis eros vel nulla pretium pharetra. Fusce dolor nunc, egestas vitae commodo vel, sagittis ac dolor. Integer et odio sed leo pulvinar sollicitudin. Mauris orci enim, feugiat a laoreet ut, aliquam vitae orci. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Sed elit turpis, aliquam in posuere sed, adipiscing at ligula. Vivamus felis sem, pulvinar vitae lacinia commodo, adipiscing non odio. Nullam suscipit odio et sapien euismod non ullamcorper nisl varius. Donec tincidunt faucibus est quis laoreet. Sed scelerisque magna quis velit euismod posuere. Nulla lobortis leo at est sagittis eget viverra nibh dignissim. Morbi et tortor arcu.</p>');
//echo('<p>Mauris faucibus purus eget augue feugiat nec dictum mauris varius. Donec tincidunt feugiat odio vel rhoncus. Donec convallis malesuada tempor. Curabitur risus odio, tincidunt a porttitor eu, cursus ut ligula. Nullam sit amet nunc neque, vitae rhoncus justo. Sed sit amet lacus vel dui elementum viverra. Ut bibendum quam rutrum nulla semper vulputate. Suspendisse blandit molestie sollicitudin. Quisque dapibus blandit iaculis. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Curabitur est eros, convallis at placerat a, lacinia viverra nunc. Curabitur malesuada sollicitudin rutrum. Proin id nisi et risus tristique aliquet. Donec non ultrices lacus. Donec hendrerit, justo sit amet rhoncus pharetra, justo neque blandit eros, sit amet elementum eros eros sit amet ligula. Aenean gravida nunc nec est tincidunt lacinia. Mauris ut odio sit amet odio pretium accumsan. Sed vitae dui felis, at luctus justo. Cras magna odio, tristique a pharetra vitae, condimentum at lacus. Nulla lacinia fringilla auctor.</p>');
//echo('<p>Morbi vulputate nisi ut tortor iaculis consectetur elementum ac dui. In eros nunc, consectetur a posuere nec, aliquet quis velit. Nullam arcu nibh, porta vitae suscipit sed, ultricies ac augue. Maecenas eu purus placerat ante condimentum adipiscing. Sed adipiscing ligula at turpis suscipit vitae hendrerit dui malesuada. In hac habitasse platea dictumst. Aliquam bibendum tincidunt ullamcorper. Suspendisse dapibus imperdiet mauris, quis scelerisque erat pretium eu. Nulla consectetur dapibus nibh ut mollis. Pellentesque id mauris dolor.</p>');
//echo('<p>Pellentesque blandit congue sollicitudin. Duis cursus neque sed nibh pulvinar egestas. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer ut cursus arcu. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Maecenas gravida sollicitudin nibh eget sagittis. Morbi et lacus mauris. Sed sagittis ante id ipsum posuere a luctus arcu posuere. Quisque in enim non orci commodo bibendum. In aliquam tellus eu lacus faucibus semper. Morbi eu metus sapien, ut varius magna. Suspendisse urna odio, suscipit at fringilla id, varius a justo. Maecenas placerat ante at est commodo malesuada. In eget orci non nulla vehicula rhoncus. Aenean fringilla lacinia felis consectetur malesuada. Donec nisl leo, convallis sit amet rhoncus eget, dapibus vel lectus. Sed nulla mi, commodo quis varius congue, faucibus ac dolor. Vestibulum pretium ante quis orci lobortis ullamcorper. Nulla non neque ac odio fringilla consequat id at augue. Donec massa arcu, mollis ut fringilla eget, ullamcorper sed leo</p>');
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
      <p>Associazione Nazionale Bersaglieri - Presidenza Regionale Lombardia | email: <a href="mailto:presidenza@anblombardia.it">presidenza@anblombardia.it</a>
      </p>
    </div><!-- end footer div -->
                           
  </div><!-- end container -->
    


</body>
</html>