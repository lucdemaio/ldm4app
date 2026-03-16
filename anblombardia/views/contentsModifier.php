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
  
  <script type="text/javascript" src="tools/ckeditor/ckeditor.js"></script>
  <script type="text/javascript">
    window.onload = function()
    {
      CKEDITOR.replace( 'editIntroText' );
      CKEDITOR.replace( 'editCompleteText' );
    };
  </script>
  
</head>

<?php 
echo('<body id="' . $BodyID . '">');
?>
  <div id="container" class="container_12">
  
    <!--Inizio header div -->
    <div id="header" class="grid_12">
      <div id="TopImage"> 
        <h1 id="anb">ASSOCIAZIONE NAZIONALE BERSAGLIERI</h1>
        <h2 id="presidenza">PRESIDENZA REGIONALE LOMBARDIA</h2>
      </div>  
    </div>
    <!--Fine header div -->
     
    <!--Inizio mainSpace div -->    
    <div id="mainSpace" class="grid_12">    
		<br/>
		
<?php
	if (isset($StatusMessage)){
		echo('<b>' . $StatusMessage . '</b>'); 
	}

	switch($UserStatus){
		case 'AUTH_LOGGED':
			foreach (array_values($ModifiableContent) as $Content) {
    		if ($Content[1] != ""){
    			$Title = $Content[1];
        }
        if ($Content[0] != ""){
    			$IntroText = $Content[0];
        }
        if ($Content[2] != ""){
    			$Text = $Content[2];
        }
        if ($Content[3] != ""){
    			$ID = $Content[3];
        }
        if ($Content[4] != ""){
    			$Published = $Content[4];
        }
				if ($Content[5] != ""){
    			$NewsInHomePage = $Content[5];
        }
      }		
?>    
    	<form action="index.php?rt=15/update" method="post">
    		<p>
    			<br/>
          <label for="editTitle"><b>Titolo Pagina:</b></label>
          <br />
          <input id="editTitle" name="editTitle" size="70"
            <?php
              // Titolo
              if (isset($Title)){
              	echo('value="'. $Title . '"');
              }
            ?>
           />
          <br/>
          <br/>
          
    			<label for="editIntroText"><b>Testo Introduttivo:</b></label>
          <br />
    			<textarea cols="80" id="editIntroText" name="editIntroText" rows="10">
  <?php 
          // Pagina con Contenuti
          if (isset($IntroText)){
          	echo($IntroText);
          }
  ?>            
          </textarea>
          
          <br/>      
    			<label for="editCompleteText"><b>Testo Completo:</b></label>
          <br />
    			<textarea cols="80" id="editCompleteText" name="editCompleteText" rows="10">
  <?php 
          // Pagina con Contenuti
          if (isset($Text)){
          	echo($Text);
          }
  ?>            
          </textarea>
          
          <br/>
          <input type="checkbox" name="checkPublished" value="Published"
	<?php
					if (isset($Published)){
						if ($Published == 1){
							echo('checked="checked"');
						}
					} 
	?>          
           />      
    			<label for="checkPublished"><b>Notizia Pubblicata</b></label>
          
          <br/>      
    			<input type="checkbox" name="checkNewsInHomePage" value="NewsInHomePage"
	<?php
					if (isset($NewsInHomePage)){
						if ($NewsInHomePage == 1){
							echo('checked="checked"');
						}
					} 
	?>     
	    		 />
    			<label for="checkNewsInHomePage"><b>Notizia in breve sulla Home Page</b></label>
    			<br/>
    			<br/>
    			<input type="submit" name="action" value="Invia"/>
    			<br/>
    		</p>
    		
    	</form>   

<?php
		break;
	case 'AUTH_NOT_LOGGED':
?>
	<p><b>Non hai i diritti per visualizzare la pagina</b></p>
<?php
		break;
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