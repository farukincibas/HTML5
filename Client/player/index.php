<?php
if( !empty( $_GET["projectId"]) )
  $projectId = $_GET["projectId"];

if( !empty( $_GET["lang"]) )
  $lang = $_GET["lang"];
?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" class="pc-webBody">
<head>
  <meta charset="UTF-8" />
  <meta name="description" content="PocketCode HTML5 Player" />
  <meta name="author" content="Catrobat HTML5 team: https://github.com/Catrobat/HTML5" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, minimal-ui" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-touch-fullscreen" content="yes" />
  <link href="/html5/pocketCode/img/favicon.png" rel="shortcut icon" />

  <link href="/html5/player/pocketCodePlayer.css" rel="stylesheet" />
  <script src="/html5/player/pocketCodePlayer.js"></script>
  <script type="text/javascript">
    launchProject(<?php if (isset($projectId)) 
                            echo $projectId; 
                        else
                            echo "0";
                        if (isset($lang))
                            echo ", '" . $lang . "'";?>);
  </script>
  <title>PocketCode HTML5 Player</title>
</head>
<body class="pc-webBody pc-webBodyMobile">
  <noscript id="97F79358-0DA5-4243-8C1C-A1AE3BF226C0">This application needs javascript to be enabled!</noscript>
</body>
</html>
