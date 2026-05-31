<?php
/**
 * Confidential Files — Broken Access Control via Path Traversal (LFI)
 *
 * "FileVault" publishes quarterly reports through a tiny viewer. The viewer
 * takes a `?file=` parameter and reads it straight out of the `reports/`
 * directory WITHOUT any sanitisation:
 *
 *     file_get_contents('reports/' . $_GET['file'])
 *
 * Because the input is never checked for `../` segments, a caller can climb
 * out of `reports/` and read files mounted next to it — including the flag
 * that lives one level up.
 *
 * Vulnerability: unsanitised path concatenation (CWE-22 path traversal).
 * Goal: request `?file=../flag.txt` to escape `reports/` and read flag.txt.
 *
 * Paths are RELATIVE on purpose: the in-browser php-wasm runtime mounts the
 * challenge files relative to the working directory, so an absolute path such
 * as `/flag.txt` would not resolve.
 */

$reportsDir = 'reports';

// Public reports, listed so a caller can see what a legitimate request is.
$available = array_values(array_filter(
    scandir($reportsDir) ?: [],
    fn ($name) => $name !== '.' && $name !== '..'
));

$requested = $_GET['file'] ?? ($available[0] ?? '');

// Vulnerability: the requested name is concatenated onto the reports directory
// with no path-traversal filtering, so a `../` segment escapes the directory.
$contents = @file_get_contents($reportsDir . '/' . $requested);
if ($contents === false) {
    $contents = 'Report not found: ' . $requested;
}
?><!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>FileVault — Confidential Files</title>
  </head>
  <body>
    <h1>FileVault Reports</h1>
    <p>Public quarterly reports. Open one with <code>?file=&lt;name&gt;</code>.</p>
    <ul>
      <?php foreach ($available as $name): ?>
        <li><a href="?file=<?= htmlspecialchars($name, ENT_QUOTES) ?>"><?= htmlspecialchars($name, ENT_QUOTES) ?></a></li>
      <?php endforeach; ?>
    </ul>
    <h2>Viewing: <?= htmlspecialchars($requested, ENT_QUOTES) ?></h2>
    <pre><?= htmlspecialchars($contents, ENT_QUOTES) ?></pre>
  </body>
</html>
