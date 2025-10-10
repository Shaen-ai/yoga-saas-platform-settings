const fs = require('fs');
const path = require('path');

// Read the built index.html
const htmlPath = path.join(__dirname, 'build', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Add timestamp to JS and CSS file references
const timestamp = Date.now();
html = html.replace(/\.js"/g, `.js?v=${timestamp}"`);
html = html.replace(/\.css"/g, `.css?v=${timestamp}"`);

// Write back
fs.writeFileSync(htmlPath, html);
console.log(`✅ Added cache-busting timestamp: ${timestamp}`);
