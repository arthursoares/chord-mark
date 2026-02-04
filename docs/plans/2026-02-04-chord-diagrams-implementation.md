# Chord Diagrams Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add guitar chord diagram support to chord-mark, allowing users to define voicings via `#chord` directives and inline `[frets]` syntax, rendered as SVG diagrams.

**Architecture:** Parser detects `#chord` directives and `[xxxxxx]` suffixes, storing voicing data in the song model. Renderer generates SVG diagrams either in a dictionary section or inline with chord symbols. Options control display mode.

**Tech Stack:** JavaScript (ES6+), Jest for testing, SCSS for theming

---

## Task 1: Add `chordDefinition` Line Type

**Files:**

-   Modify: `packages/chord-mark/src/parser/lineTypes.js`
-   Test: `packages/chord-mark/tests/unit/parser/lineTypes.spec.js` (create)

**Step 1: Write the failing test**

Create `packages/chord-mark/tests/unit/parser/lineTypes.spec.js`:

```javascript
import lineTypes from '../../../src/parser/lineTypes';

describe('lineTypes', () => {
	test('Module', () => {
		expect(lineTypes).toBeInstanceOf(Object);
	});

	test('contains CHORD_DEFINITION type', () => {
		expect(lineTypes.CHORD_DEFINITION).toBe('chordDefinition');
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="lineTypes.spec.js"`

Expected: FAIL with `expect(received).toBe(expected) // undefined to be 'chordDefinition'`

**Step 3: Write minimal implementation**

Modify `packages/chord-mark/src/parser/lineTypes.js`:

```javascript
/**
 * @enum {String}
 * @readonly
 */
export default {
	CHORD: 'chord',
	CHORD_DEFINITION: 'chordDefinition',
	EMPTY_LINE: 'emptyLine',
	KEY_DECLARATION: 'keyDeclaration',
	LYRIC: 'lyric',
	SECTION_LABEL: 'sectionLabel',
	TIME_SIGNATURE: 'timeSignature',
};
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="lineTypes.spec.js"`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/chord-mark/src/parser/lineTypes.js packages/chord-mark/tests/unit/parser/lineTypes.spec.js
git commit -m "feat(parser): add CHORD_DEFINITION line type"
```

---

## Task 2: Create `isChordDefinition` Matcher

**Files:**

-   Create: `packages/chord-mark/src/parser/matchers/isChordDefinition.js`
-   Test: `packages/chord-mark/tests/unit/parser/matchers/isChordDefinition.spec.js`

**Step 1: Write the failing test**

Create `packages/chord-mark/tests/unit/parser/matchers/isChordDefinition.spec.js`:

```javascript
import isChordDefinition from '../../../../src/parser/matchers/isChordDefinition';

describe('isChordDefinition', () => {
	test('Module', () => {
		expect(isChordDefinition).toBeInstanceOf(Function);
	});
});

describe.each([
	['chord Cmaj7 x32000', true],
	['chord Am7 x02010', true],
	['chord Dm7 xx0211', true],
	['chord G7 320001', true],
	['chord F#m7 242222', true],
	['chord Bb x13331', true],
	['chord C/G 332010', true],

	// With extra spaces
	['chord   Am7   x02010', true],
	['   chord   Am7   x02010', true],
	['   chord   Am7   x02010  ', true],

	// High frets with letters (a=10, b=11, etc.)
	['chord Cmaj7 x3545a', true],

	// Invalid cases
	['key Am', false],
	['Chord Am x02010', false],
	['CHORD Am x02010', false],
	['chordAm x02010', false],
	['chord Am', false],
	['chord x02010', false],
	['chord Am x0201', false], // only 5 chars
	['chord Am x020100', false], // 7 chars
	['chord Am x0201z', false], // invalid char 'z' (only up to 'o' for fret 24)
	['chord', false],
	['', false],
])('%s => %s', (string, result) => {
	test('Correctly detect chord definition', () => {
		expect(isChordDefinition(string)).toEqual(result);
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="isChordDefinition.spec.js"`

Expected: FAIL with `Cannot find module`

**Step 3: Write minimal implementation**

Create `packages/chord-mark/src/parser/matchers/isChordDefinition.js`:

```javascript
import clearSpaces from '../helper/clearSpaces';

// Fret chars: 0-9 for frets 0-9, a-o for frets 10-24, x for muted
const fretCharPattern = '[0-9a-ox]';
const fretStringPattern = `${fretCharPattern}{6}`;

export const chordDefinitionRegexp = new RegExp(
	`^chord\\s+(.+?)\\s+(${fretStringPattern})$`
);

export default function isChordDefinition(string) {
	const cleaned = clearSpaces(string);
	return chordDefinitionRegexp.test(cleaned);
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="isChordDefinition.spec.js"`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/chord-mark/src/parser/matchers/isChordDefinition.js packages/chord-mark/tests/unit/parser/matchers/isChordDefinition.spec.js
git commit -m "feat(parser): add isChordDefinition matcher"
```

---

## Task 3: Create `parseChordDefinition` Parser

**Files:**

-   Create: `packages/chord-mark/src/parser/parseChordDefinition.js`
-   Test: `packages/chord-mark/tests/unit/parser/parseChordDefinition.spec.js`

**Step 1: Write the failing test**

Create `packages/chord-mark/tests/unit/parser/parseChordDefinition.spec.js`:

```javascript
import parseChordDefinition from '../../../src/parser/parseChordDefinition';

describe('parseChordDefinition', () => {
	test('Module', () => {
		expect(parseChordDefinition).toBeInstanceOf(Function);
	});
});

describe('Valid chord definitions', () => {
	test('parses basic chord definition', () => {
		const result = parseChordDefinition('chord Cmaj7 x32000');
		expect(result).toEqual({
			chordName: 'Cmaj7',
			frets: [null, 3, 2, 0, 0, 0],
		});
	});

	test('parses chord with all muted strings', () => {
		const result = parseChordDefinition('chord Am7 x02010');
		expect(result).toEqual({
			chordName: 'Am7',
			frets: [null, 0, 2, 0, 1, 0],
		});
	});

	test('parses chord with double muted', () => {
		const result = parseChordDefinition('chord Dm7 xx0211');
		expect(result).toEqual({
			chordName: 'Dm7',
			frets: [null, null, 0, 2, 1, 1],
		});
	});

	test('parses chord with high frets (letters)', () => {
		const result = parseChordDefinition('chord Bm x2444a');
		expect(result).toEqual({
			chordName: 'Bm',
			frets: [null, 2, 4, 4, 4, 10],
		});
	});

	test('parses chord with slash in name', () => {
		const result = parseChordDefinition('chord C/G 332010');
		expect(result).toEqual({
			chordName: 'C/G',
			frets: [3, 3, 2, 0, 1, 0],
		});
	});

	test('handles extra whitespace', () => {
		const result = parseChordDefinition('  chord   Am7   x02010  ');
		expect(result).toEqual({
			chordName: 'Am7',
			frets: [null, 0, 2, 0, 1, 0],
		});
	});
});

describe('Invalid chord definitions', () => {
	test('throws on non-chord-definition string', () => {
		expect(() => parseChordDefinition('key Am')).toThrow(TypeError);
	});

	test('throws on missing fret string', () => {
		expect(() => parseChordDefinition('chord Am')).toThrow(TypeError);
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="parseChordDefinition.spec.js"`

Expected: FAIL with `Cannot find module`

**Step 3: Write minimal implementation**

Create `packages/chord-mark/src/parser/parseChordDefinition.js`:

```javascript
import clearSpaces from './helper/clearSpaces';
import isChordDefinition, {
	chordDefinitionRegexp,
} from './matchers/isChordDefinition';

/**
 * @typedef {Object} ChordDefinition
 * @type {Object}
 * @property {String} chordName - the chord symbol as written
 * @property {(Number|null)[]} frets - array of 6 fret numbers, null for muted
 */

/**
 * Parse a fret character to a number or null
 * @param {string} char - single character (0-9, a-o, x)
 * @returns {number|null}
 */
function parseFretChar(char) {
	if (char === 'x') return null;
	if (char >= '0' && char <= '9') return parseInt(char, 10);
	// a=10, b=11, ..., o=24
	return char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
}

/**
 * Parse a fret string into an array of fret numbers
 * @param {string} fretString - 6 character fret string
 * @returns {(number|null)[]}
 */
function parseFretString(fretString) {
	return fretString.split('').map(parseFretChar);
}

/**
 * @param {String} string
 * @returns {ChordDefinition}
 */
export default function parseChordDefinition(string) {
	if (!isChordDefinition(string)) {
		throw new TypeError('Expected chord definition, received: ' + string);
	}

	const found = clearSpaces(string).match(chordDefinitionRegexp);
	const chordName = found[1];
	const fretString = found[2];

	return {
		chordName,
		frets: parseFretString(fretString),
	};
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="parseChordDefinition.spec.js"`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/chord-mark/src/parser/parseChordDefinition.js packages/chord-mark/tests/unit/parser/parseChordDefinition.spec.js
git commit -m "feat(parser): add parseChordDefinition function"
```

---

## Task 4: Integrate Chord Definition into songLinesFactory

**Files:**

-   Modify: `packages/chord-mark/src/parser/songLinesFactory.js`
-   Test: `packages/chord-mark/tests/unit/parser/songLinesFactory.spec.js` (existing)

**Step 1: Write the failing test**

Add to `packages/chord-mark/tests/unit/parser/songLinesFactory.spec.js`:

```javascript
// Add at top with other imports
import lineTypes from '../../../src/parser/lineTypes';

// Add new describe block
describe('Chord definition lines', () => {
	test('parses #chord directive as chordDefinition line', () => {
		const factory = songLinesFactory();
		factory.addLine('chord Cmaj7 x32000', 0, ['chord Cmaj7 x32000']);
		const lines = factory.asArray();

		expect(lines).toHaveLength(1);
		expect(lines[0].type).toBe(lineTypes.CHORD_DEFINITION);
		expect(lines[0].model.chordName).toBe('Cmaj7');
		expect(lines[0].model.frets).toEqual([null, 3, 2, 0, 0, 0]);
	});

	test('parses multiple chord definitions', () => {
		const factory = songLinesFactory();
		const srcLines = ['chord Am7 x02010', 'chord Dm7 xx0211'];
		srcLines.forEach((line, i) => factory.addLine(line, i, srcLines));
		const lines = factory.asArray();

		expect(lines).toHaveLength(2);
		expect(lines[0].model.chordName).toBe('Am7');
		expect(lines[1].model.chordName).toBe('Dm7');
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="songLinesFactory.spec.js" --testNamePattern="Chord definition"`

Expected: FAIL with `expect(received).toBe(expected)` (line type is 'lyric' instead of 'chordDefinition')

**Step 3: Write minimal implementation**

Modify `packages/chord-mark/src/parser/songLinesFactory.js`:

Add imports at top:

```javascript
import isChordDefinition from './matchers/isChordDefinition';
import parseChordDefinition from './parseChordDefinition';
```

Add function inside `songLinesFactory()`:

```javascript
/**
 * @returns {SongChordDefinitionLine}
 */
function getChordDefinitionLine(string) {
	return {
		string,
		type: lineTypes.CHORD_DEFINITION,
		model: parseChordDefinition(string),
	};
}
```

Modify `addLine` function to check for chord definitions before falling through to lyric:

```javascript
// In the addLine function, add this condition before the final else (getLyricLine)
} else if (isChordDefinition(lineSrc)) {
	line = getChordDefinitionLine(lineSrc);
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="songLinesFactory.spec.js" --testNamePattern="Chord definition"`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/chord-mark/src/parser/songLinesFactory.js packages/chord-mark/tests/unit/parser/songLinesFactory.spec.js
git commit -m "feat(parser): integrate chord definitions into songLinesFactory"
```

---

## Task 5: Add chordDefinitions to Song Model

**Files:**

-   Modify: `packages/chord-mark/src/parser/parseSong.js`
-   Create: `packages/chord-mark/src/parser/getAllChordDefinitions.js`
-   Test: `packages/chord-mark/tests/unit/parser/getAllChordDefinitions.spec.js`

**Step 1: Write the failing test**

Create `packages/chord-mark/tests/unit/parser/getAllChordDefinitions.spec.js`:

```javascript
import getAllChordDefinitions from '../../../src/parser/getAllChordDefinitions';
import lineTypes from '../../../src/parser/lineTypes';

describe('getAllChordDefinitions', () => {
	test('Module', () => {
		expect(getAllChordDefinitions).toBeInstanceOf(Function);
	});

	test('returns empty object when no chord definitions', () => {
		const lines = [
			{ type: lineTypes.CHORD, model: {} },
			{ type: lineTypes.LYRIC, model: {} },
		];
		expect(getAllChordDefinitions(lines)).toEqual({});
	});

	test('collects chord definitions by chord name', () => {
		const lines = [
			{
				type: lineTypes.CHORD_DEFINITION,
				model: { chordName: 'Cmaj7', frets: [null, 3, 2, 0, 0, 0] },
			},
			{
				type: lineTypes.CHORD_DEFINITION,
				model: { chordName: 'Am7', frets: [null, 0, 2, 0, 1, 0] },
			},
			{ type: lineTypes.CHORD, model: {} },
		];

		const result = getAllChordDefinitions(lines);

		expect(result).toEqual({
			Cmaj7: { frets: [null, 3, 2, 0, 0, 0], source: 'directive' },
			Am7: { frets: [null, 0, 2, 0, 1, 0], source: 'directive' },
		});
	});

	test('later definitions override earlier ones', () => {
		const lines = [
			{
				type: lineTypes.CHORD_DEFINITION,
				model: { chordName: 'Am', frets: [null, 0, 2, 2, 1, 0] },
			},
			{
				type: lineTypes.CHORD_DEFINITION,
				model: { chordName: 'Am', frets: [5, 7, 7, 5, 5, 5] },
			},
		];

		const result = getAllChordDefinitions(lines);

		expect(result.Am.frets).toEqual([5, 7, 7, 5, 5, 5]);
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="getAllChordDefinitions.spec.js"`

Expected: FAIL with `Cannot find module`

**Step 3: Write minimal implementation**

Create `packages/chord-mark/src/parser/getAllChordDefinitions.js`:

```javascript
import lineTypes from './lineTypes';

/**
 * @typedef {Object} ChordDefinitionEntry
 * @property {(number|null)[]} frets
 * @property {('directive'|'inline')} source
 */

/**
 * Extract all chord definitions from parsed song lines
 * @param {SongLine[]} allLines
 * @returns {Object.<string, ChordDefinitionEntry>}
 */
export default function getAllChordDefinitions(allLines) {
	const definitions = {};

	allLines.forEach((line) => {
		if (line.type === lineTypes.CHORD_DEFINITION) {
			definitions[line.model.chordName] = {
				frets: line.model.frets,
				source: 'directive',
			};
		}
	});

	return definitions;
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="getAllChordDefinitions.spec.js"`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/chord-mark/src/parser/getAllChordDefinitions.js packages/chord-mark/tests/unit/parser/getAllChordDefinitions.spec.js
git commit -m "feat(parser): add getAllChordDefinitions helper"
```

---

## Task 6: Integrate chordDefinitions into parseSong

**Files:**

-   Modify: `packages/chord-mark/src/parser/parseSong.js`
-   Test: `packages/chord-mark/tests/integration/parser/parseSong.spec.js` (existing)

**Step 1: Write the failing test**

Add to `packages/chord-mark/tests/integration/parser/parseSong.spec.js`:

```javascript
describe('Chord definitions', () => {
	test('parseSong includes chordDefinitions in result', () => {
		const song = `chord Cmaj7 x32000
chord Am7 x02010

Verse
| Cmaj7 . Am7 . |
Hello world`;

		const result = parseSong(song);

		expect(result.chordDefinitions).toBeDefined();
		expect(result.chordDefinitions.Cmaj7).toEqual({
			frets: [null, 3, 2, 0, 0, 0],
			source: 'directive',
		});
		expect(result.chordDefinitions.Am7).toEqual({
			frets: [null, 0, 2, 0, 1, 0],
			source: 'directive',
		});
	});

	test('parseSong returns empty chordDefinitions when none defined', () => {
		const song = `Verse
| C . G . |
Hello`;

		const result = parseSong(song);

		expect(result.chordDefinitions).toEqual({});
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="parseSong.spec.js" --testNamePattern="Chord definitions"`

Expected: FAIL with `expect(received).toBeDefined()` (chordDefinitions is undefined)

**Step 3: Write minimal implementation**

Modify `packages/chord-mark/src/parser/parseSong.js`:

Add import:

```javascript
import getAllChordDefinitions from './getAllChordDefinitions';
```

Modify return statement:

```javascript
const chordDefinitions = getAllChordDefinitions(allLines);

return {
	allLines,
	allChords,
	allKeys,
	chordDefinitions,
};
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="parseSong.spec.js" --testNamePattern="Chord definitions"`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/chord-mark/src/parser/parseSong.js packages/chord-mark/tests/integration/parser/parseSong.spec.js
git commit -m "feat(parser): include chordDefinitions in parseSong result"
```

---

## Task 7: Parse Inline Voicing from Chord Symbols

**Files:**

-   Modify: `packages/chord-mark/src/parser/matchers/isChordLine.js`
-   Modify: `packages/chord-mark/src/parser/parseChordLine.js`
-   Test: `packages/chord-mark/tests/unit/parser/parseChordLine.spec.js` (existing)

**Step 1: Write the failing test**

Add to `packages/chord-mark/tests/unit/parser/parseChordLine.spec.js`:

```javascript
describe('Inline voicing', () => {
	test('parses chord with inline voicing', () => {
		const result = parseChordLine('Cmaj7[x32000]');
		expect(result.allBars[0].allChords[0].inlineVoicing).toEqual([
			null,
			3,
			2,
			0,
			0,
			0,
		]);
	});

	test('parses chord without inline voicing', () => {
		const result = parseChordLine('Cmaj7');
		expect(result.allBars[0].allChords[0].inlineVoicing).toBeUndefined();
	});

	test('parses multiple chords with mixed voicings', () => {
		const result = parseChordLine('Cmaj7[x32000] . Am7 . Dm7[xx0211] .');
		const chords = result.allBars[0].allChords;

		expect(chords[0].inlineVoicing).toEqual([null, 3, 2, 0, 0, 0]);
		expect(chords[1].inlineVoicing).toBeUndefined();
		expect(chords[2].inlineVoicing).toEqual([null, null, 0, 2, 1, 1]);
	});

	test('preserves chord symbol without brackets', () => {
		const result = parseChordLine('Cmaj7[x32000]');
		expect(result.allBars[0].allChords[0].string).toBe('Cmaj7[x32000]');
		// The model should still parse the chord correctly without the voicing
		expect(result.allBars[0].allChords[0].model.input.symbol).toBe('Cmaj7');
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="parseChordLine.spec.js" --testNamePattern="Inline voicing"`

Expected: FAIL

**Step 3: Write minimal implementation**

Modify `packages/chord-mark/src/parser/matchers/isChordLine.js`:

Add helper to extract voicing and clean token:

```javascript
// Regex to match inline voicing: [xxxxxx] where x is 0-9, a-o, or x
const inlineVoicingRegexp = /\[([0-9a-ox]{6})\]$/;

export function extractInlineVoicing(token) {
	const match = token.match(inlineVoicingRegexp);
	if (!match) return { cleanToken: token, voicing: undefined };

	const voicingStr = match[1];
	const voicing = voicingStr.split('').map((char) => {
		if (char === 'x') return null;
		if (char >= '0' && char <= '9') return parseInt(char, 10);
		return char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
	});

	return {
		cleanToken: token.replace(inlineVoicingRegexp, ''),
		voicing,
	};
}
```

Modify `cleanToken` function to also remove inline voicing before validation:

```javascript
export function cleanToken(token) {
	const { cleanToken: withoutVoicing } = extractInlineVoicing(token);
	return withoutVoicing
		.replace(syntax.subBeatOpener, '')
		.replace(syntax.subBeatCloser, '');
}
```

Modify `packages/chord-mark/src/parser/parseChordLine.js`:

Import the new function:

```javascript
import {
	getParseableChordLine,
	cleanToken,
	extractInlineVoicing,
} from './matchers/isChordLine';
```

In `parseChordToken`, extract and store the inline voicing:

```javascript
function parseChordToken(token) {
	// ... existing code ...

	const { cleanToken: cleanedTokenNoVoicing, voicing: inlineVoicing } =
		extractInlineVoicing(token);
	cleanedToken = cleanToken(token);

	chord = {
		string: token,
		duration: getChordDuration(token, beatCount, isInSubBeatGroup),
		model: isNoChordSymbol(cleanedToken)
			? syntax.noChord
			: parseChord(cleanedToken, originalKey),
		beat: currentBeatCount + 1,
		isInSubBeatGroup,
	};

	if (inlineVoicing) {
		chord.inlineVoicing = inlineVoicing;
	}

	// ... rest of existing code ...
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="parseChordLine.spec.js" --testNamePattern="Inline voicing"`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/chord-mark/src/parser/matchers/isChordLine.js packages/chord-mark/src/parser/parseChordLine.js packages/chord-mark/tests/unit/parser/parseChordLine.spec.js
git commit -m "feat(parser): support inline voicing syntax [xxxxxx] on chords"
```

---

## Task 8: Create SVG Chord Diagram Renderer

**Files:**

-   Create: `packages/chord-mark/src/renderer/components/renderChordDiagram.js`
-   Test: `packages/chord-mark/tests/unit/renderer/components/renderChordDiagram.spec.js`

**Step 1: Write the failing test**

Create `packages/chord-mark/tests/unit/renderer/components/renderChordDiagram.spec.js`:

```javascript
import renderChordDiagram from '../../../../src/renderer/components/renderChordDiagram';

describe('renderChordDiagram', () => {
	test('Module', () => {
		expect(renderChordDiagram).toBeInstanceOf(Function);
	});

	test('renders SVG element', () => {
		const result = renderChordDiagram({
			chordName: 'C',
			frets: [null, 3, 2, 0, 1, 0],
		});

		expect(result).toContain('<svg');
		expect(result).toContain('</svg>');
		expect(result).toContain('class="cmChordDiagram"');
	});

	test('renders chord name label', () => {
		const result = renderChordDiagram({
			chordName: 'Am7',
			frets: [null, 0, 2, 0, 1, 0],
		});

		expect(result).toContain('cmChordDiagram-label');
		expect(result).toContain('Am7');
	});

	test('renders 6 strings', () => {
		const result = renderChordDiagram({
			chordName: 'C',
			frets: [null, 3, 2, 0, 1, 0],
		});

		const stringMatches = result.match(/cmChordDiagram-string/g);
		expect(stringMatches).toHaveLength(6);
	});

	test('renders muted string marker', () => {
		const result = renderChordDiagram({
			chordName: 'C',
			frets: [null, 3, 2, 0, 1, 0],
		});

		expect(result).toContain('cmChordDiagram-mutedString');
	});

	test('renders open string marker', () => {
		const result = renderChordDiagram({
			chordName: 'C',
			frets: [null, 3, 2, 0, 1, 0],
		});

		expect(result).toContain('cmChordDiagram-openString');
	});

	test('renders finger position dots', () => {
		const result = renderChordDiagram({
			chordName: 'C',
			frets: [null, 3, 2, 0, 1, 0],
		});

		expect(result).toContain('cmChordDiagram-dot');
	});

	test('renders fret number for high positions', () => {
		const result = renderChordDiagram({
			chordName: 'Bm',
			frets: [null, 2, 4, 4, 3, 2],
		});

		expect(result).toContain('cmChordDiagram-fretNumber');
	});

	test('respects size option', () => {
		const small = renderChordDiagram({
			chordName: 'C',
			frets: [null, 3, 2, 0, 1, 0],
			size: 'small',
		});
		const large = renderChordDiagram({
			chordName: 'C',
			frets: [null, 3, 2, 0, 1, 0],
			size: 'large',
		});

		expect(small).toContain('cmChordDiagram--small');
		expect(large).toContain('cmChordDiagram--large');
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="renderChordDiagram.spec.js"`

Expected: FAIL with `Cannot find module`

**Step 3: Write minimal implementation**

Create `packages/chord-mark/src/renderer/components/renderChordDiagram.js`:

```javascript
/**
 * @typedef {Object} ChordDiagramOptions
 * @property {string} chordName
 * @property {(number|null)[]} frets - array of 6 fret numbers, null for muted
 * @property {('small'|'medium'|'large')} [size='medium']
 */

const SIZES = {
	small: { width: 50, height: 65, fontSize: 10 },
	medium: { width: 70, height: 90, fontSize: 12 },
	large: { width: 100, height: 125, fontSize: 16 },
};

const NUM_STRINGS = 6;
const NUM_FRETS = 5;

/**
 * Render a guitar chord diagram as SVG
 * @param {ChordDiagramOptions} options
 * @returns {string} SVG string
 */
export default function renderChordDiagram({
	chordName,
	frets,
	size = 'medium',
}) {
	const { width, height, fontSize } = SIZES[size] || SIZES.medium;
	const sizeClass = `cmChordDiagram--${size}`;

	const padding = { top: 20, left: 10, right: 10, bottom: 10 };
	const gridWidth = width - padding.left - padding.right;
	const gridHeight = height - padding.top - padding.bottom;
	const stringSpacing = gridWidth / (NUM_STRINGS - 1);
	const fretSpacing = gridHeight / NUM_FRETS;

	// Calculate fret range
	const nonNullFrets = frets.filter((f) => f !== null && f > 0);
	const minFret = nonNullFrets.length > 0 ? Math.min(...nonNullFrets) : 1;
	const maxFret = nonNullFrets.length > 0 ? Math.max(...nonNullFrets) : 1;
	const startFret = maxFret <= NUM_FRETS ? 1 : minFret;
	const showFretNumber = startFret > 1;

	const elements = [];

	// Chord name label
	elements.push(
		`<text class="cmChordDiagram-label" x="${width / 2}" y="${fontSize}" text-anchor="middle" font-size="${fontSize}">${escapeXml(chordName)}</text>`
	);

	// Nut (thick line at top) or fret number
	if (startFret === 1) {
		elements.push(
			`<line class="cmChordDiagram-nut" x1="${padding.left}" y1="${padding.top}" x2="${padding.left + gridWidth}" y2="${padding.top}" stroke-width="3"/>`
		);
	} else {
		elements.push(
			`<text class="cmChordDiagram-fretNumber" x="${padding.left - 5}" y="${padding.top + fretSpacing / 2 + 4}" text-anchor="end" font-size="${fontSize * 0.8}">${startFret}</text>`
		);
	}

	// Fret lines (horizontal)
	for (let i = 0; i <= NUM_FRETS; i++) {
		const y = padding.top + i * fretSpacing;
		elements.push(
			`<line class="cmChordDiagram-fret" x1="${padding.left}" y1="${y}" x2="${padding.left + gridWidth}" y2="${y}"/>`
		);
	}

	// String lines (vertical)
	for (let i = 0; i < NUM_STRINGS; i++) {
		const x = padding.left + i * stringSpacing;
		elements.push(
			`<line class="cmChordDiagram-string" x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + gridHeight}"/>`
		);
	}

	// Finger positions, muted strings, open strings
	frets.forEach((fret, stringIndex) => {
		const x = padding.left + stringIndex * stringSpacing;
		const markerY = padding.top - 8;

		if (fret === null) {
			// Muted string
			elements.push(
				`<text class="cmChordDiagram-mutedString" x="${x}" y="${markerY}" text-anchor="middle" font-size="${fontSize}">×</text>`
			);
		} else if (fret === 0) {
			// Open string
			elements.push(
				`<text class="cmChordDiagram-openString" x="${x}" y="${markerY}" text-anchor="middle" font-size="${fontSize}">○</text>`
			);
		} else {
			// Finger position
			const relativeFret = fret - startFret + 1;
			const y = padding.top + (relativeFret - 0.5) * fretSpacing;
			const dotRadius = fretSpacing * 0.35;
			elements.push(
				`<circle class="cmChordDiagram-dot" cx="${x}" cy="${y}" r="${dotRadius}"/>`
			);
		}
	});

	return `<svg class="cmChordDiagram ${sizeClass}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${elements.join('')}</svg>`;
}

function escapeXml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="renderChordDiagram.spec.js"`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/chord-mark/src/renderer/components/renderChordDiagram.js packages/chord-mark/tests/unit/renderer/components/renderChordDiagram.spec.js
git commit -m "feat(renderer): add SVG chord diagram renderer"
```

---

## Task 9: Create Chord Dictionary Renderer

**Files:**

-   Create: `packages/chord-mark/src/renderer/components/renderChordDictionary.js`
-   Create: `packages/chord-mark/src/renderer/components/tpl/chordDictionary.js`
-   Test: `packages/chord-mark/tests/unit/renderer/components/renderChordDictionary.spec.js`

**Step 1: Write the failing test**

Create `packages/chord-mark/tests/unit/renderer/components/renderChordDictionary.spec.js`:

```javascript
import renderChordDictionary from '../../../../src/renderer/components/renderChordDictionary';

describe('renderChordDictionary', () => {
	test('Module', () => {
		expect(renderChordDictionary).toBeInstanceOf(Function);
	});

	test('returns empty string when no definitions', () => {
		const result = renderChordDictionary({});
		expect(result).toBe('');
	});

	test('renders dictionary container', () => {
		const definitions = {
			C: { frets: [null, 3, 2, 0, 1, 0], source: 'directive' },
		};
		const result = renderChordDictionary(definitions);

		expect(result).toContain('cmChordDictionary');
	});

	test('renders all chord diagrams', () => {
		const definitions = {
			C: { frets: [null, 3, 2, 0, 1, 0], source: 'directive' },
			Am: { frets: [null, 0, 2, 2, 1, 0], source: 'directive' },
			G: { frets: [3, 2, 0, 0, 0, 3], source: 'directive' },
		};
		const result = renderChordDictionary(definitions);

		expect(result).toContain('cmChordDiagram');
		// Should contain 3 diagrams
		const diagramMatches = result.match(/cmChordDiagram--/g);
		expect(diagramMatches).toHaveLength(3);
	});

	test('respects position option', () => {
		const definitions = {
			C: { frets: [null, 3, 2, 0, 1, 0], source: 'directive' },
		};

		const top = renderChordDictionary(definitions, { position: 'top' });
		const bottom = renderChordDictionary(definitions, {
			position: 'bottom',
		});

		expect(top).toContain('cmChordDictionary--top');
		expect(bottom).toContain('cmChordDictionary--bottom');
	});

	test('respects size option', () => {
		const definitions = {
			C: { frets: [null, 3, 2, 0, 1, 0], source: 'directive' },
		};

		const result = renderChordDictionary(definitions, { size: 'large' });

		expect(result).toContain('cmChordDiagram--large');
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="renderChordDictionary.spec.js"`

Expected: FAIL with `Cannot find module`

**Step 3: Write minimal implementation**

Create `packages/chord-mark/src/renderer/components/tpl/chordDictionary.js`:

```javascript
const render = ({ diagrams, positionClass }) => {
	return `<div class="cmChordDictionary ${positionClass}">${diagrams}</div>`;
};
export default render;
```

Create `packages/chord-mark/src/renderer/components/renderChordDictionary.js`:

```javascript
import renderChordDiagram from './renderChordDiagram';
import chordDictionaryTpl from './tpl/chordDictionary';

/**
 * @typedef {Object} RenderChordDictionaryOptions
 * @property {('top'|'bottom')} [position='top']
 * @property {('small'|'medium'|'large')} [size='medium']
 */

/**
 * Render a chord dictionary containing all defined chord diagrams
 * @param {Object.<string, {frets: (number|null)[], source: string}>} chordDefinitions
 * @param {RenderChordDictionaryOptions} [options]
 * @returns {string} HTML string
 */
export default function renderChordDictionary(
	chordDefinitions,
	{ position = 'top', size = 'medium' } = {}
) {
	const chordNames = Object.keys(chordDefinitions);

	if (chordNames.length === 0) {
		return '';
	}

	const diagrams = chordNames
		.map((chordName) => {
			const { frets } = chordDefinitions[chordName];
			return renderChordDiagram({ chordName, frets, size });
		})
		.join('');

	const positionClass = `cmChordDictionary--${position}`;

	return chordDictionaryTpl({ diagrams, positionClass });
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="renderChordDictionary.spec.js"`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/chord-mark/src/renderer/components/renderChordDictionary.js packages/chord-mark/src/renderer/components/tpl/chordDictionary.js packages/chord-mark/tests/unit/renderer/components/renderChordDictionary.spec.js
git commit -m "feat(renderer): add chord dictionary renderer"
```

---

## Task 10: Integrate Chord Diagrams into renderSong

**Files:**

-   Modify: `packages/chord-mark/src/renderer/components/renderSong.js`
-   Modify: `packages/chord-mark/src/renderer/components/tpl/song.js`
-   Test: `packages/chord-mark/tests/unit/renderer/components/renderSong.spec.js` (existing)

**Step 1: Write the failing test**

Add to `packages/chord-mark/tests/unit/renderer/components/renderSong.spec.js`:

```javascript
describe('Chord diagrams', () => {
	test('renders chord dictionary when showChordDiagrams is "dictionary"', () => {
		const parsedSong = {
			allLines: [],
			allChords: [],
			allKeys: { auto: null, explicit: [] },
			chordDefinitions: {
				C: { frets: [null, 3, 2, 0, 1, 0], source: 'directive' },
			},
		};

		const result = renderSong(parsedSong, {
			showChordDiagrams: 'dictionary',
		});

		expect(result).toContain('cmChordDictionary');
		expect(result).toContain('cmChordDiagram');
	});

	test('does not render chord dictionary when showChordDiagrams is "none"', () => {
		const parsedSong = {
			allLines: [],
			allChords: [],
			allKeys: { auto: null, explicit: [] },
			chordDefinitions: {
				C: { frets: [null, 3, 2, 0, 1, 0], source: 'directive' },
			},
		};

		const result = renderSong(parsedSong, {
			showChordDiagrams: 'none',
		});

		expect(result).not.toContain('cmChordDictionary');
	});

	test('respects diagramPosition option', () => {
		const parsedSong = {
			allLines: [],
			allChords: [],
			allKeys: { auto: null, explicit: [] },
			chordDefinitions: {
				C: { frets: [null, 3, 2, 0, 1, 0], source: 'directive' },
			},
		};

		const topResult = renderSong(parsedSong, {
			showChordDiagrams: 'dictionary',
			diagramPosition: 'top',
		});
		const bottomResult = renderSong(parsedSong, {
			showChordDiagrams: 'dictionary',
			diagramPosition: 'bottom',
		});

		expect(topResult).toContain('cmChordDictionary--top');
		expect(bottomResult).toContain('cmChordDictionary--bottom');
	});

	test('respects diagramSize option', () => {
		const parsedSong = {
			allLines: [],
			allChords: [],
			allKeys: { auto: null, explicit: [] },
			chordDefinitions: {
				C: { frets: [null, 3, 2, 0, 1, 0], source: 'directive' },
			},
		};

		const result = renderSong(parsedSong, {
			showChordDiagrams: 'dictionary',
			diagramSize: 'large',
		});

		expect(result).toContain('cmChordDiagram--large');
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="renderSong.spec.js" --testNamePattern="Chord diagrams"`

Expected: FAIL

**Step 3: Write minimal implementation**

Modify `packages/chord-mark/src/renderer/components/tpl/song.js`:

```javascript
const render = ({ chordDictionaryTop, song, chordDictionaryBottom }) => {
	return `${chordDictionaryTop}<div class="cmSong">${song}</div>${chordDictionaryBottom}`;
};
export default render;
```

Modify `packages/chord-mark/src/renderer/components/renderSong.js`:

Add import:

```javascript
import renderChordDictionary from './renderChordDictionary';
```

Add new options to function signature:

```javascript
export default function renderSong(
	parsedSong,
	{
		// ... existing options ...
		showChordDiagrams = 'none',
		diagramPosition = 'top',
		diagramSize = 'medium',
	} = {}
) {
```

Add chord dictionary rendering before the return:

```javascript
let { allLines, allKeys, chordDefinitions = {} } = parsedSong;

// ... existing code ...

// Render chord dictionary
let chordDictionaryTop = '';
let chordDictionaryBottom = '';

if (showChordDiagrams === 'dictionary' || showChordDiagrams === 'both') {
	const dictionaryHtml = renderChordDictionary(chordDefinitions, {
		position: diagramPosition,
		size: diagramSize,
	});

	if (diagramPosition === 'top') {
		chordDictionaryTop = dictionaryHtml;
	} else {
		chordDictionaryBottom = dictionaryHtml;
	}
}

// Modify the return to use new template parameters
return songTpl({
	chordDictionaryTop,
	song: allRenderedLines.join(''),
	chordDictionaryBottom,
});
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="renderSong.spec.js" --testNamePattern="Chord diagrams"`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/chord-mark/src/renderer/components/renderSong.js packages/chord-mark/src/renderer/components/tpl/song.js packages/chord-mark/tests/unit/renderer/components/renderSong.spec.js
git commit -m "feat(renderer): integrate chord diagrams into renderSong"
```

---

## Task 11: Add Chord Diagram Styles to Themes

**Files:**

-   Create: `packages/chord-mark-themes/scss/components/_chordDiagram.scss`
-   Modify: `packages/chord-mark-themes/scss/themes/_common.scss`

**Step 1: Create the chord diagram styles**

Create `packages/chord-mark-themes/scss/components/_chordDiagram.scss`:

```scss
// Chord Diagram Component Styles

.cmChordDictionary {
	display: flex;
	flex-wrap: wrap;
	gap: 1em;
	padding: 1em 0;

	&--top {
		border-bottom: 1px solid var(--cm-diagram-border-color, #ccc);
		margin-bottom: 1em;
	}

	&--bottom {
		border-top: 1px solid var(--cm-diagram-border-color, #ccc);
		margin-top: 1em;
	}
}

.cmChordDiagram {
	--cm-diagram-string-color: var(--cm-text-color, #333);
	--cm-diagram-fret-color: var(--cm-text-color, #333);
	--cm-diagram-dot-color: var(--cm-chord-color, #000);
	--cm-diagram-label-color: var(--cm-chord-color, #000);
	--cm-diagram-background: transparent;

	&-label {
		fill: var(--cm-diagram-label-color);
		font-family: inherit;
		font-weight: bold;
	}

	&-string,
	&-fret {
		stroke: var(--cm-diagram-fret-color);
		stroke-width: 1;
	}

	&-nut {
		stroke: var(--cm-diagram-fret-color);
		stroke-width: 3;
	}

	&-dot {
		fill: var(--cm-diagram-dot-color);
	}

	&-openString,
	&-mutedString {
		fill: var(--cm-diagram-label-color);
		font-family: inherit;
	}

	&-fretNumber {
		fill: var(--cm-diagram-label-color);
		font-family: inherit;
	}

	// Size variants
	&--small {
		width: 50px;
		height: 65px;
	}

	&--medium {
		width: 70px;
		height: 90px;
	}

	&--large {
		width: 100px;
		height: 125px;
	}
}

// Print-friendly styles
@media print {
	.cmChordDiagram {
		--cm-diagram-string-color: #000;
		--cm-diagram-fret-color: #000;
		--cm-diagram-dot-color: #000;
		--cm-diagram-label-color: #000;
	}
}
```

**Step 2: Import in common theme**

Modify `packages/chord-mark-themes/scss/themes/_common.scss`:

Add at the end:

```scss
@import '../components/chordDiagram';
```

**Step 3: Verify build**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark-themes build`

Expected: Build succeeds without errors

**Step 4: Commit**

```bash
git add packages/chord-mark-themes/scss/components/_chordDiagram.scss packages/chord-mark-themes/scss/themes/_common.scss
git commit -m "feat(themes): add chord diagram styles"
```

---

## Task 12: Export New Functions from chord-mark

**Files:**

-   Modify: `packages/chord-mark/src/chordMark.js`

**Step 1: Write the failing test**

Create or add to `packages/chord-mark/tests/unit/chordMark.spec.js`:

```javascript
import { parseSong, renderSong, lineTypes } from '../../src/chordMark';

describe('chordMark exports', () => {
	test('lineTypes includes CHORD_DEFINITION', () => {
		expect(lineTypes.CHORD_DEFINITION).toBe('chordDefinition');
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="chordMark.spec.js"`

Expected: May already pass if lineTypes is already exported; verify the export works

**Step 3: Verify exports are correct**

Read and verify `packages/chord-mark/src/chordMark.js` exports lineTypes correctly (it should already).

**Step 4: Run all tests**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/chord-mark/tests/unit/chordMark.spec.js
git commit -m "test: verify chord-mark exports include CHORD_DEFINITION"
```

---

## Task 13: Add chord-chart-studio Options

**Files:**

-   Modify: `packages/chord-chart-studio/src/db/options/seed.js`
-   Modify: `packages/chord-chart-studio/src/optionsPanels/rendering/allWidgets.js`

**Step 1: Add new options to seed**

Modify `packages/chord-chart-studio/src/db/options/seed.js`:

Add to `songFormatting.values` and `songFormatting.defaults`:

```javascript
showChordDiagrams: 'none',
diagramPosition: 'top',
diagramSize: 'medium',
```

**Step 2: Add widgets for new options**

Modify `packages/chord-chart-studio/src/optionsPanels/rendering/allWidgets.js`:

Add to `preferences.groupWidgetsOrder`:

```javascript
'showChordDiagrams',
'diagramPosition',
'diagramSize',
```

Add to `preferences.allGroupWidgets`:

```javascript
showChordDiagrams: {
	label: 'Chord diagrams',
	type: 'select',
	typeOptions: {
		allChoices: [
			{
				id: 'diagramsNone',
				label: 'None',
				value: 'none',
			},
			{
				id: 'diagramsDictionary',
				label: 'Dictionary',
				value: 'dictionary',
			},
			{
				id: 'diagramsInline',
				label: 'Inline',
				value: 'inline',
			},
			{
				id: 'diagramsBoth',
				label: 'Both',
				value: 'both',
			},
		],
	},
	option: {
		context: 'songFormatting',
		key: 'showChordDiagrams',
	},
},
diagramPosition: {
	label: 'Dictionary position',
	type: 'select',
	typeOptions: {
		allChoices: [
			{
				id: 'diagramPosTop',
				label: 'Top',
				value: 'top',
			},
			{
				id: 'diagramPosBottom',
				label: 'Bottom',
				value: 'bottom',
			},
		],
	},
	option: {
		context: 'songFormatting',
		key: 'diagramPosition',
	},
},
diagramSize: {
	label: 'Diagram size',
	type: 'select',
	typeOptions: {
		allChoices: [
			{
				id: 'diagramSizeSmall',
				label: 'Small',
				value: 'small',
			},
			{
				id: 'diagramSizeMedium',
				label: 'Medium',
				value: 'medium',
			},
			{
				id: 'diagramSizeLarge',
				label: 'Large',
				value: 'large',
			},
		],
	},
	option: {
		context: 'songFormatting',
		key: 'diagramSize',
	},
},
```

**Step 3: Verify the application builds**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-chart-studio && yarn workspace chord-chart-studio build`

Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/chord-chart-studio/src/db/options/seed.js packages/chord-chart-studio/src/optionsPanels/rendering/allWidgets.js
git commit -m "feat(studio): add chord diagram options to UI"
```

---

## Task 14: Wire Options to Renderer in chord-chart-studio

**Files:**

-   Find and modify the file that passes options to `renderSong()`

**Step 1: Locate the renderer integration**

Run: `grep -r "renderSong" packages/chord-chart-studio/src --include="*.js" -l`

**Step 2: Add new options to the renderSong call**

Find where `renderSong` is called and add the new options:

```javascript
showChordDiagrams,
diagramPosition,
diagramSize,
```

**Step 3: Verify the application works**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-chart-studio && yarn workspace chord-chart-studio dev`

Open browser, create a song with `chord Am x02210`, verify the options appear and diagrams render.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(studio): wire chord diagram options to renderer"
```

---

## Task 15: Integration Test

**Files:**

-   Create: `packages/chord-mark/tests/integration/chordDiagrams.spec.js`

**Step 1: Write integration test**

Create `packages/chord-mark/tests/integration/chordDiagrams.spec.js`:

```javascript
import { parseSong, renderSong } from '../../src/chordMark';

describe('Chord Diagrams Integration', () => {
	test('full flow: parse song with chord definitions and render with diagrams', () => {
		const songSrc = `chord Cmaj7 x32000
chord Am7 x02010

Verse
| Cmaj7 . Am7 . |
Hello world`;

		const parsed = parseSong(songSrc);

		expect(parsed.chordDefinitions).toEqual({
			Cmaj7: { frets: [null, 3, 2, 0, 0, 0], source: 'directive' },
			Am7: { frets: [null, 0, 2, 0, 1, 0], source: 'directive' },
		});

		const rendered = renderSong(parsed, {
			showChordDiagrams: 'dictionary',
			diagramPosition: 'top',
			diagramSize: 'medium',
		});

		expect(rendered).toContain('cmChordDictionary--top');
		expect(rendered).toContain('cmChordDiagram');
		expect(rendered).toContain('Cmaj7');
		expect(rendered).toContain('Am7');
		expect(rendered).toContain('cmSong');
	});

	test('inline voicing overrides directive', () => {
		const songSrc = `chord Am x02210

| Am[577555] |
Test`;

		const parsed = parseSong(songSrc);

		// Directive defines x02210
		expect(parsed.chordDefinitions.Am.frets).toEqual([null, 0, 2, 2, 1, 0]);

		// Chord line has inline override
		const chordLine = parsed.allLines.find((l) => l.type === 'chord');
		expect(chordLine.model.allBars[0].allChords[0].inlineVoicing).toEqual([
			5, 7, 7, 5, 5, 5,
		]);
	});
});
```

**Step 2: Run integration test**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn workspace chord-mark test --testPathPattern="chordDiagrams.spec.js"`

Expected: PASS

**Step 3: Commit**

```bash
git add packages/chord-mark/tests/integration/chordDiagrams.spec.js
git commit -m "test: add chord diagrams integration test"
```

---

## Task 16: Run Full Test Suite and Final Verification

**Step 1: Run all chord-mark tests**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn test`

Expected: All tests PASS

**Step 2: Run all chord-chart-studio tests**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-chart-studio && yarn test`

Expected: All tests PASS

**Step 3: Build all packages**

Run: `cd /Users/arthur.soares/Github/chordmark/chord-mark && yarn build`
Run: `cd /Users/arthur.soares/Github/chordmark/chord-chart-studio && yarn build`

Expected: All builds succeed

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete chord diagrams feature implementation"
```

---

## Summary

This implementation plan covers:

1. **Parser changes** (Tasks 1-7): New line type, matcher, parser for `#chord` directives, and inline `[xxxxxx]` voicing syntax
2. **Renderer changes** (Tasks 8-10): SVG diagram generator, chord dictionary component, integration into `renderSong()`
3. **Theming** (Task 11): SCSS styles for chord diagrams
4. **chord-chart-studio** (Tasks 13-14): Options panel widgets and renderer integration
5. **Testing** (Tasks 15-16): Integration tests and full verification

Each task follows TDD: write failing test, implement, verify, commit.
