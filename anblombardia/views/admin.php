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
  </script>
  
  <!-- Foglio Di Stile Esterno -->
  <link rel="stylesheet" type="text/css" media="all" href="site.css" />

  <!-- Javascript per generare e-mail al volo. Anti-spam -->
  <script type="text/javascript" src="js/emailNoSpam.js"></script>
  
</head>

<?php 
if (isset($BodyID))
	echo('<body id="' . $BodyID . '">');
else
	echo('<body>');
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
      <div id="content" class="grid_14">
      
        <!--Inizio mainContent div -->
        <div id="mainContent">
<h1>Pagina di Amministrazione del Sito</h1>

<hr/>

<?php 
  if (isset($UserIDS))
	{  
//		foreach (array_values($UserIDS) as $UserID) {
//    	echo('Utente loggato: ' . $UserID);
//  	}
		$UserID = $UserIDS[0];
//  	echo('Utente loggato: ' . $UserID);
	}
	else  
	{
//		echo('Nessun Utente Loggato');	
	}    

//	echo('<br/>' . $UserStatus);

?>

<?php
	switch($UserStatus){
		case 'AUTH_LOGGED':
?>

	<br/>
	<br/>	
	<b>Buongiorno, <?php echo($UserID); ?>. Scegli dai menu sottostanti.</b>
	<br/>	
		
	<ul>
		<li><a href="index.php?admin=2">Aggiungi una notizia</a></li>
		<li><a href="index.php?admin=3">Modifica una pagina</a></li>
		<li><a href="index.php?admin=1/logout">Log-Out</a></li>
	</ul>
<?php
	if (isset($PageList)){
?>
	<h1>Elenco delle pagine modificabili:</h1>
	<p>Clicca sul titolo per modificare la pagina relativa</p>
	<table id="tblPageList">
		<thead>
			<tr>
				<th>ID</th><th>Titolo Pagina</th>
			</tr>
		</thead>
		<tbody>
<?php 		
		foreach ($PageList as $value) {
			echo('<tr>');
	//		echo('<td>' . $Counter . '</td>');
	//		echo('<td><input type="checkbox" name="' . $value[0] . '" value="html"/></td>');
			echo('<td>' . $value[0] . '</td>');
			echo('<td><a href="index.php?rt=' . $value[0] . '/modifier" target="blank">' . $value[1] . '</td>');
			echo('</tr>');
		}
?>	

		</tbody>			
	</table>		
<?php
	}

		break;
	case 'AUTH_NOT_LOGGED':
?>

	<br/>
	<br/>
	<form action="index.php?admin=1/login" method="post">
			<table cellspacing="2">
				<tr>
					<td>Nome Utente:</td>
					<td><input type="text" name="uname"/></td>
				</tr>
				<tr>
					<td>Password:</td>
					<td><input type="password" name="passw"/></td>
				</tr>
				<tr>
					<td colspan="2"><input type="submit" name="action" value="login"/></td>
				</tr>
			</table>
		</form>
<?php
		break;
	case 'AUTH_LOGGING-IN':
			echo('<p>Verifica delle credenziali, attendere.</p>');
		  break;
	case 'AUTH_LOGGING-OUT':
			echo('<p>Log-out in corso, attendere.</p>');
		  break;		  
	case 'AUTH_INVALID_PARAMS':
			echo('<p>Credenziali di accesso non valide, attendere.</p>');
		  break;		
	}
?>

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