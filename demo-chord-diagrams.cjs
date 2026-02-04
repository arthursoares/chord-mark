// Demo script for chord diagrams feature
const { parseSong, renderSong } = require('./packages/chord-mark-jsdom/lib/chord-mark-jsdom.js');
const fs = require('fs');

const songSrc = `chord Cmaj7 x32000
chord Am7 x02010
chord Dm7 xx0211
chord G7 320001

Verse
Cmaj7.. Am7..
Somewhere _over the _rainbow

Dm7.. G7..
Way up _high

Chorus
Cmaj7[x35453].. Am7..
There's a _land that I _heard of
`;

console.log('=== Parsing Song ===\n');
const parsed = parseSong(songSrc);

console.log('Chord Definitions found:');
console.log(JSON.stringify(parsed.chordDefinitions, null, 2));

console.log('\n=== Rendering with Dictionary Mode (Top) ===\n');
const renderedDictionary = renderSong(parsed, {
	showChordDiagrams: 'dictionary',
	diagramPosition: 'top',
	diagramSize: 'medium',
	alignChordsWithLyrics: true,
	printBarSeparators: 'never',
	useShortNamings: false,
});

console.log('\n=== Rendering with Inline Mode ===\n');
const renderedInline = renderSong(parsed, {
	showChordDiagrams: 'inline',
	diagramSize: 'small',
	alignChordsWithLyrics: true,
	printBarSeparators: 'never',
	useShortNamings: false,
});

console.log('\n=== Rendering with Both Modes ===\n');
const renderedBoth = renderSong(parsed, {
	showChordDiagrams: 'both',
	diagramPosition: 'top',
	diagramSize: 'small',
	alignChordsWithLyrics: true,
	printBarSeparators: 'never',
	useShortNamings: false,
});

// Save to HTML file for viewing
const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Chord Diagrams Demo</title>
  <style>
    body { font-family: Georgia, serif; padding: 2em; max-width: 1000px; margin: 0 auto; background: #f9f9f9; }
    .demo-section { margin-bottom: 3em; }
    .cmChordDictionary { display: flex; flex-wrap: wrap; gap: 1em; padding: 1em; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 1em; }
    .cmChordDictionary--top { border-bottom: 2px solid #0066cc; }
    .cmChordDiagram { background: white; }
    .cmChordDiagram-label { fill: #0066cc; font-weight: bold; }
    .cmChordDiagram-string, .cmChordDiagram-fret { stroke: #333; stroke-width: 1; }
    .cmChordDiagram-nut { stroke: #333; }
    .cmChordDiagram-dot { fill: #0066cc; }
    .cmChordDiagram-openString, .cmChordDiagram-mutedString, .cmChordDiagram-fretNumber { fill: #333; }
    .cmSong { line-height: 1.2; background: white; padding: 1em; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-family: 'Courier New', monospace; font-size: 14px; white-space: pre-wrap; }
    .cmLine { margin: 0; }
    .cmChordLine { color: #0066cc; font-weight: bold; }
    .cmLyricLine { color: #333; margin-bottom: 1em; }
    .cmSectionLabel { font-weight: bold; margin-top: 1.5em; color: #666; text-transform: uppercase; font-size: 0.9em; letter-spacing: 1px; }
    .cmEmptyLine { height: 0.5em; }
    h1 { color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 0.5em; }
    h2 { color: #666; font-weight: normal; margin-top: 2em; }
    h3 { color: #333; margin-top: 1.5em; }

    /* Inline diagram styles */
    .cmChordWithDiagram { display: inline-flex; flex-direction: column; align-items: center; vertical-align: bottom; }
    .cmChordWithDiagram .cmChordDiagram { margin-bottom: 2px; }
    .cmChordSymbol--withDiagram { display: block; text-align: center; }
  </style>
</head>
<body>
  <h1>Chord Diagrams Demo</h1>
  <h2>ChordMark with Guitar Chord Diagrams</h2>

  <div class="demo-section">
    <h3>1. Dictionary Mode (diagrams at top)</h3>
    <p style="color: #666; font-size: 0.9em;">All chord diagrams shown in a dictionary at the top of the song.</p>
    ${renderedDictionary}
  </div>

  <div class="demo-section">
    <h3>2. Inline Mode (diagrams above each chord)</h3>
    <p style="color: #666; font-size: 0.9em;">Chord diagrams appear directly above each chord symbol. Notice the override voicing on Cmaj7 in the Chorus!</p>
    ${renderedInline}
  </div>

  <div class="demo-section">
    <h3>3. Both Modes (dictionary + inline)</h3>
    <p style="color: #666; font-size: 0.9em;">Dictionary at top plus inline diagrams for reference.</p>
    ${renderedBoth}
  </div>

  <hr style="margin-top: 2em; border: none; border-top: 1px solid #ccc;">
  <p style="color: #999; font-size: 0.9em;">
    <strong>Source:</strong><br>
    <pre style="background: #f0f0f0; padding: 1em; border-radius: 4px; overflow-x: auto;">${songSrc.replace(/</g, '&lt;')}</pre>
  </p>
  <p style="color: #666; font-size: 0.9em;">
    <strong>Note:</strong> The Chorus line uses <code>Cmaj7[x35453]</code> - an inline voicing override that shows a different fingering (barre chord position) than the default <code>x32000</code> defined at the top.
  </p>
</body>
</html>`;

fs.writeFileSync('chord-diagrams-demo.html', htmlDoc);
console.log('Saved to chord-diagrams-demo.html');
console.log('\nOpen in browser: file://' + process.cwd() + '/chord-diagrams-demo.html');
