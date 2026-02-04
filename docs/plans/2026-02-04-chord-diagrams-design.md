# Chord Diagrams Feature Design

**Date:** 2026-02-04
**Status:** Approved
**GitHub Discussion:** [#633](https://github.com/no-chris/chord-mark/discussions/633)

## Overview

Extend chord-mark and chord-chart-studio to support custom chord notation/diagrams. Users can define guitar chord voicings and render them as SVG diagrams, either in a dictionary section or inline with chord symbols.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Instruments | Guitar only (6 strings) |
| Voicing definition | Both library directives and inline overrides |
| Fret notation | Simple fret string (`x32010`) |
| Diagram placement | Configurable: dictionary, inline, or both |
| Rendering format | SVG |
| Library syntax | Directive-based (`#chord`) |
| Inline syntax | Brackets (`Cmaj7[x32000]`) |

---

## 1. ChordMark Syntax Extensions

### Chord Library Directive

A new directive `#chord` defines reusable voicings:

```
#chord Cmaj7 x32000
#chord Am7 x02010
#chord Dm7 xx0211
```

The format is `#chord <chord-name> <fret-string>` where:
- `<chord-name>` matches the chord symbol used in chord lines
- `<fret-string>` is 6 characters (low E to high E), using `0-9` for frets 0-9, `x` for muted, and letters `a-z` for frets 10-35

Directives can appear anywhere but typically go at the top of the song, after key/time signature.

### Inline Voicing Override

For one-off voicings, append brackets to any chord symbol:

```
| Cmaj7[x35453] . Am7 . |
```

This overrides any library definition for just that occurrence.

### Matching Behavior

When rendering chord diagrams:
1. Check for inline override first
2. Fall back to `#chord` directive definition
3. If no custom voicing defined, the chord appears in output without a diagram

### Example Song

```
#key C
#chord Cmaj7 x32000
#chord Am7 x02010

Verse
| Cmaj7 . Am7 . | Dm7[xx0211] . G7 . |
Somewhere _over the _rainbow
```

---

## 2. Parser Changes (chord-mark)

### New Line Type

Add `ChordDefinition` to the existing line types:

```javascript
{
  type: 'chordDefinition',
  model: {
    chordName: 'Cmaj7',      // as written in directive
    normalizedName: 'Cma7',  // normalized via chord-symbol
    frets: [null, 3, 2, 0, 0, 0],  // parsed array, null = muted
    source: 'directive'      // 'directive' or 'inline'
  }
}
```

### Song Model Extension

The parsed song object gets a new `chordDefinitions` map:

```javascript
{
  allLines: [...],
  allChords: [...],
  chordDefinitions: {
    'Cma7': { frets: [null, 3, 2, 0, 0, 0], source: 'directive' },
    'Am7': { frets: [null, 0, 2, 0, 1, 0], source: 'directive' }
  }
}
```

### Chord Token Extension

When parsing chord lines, each chord token gains an optional `inlineVoicing`:

```javascript
{
  symbol: 'Dm7',
  normalizedSymbol: 'Dm7',
  inlineVoicing: [null, null, 0, 2, 1, 1]  // if [xx0211] was specified
}
```

### Parsing Flow

1. `parseSong()` detects `#chord` lines → creates `ChordDefinition` entries
2. `parseChordLine()` detects `[xxxxxx]` suffix → extracts inline voicing
3. Both get normalized and stored for the renderer to consume

---

## 3. Renderer Changes (chord-mark)

### New Rendering Options

Add to `renderSong()` options:

```javascript
{
  showChordDiagrams: 'none' | 'dictionary' | 'inline' | 'both',
  diagramPosition: 'top' | 'bottom',  // for dictionary mode
  diagramSize: 'small' | 'medium' | 'large'
}
```

### SVG Diagram Generator

New module `renderer/components/renderChordDiagram.js`:

- Input: fret array `[null, 3, 2, 0, 0, 0]` + chord name
- Output: SVG string with:
  - 6 vertical lines (strings)
  - 5 horizontal lines (frets, configurable range)
  - Dots for finger positions
  - X marks for muted strings
  - O marks for open strings
  - Chord name label above
  - Fret number indicator if not starting at nut

### Dictionary Renderer

New component `renderChordDictionary.js`:

- Collects all unique chords that have voicing definitions
- Renders a grid/flex container of SVG diagrams
- Wrapped in `<div class="cmChordDictionary">`

### Inline Renderer

Extends `renderBarContent.js`:

- If `showChordDiagrams` includes inline, wrap each chord symbol with its diagram above
- Uses smaller diagram size to fit in flow

### HTML Output Structure

```html
<div class="cmChordDictionary cmChordDictionary--top">
  <div class="cmChordDiagram"><!-- SVG --></div>
  <div class="cmChordDiagram"><!-- SVG --></div>
</div>
<div class="cmSong">
  <!-- existing song content -->
</div>
```

---

## 4. chord-chart-studio Integration

### Rendering Options Panel

Add to the existing options panel:

- **Chord Diagrams** dropdown: "None", "Dictionary", "Inline", "Both"
- **Dictionary Position** toggle: "Top" / "Bottom" (visible when dictionary enabled)
- **Diagram Size** selector: "Small", "Medium", "Large"

These options persist per-song in the file's options object.

### Editor Support

The ProseMirror editor needs no special handling - `#chord` directives and `[xxxxxx]` suffixes are plain text. Syntax highlighting could be added later but isn't required for v1.

### Live Preview

The preview pane already re-renders on content change. The new options flow through to `renderSong()` automatically.

### Export

All export modes (print, PDF) inherit the rendering options, so chord diagrams appear in exports when enabled.

---

## 5. Theming (chord-mark-themes)

### CSS Custom Properties

The SVG diagrams use CSS variables for styling:

```css
.cmChordDiagram {
  --cm-diagram-string-color: #333;
  --cm-diagram-fret-color: #333;
  --cm-diagram-dot-color: #000;
  --cm-diagram-dot-radius: 8px;
  --cm-diagram-label-color: #000;
  --cm-diagram-label-font: inherit;
  --cm-diagram-background: transparent;
}
```

### SVG Structure

```html
<svg class="cmChordDiagram" viewBox="0 0 100 120">
  <text class="cmChordDiagram-label">Cmaj7</text>
  <line class="cmChordDiagram-string" />
  <line class="cmChordDiagram-fret" />
  <circle class="cmChordDiagram-dot" />
  <text class="cmChordDiagram-openString">○</text>
  <text class="cmChordDiagram-mutedString">×</text>
  <text class="cmChordDiagram-fretNumber">3</text>
</svg>
```

### Theme Updates

Each existing theme gets diagram styles that complement its aesthetic. The default theme provides sensible defaults.

### Print Considerations

Diagrams use solid colors (no gradients) and sufficient contrast for black & white printing.

---

## 6. Implementation Scope

### Packages Affected

1. **chord-mark** (core changes)
   - Parser: new `#chord` directive handler, inline `[xxxxxx]` parser
   - Renderer: new diagram generator, dictionary component, inline integration
   - Types: extend Song model and rendering options

2. **chord-mark-themes**
   - Add diagram CSS variables and styles to each theme

3. **chord-chart-studio**
   - Options panel: new diagram settings
   - State: persist diagram options per file

### Out of Scope for v1

- Other instruments (ukulele, bass, etc.)
- Visual fretboard editor UI
- Default voicing library (auto-generating diagrams for undefined chords)
- Finger number annotations
- Barré notation

### Testing Strategy

- Unit tests for fret string parsing (`x32000` → array)
- Unit tests for SVG generation (snapshot tests)
- Integration tests for full parse → render flow with diagrams
- Visual regression tests in Storybook for chord-chart-studio

### Migration

No breaking changes - existing ChordMark files work unchanged. New syntax is purely additive.
