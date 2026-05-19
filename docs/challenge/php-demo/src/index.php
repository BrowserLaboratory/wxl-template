<?php
/**
 * PHP File Inclusion Demo
 *
 * The `page` parameter is passed directly to include() with no sanitisation.
 * This allows reading arbitrary files on the virtual filesystem — including /flag.txt.
 *
 * Goal: read /flag.txt via the LFI vulnerability.
 */

$page = $_GET['page'] ?? 'home';

// Vulnerability: no validation on $page — Local File Inclusion
?>
<!DOCTYPE html>
<html>
<head>
  <title>PHP Demo</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 40px auto; }
    nav a { margin-right: 12px; }
    pre { background: #f3f4f6; padding: 12px; border-radius: 6px; }
  </style>
</head>
<body>
<h2>PHP File Inclusion Demo</h2>
<nav>
  <a href="?page=home">Home</a>
  <a href="?page=about">About</a>
</nav>
<hr>
<?php
if ($page === 'home') {
    echo "<p>Welcome! This app includes pages via a <code>?page=</code> parameter.</p>";
    echo "<p>Try navigating to <code>?page=about</code>.</p>";
} elseif ($page === 'about') {
    echo "<p>This is the about page.</p>";
    echo "<p>The server reads a PHP file named after the <code>page</code> parameter — can you abuse that?</p>";
} else {
    // Direct file inclusion — classic LFI
    $content = @file_get_contents($page);
    if ($content !== false) {
        echo "<pre>" . htmlspecialchars($content) . "</pre>";
    } else {
        echo "<p style='color:red'>File not found: " . htmlspecialchars($page) . "</p>";
    }
}
?>
</body>
</html>
