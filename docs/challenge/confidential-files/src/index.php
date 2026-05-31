<?php
// confidential-files — PHP challenge skeleton
// TODO: Add the vulnerability here

$flag = @file_get_contents('/flag.txt') ?: '(flag not found)';
?><!DOCTYPE html>
<html>
  <head><title>Challenge</title></head>
  <body>
    <h1>Challenge</h1>
    <p><?= htmlspecialchars($flag) ?></p>
  </body>
</html>
