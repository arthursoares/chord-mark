# ChordMark `composer` Directive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional `composer <name>` directive to ChordMark, parsed into the song model as `parseSong(...).composer`, never rendered into the chart body — so the studio's songbook header can show the composer.

**Architecture:** Mirror the existing `key ` declaration end-to-end: a `composerDeclarationPrefix` in syntax, a `COMPOSER` line type, a matcher + parser, a `songLinesFactory` dispatch branch, a `getComposerInSong` helper exposed on the `parseSong` result, and a `renderSong` branch that drops the line from output (like `CHORD_DEFINITION`). Fully backward compatible: no `composer` line ⇒ `composer` is `undefined`.

**Tech Stack:** JavaScript (ES modules), Jest (jsdom), the chord-mark monorepo package `packages/chord-mark`. The repo enforces 100% coverage.

---

### Task 1: Constants + `isComposerDeclaration` matcher

**Files:**
- Modify: `packages/chord-mark/src/parser/syntax.js`
- Modify: `packages/chord-mark/src/parser/lineTypes.js`
- Create: `packages/chord-mark/src/parser/matchers/isComposerDeclaration.js`
- Test: `packages/chord-mark/tests/unit/parser/matchers/isComposerDeclaration.spec.js`

- [ ] **Step 1: Add the constants**

In `syntax.js`, add to the default export object (after `keyDeclarationPrefix`):

```javascript
	composerDeclarationPrefix: 'composer ',
```

In `lineTypes.js`, add to the enum object (adjacent to `KEY_DECLARATION`, matching the two-word naming of the siblings):

```javascript
	COMPOSER_DECLARATION: 'composerDeclaration',
```

- [ ] **Step 2: Write the failing test**

```javascript
import isComposerDeclaration from '../../../../src/parser/matchers/isComposerDeclaration';

describe('isComposerDeclaration', () => {
	test('Module', () => {
		expect(isComposerDeclaration).toBeInstanceOf(Function);
	});

	test.each([
		['composer Antonio Carlos Jobim', true],
		['composer  Tom Jobim e Vinicius', true],
		['  composer Caetano Veloso  ', true],
		['composer', false], // no name
		['composer ', false], // empty name
		['key C', false],
		['Cmaj7', false],
		['', false],
	])('correctly detects "%s" -> %s', (line, expected) => {
		expect(isComposerDeclaration(line)).toBe(expected);
	});
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `yarn jest isComposerDeclaration --coverage=false`
Expected: FAIL — cannot find module `isComposerDeclaration`.

- [ ] **Step 4: Implement the matcher**

Create `isComposerDeclaration.js`:

```javascript
import _escapeRegExp from 'lodash/escapeRegExp';
import syntax from '../syntax';
import clearSpaces from '../helper/clearSpaces';

export const composerDeclarationRegexp = new RegExp(
	'^' + _escapeRegExp(syntax.composerDeclarationPrefix) + '(.+)$'
);

export default function isComposerDeclaration(string) {
	return composerDeclarationRegexp.test(clearSpaces(string));
}
```

(`clearSpaces` trims and collapses whitespace, exactly as `isKeyDeclaration` relies on, so `"  composer X  "` and `"composer  X"` both match and the captured name is clean.)

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn jest isComposerDeclaration --coverage=false`
Expected: PASS (9 assertions).

- [ ] **Step 6: Commit**

```bash
git add packages/chord-mark/src/parser/syntax.js packages/chord-mark/src/parser/lineTypes.js packages/chord-mark/src/parser/matchers/isComposerDeclaration.js packages/chord-mark/tests/unit/parser/matchers/isComposerDeclaration.spec.js
git commit -m "feat(parser): add isComposerDeclaration matcher"
```

---

### Task 2: `parseComposerDeclaration` parser

**Files:**
- Create: `packages/chord-mark/src/parser/parseComposerDeclaration.js`
- Test: `packages/chord-mark/tests/unit/parser/parseComposerDeclaration.spec.js`

- [ ] **Step 1: Write the failing test**

```javascript
import parseComposerDeclaration from '../../../src/parser/parseComposerDeclaration';

describe('parseComposerDeclaration', () => {
	test('returns the composer name', () => {
		expect(parseComposerDeclaration('composer Antonio Carlos Jobim')).toEqual(
			{ string: 'Antonio Carlos Jobim' }
		);
	});

	test('trims surrounding whitespace', () => {
		expect(parseComposerDeclaration('  composer  Tom Jobim ')).toEqual({
			string: 'Tom Jobim',
		});
	});

	test('throws on a non-composer line', () => {
		expect(() => parseComposerDeclaration('key C')).toThrow(TypeError);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest parseComposerDeclaration --coverage=false`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement the parser**

Create `parseComposerDeclaration.js`:

```javascript
import clearSpaces from './helper/clearSpaces';
import isComposerDeclaration, {
	composerDeclarationRegexp,
} from './matchers/isComposerDeclaration';

/**
 * @typedef {Object} ComposerDeclaration
 * @property {String} string - the composer name
 */

/**
 * @param {String} string
 * @returns {ComposerDeclaration}
 */
export default function parseComposerDeclaration(string) {
	if (!isComposerDeclaration(string)) {
		throw new TypeError(
			'Expected composer declaration, received: ' + string
		);
	}

	const found = clearSpaces(string).match(composerDeclarationRegexp);

	return { string: found[1] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest parseComposerDeclaration --coverage=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/chord-mark/src/parser/parseComposerDeclaration.js packages/chord-mark/tests/unit/parser/parseComposerDeclaration.spec.js
git commit -m "feat(parser): add parseComposerDeclaration"
```

---

### Task 3: Route the line type in `songLinesFactory`

**Files:**
- Modify: `packages/chord-mark/src/parser/songLinesFactory.js`
- Test: covered via `parseSong` in Task 4 (factory has no standalone spec entry point).

- [ ] **Step 1: Add imports**

Near the other matcher/parser imports in `songLinesFactory.js`, add:

```javascript
import isComposerDeclaration from './matchers/isComposerDeclaration';
import parseComposerDeclaration from './parseComposerDeclaration';
```

- [ ] **Step 2: Add the line-factory function**

Immediately after `getKeyDeclarationLine`, add:

```javascript
	/**
	 * @returns {SongComposerLine}
	 */
	function getComposerDeclarationLine(string) {
		return {
			string,
			type: lineTypes.COMPOSER_DECLARATION,
			model: parseComposerDeclaration(string),
		};
	}
```

- [ ] **Step 3: Add the dispatch branch**

In the detection chain (the `if (isTimeSignature(lineSrc)) { ... } else if ...` block), add a branch immediately before `else if (isKeyDeclaration(lineSrc))`:

```javascript
			} else if (isComposerDeclaration(lineSrc)) {
				line = getComposerDeclarationLine(lineSrc);
```

(The `composer ` and `key ` prefixes don't overlap, so ordering among the directive matchers is safe; placing it before `isChordDefinition`/lyric prevents it being treated as a lyric.)

- [ ] **Step 4: Verify nothing breaks yet**

Run: `yarn jest songLinesFactory parseSong --coverage=false`
Expected: PASS (no behavior change for existing songs; composer line now produces a `COMPOSER` line object — asserted in Task 4).

- [ ] **Step 5: Commit**

```bash
git add packages/chord-mark/src/parser/songLinesFactory.js
git commit -m "feat(parser): route composer declaration lines"
```

---

### Task 4: Expose `composer` on the `parseSong` result

**Files:**
- Create: `packages/chord-mark/src/parser/getComposerInSong.js`
- Modify: `packages/chord-mark/src/parser/parseSong.js`
- Test: `packages/chord-mark/tests/unit/parser/getComposerInSong.spec.js`
- Test: add to `packages/chord-mark/tests/unit/parser/parseSong.spec.js`

- [ ] **Step 1: Write the failing test for the helper**

Create `getComposerInSong.spec.js`:

```javascript
import getComposerInSong from '../../../src/parser/getComposerInSong';
import lineTypes from '../../../src/parser/lineTypes';

describe('getComposerInSong', () => {
	test('returns the composer name when a composer line exists', () => {
		const allLines = [
			{ type: lineTypes.COMPOSER_DECLARATION, model: { string: 'Tom Jobim' } },
			{ type: lineTypes.LYRIC, model: { lyrics: 'hello' } },
		];
		expect(getComposerInSong(allLines)).toBe('Tom Jobim');
	});

	test('returns undefined when there is no composer line', () => {
		const allLines = [{ type: lineTypes.LYRIC, model: { lyrics: 'hi' } }];
		expect(getComposerInSong(allLines)).toBeUndefined();
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn jest getComposerInSong --coverage=false`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement the helper**

Create `getComposerInSong.js`:

```javascript
import lineTypes from './lineTypes';

/**
 * @param {SongLine[]} allLines
 * @returns {String|undefined}
 */
export default function getComposerInSong(allLines) {
	const composerLine = allLines.find(
		(line) => line.type === lineTypes.COMPOSER_DECLARATION
	);
	return composerLine ? composerLine.model.string : undefined;
}
```

- [ ] **Step 4: Wire it into `parseSong`**

In `parseSong.js`, add the import near the other parser helpers:

```javascript
import getComposerInSong from './getComposerInSong';
```

After `const chordDefinitions = getAllChordDefinitions(allLines);`, add:

```javascript
	const composer = getComposerInSong(allLines);
```

Add `composer` to the returned object:

```javascript
	return {
		allLines,
		allChords,
		allKeys,
		chordDefinitions,
		composer,
	};
```

- [ ] **Step 5: Add a `parseSong` integration test**

Append to `parseSong.spec.js` (inside the top-level `describe`):

```javascript
	test('exposes the composer when a composer directive is present', () => {
		const parsed = parseSong(`composer Antonio Carlos Jobim
C.. G..
Hello world`);

		expect(parsed.composer).toBe('Antonio Carlos Jobim');
	});

	test('composer is undefined when no composer directive is present', () => {
		const parsed = parseSong(`C.. G..
Hello world`);

		expect(parsed.composer).toBeUndefined();
	});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `yarn jest getComposerInSong parseSong --coverage=false`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/chord-mark/src/parser/getComposerInSong.js packages/chord-mark/src/parser/parseSong.js packages/chord-mark/tests/unit/parser/getComposerInSong.spec.js packages/chord-mark/tests/unit/parser/parseSong.spec.js
git commit -m "feat(parser): expose composer on parseSong result"
```

---

### Task 5: Keep the composer line out of the rendered chart

**Files:**
- Modify: `packages/chord-mark/src/renderer/components/renderSong.js`
- Test: add to `packages/chord-mark/tests/unit/renderer/components/renderSong.spec.js`

- [ ] **Step 1: Write the failing test**

Append inside the `renderSong` describe in `renderSong.spec.js`:

```javascript
	test('does not render the composer directive into the chart', () => {
		const parsedSong = parseSong(`composer Tom Jobim
C.. G..
Hello world`);

		const rendered = renderSong(parsedSong);

		expect(rendered).not.toContain('Tom Jobim');
		expect(rendered).not.toContain('composer');
	});
```

(`parseSong` is already imported at the top of this spec.)

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn jest renderSong --coverage=false`
Expected: FAIL — "Tom Jobim" IS present, because the composer line currently falls through to the lyric renderer.

- [ ] **Step 3: Skip the COMPOSER line in renderSong**

In `renderSong.js`, find the branch:

```javascript
				} else if (line.type === lineTypes.CHORD_DEFINITION) {
					// Chord definitions are rendered in the dictionary, not inline
					rendered = false;
```

Add an adjacent branch (immediately before or after it):

```javascript
				} else if (line.type === lineTypes.COMPOSER_DECLARATION) {
					// Composer is metadata for the header, never rendered inline
					rendered = false;
```

- [ ] **Step 4: Run it to verify it passes**

Run: `yarn jest renderSong --coverage=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/chord-mark/src/renderer/components/renderSong.js packages/chord-mark/tests/unit/renderer/components/renderSong.spec.js
git commit -m "fix(renderer): do not render composer directive inline"
```

---

### Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full suite with coverage**

Run: `yarn jest`
Expected: all suites pass, exit 0, **zero** "coverage threshold not met" lines (the repo enforces 100%). If a new file shows < 100%, add the missing case to its spec and re-run.

- [ ] **Step 2: Lint + format check**

Run:
```bash
npx eslint packages/chord-mark/src/parser/matchers/isComposerDeclaration.js packages/chord-mark/src/parser/parseComposerDeclaration.js packages/chord-mark/src/parser/getComposerInSong.js
npx prettier --check "packages/chord-mark/src/parser/**/*.js" "packages/chord-mark/tests/unit/parser/**/*.js"
```
Expected: eslint exit 0; prettier reports all matched files formatted (run `npx prettier --write` on any that aren't, then re-commit).

- [ ] **Step 3: Confirm the public export**

Run: `grep -n "parseSong" packages/chord-mark/src/chordMark.js`
Expected: `parseSong` is exported (it already is), so the studio can read `parseSong(content).composer`. Task 4's tests already prove `composer` is on the result — no extra assertion needed.

---

## Notes for the studio (out of scope for this plan)

Once this ships and the fork is relinked into Chord Chart Studio (Phase 0 of the
songbook spec), the studio reads the composer via `parseSong(content).composer`
and renders it in the print `PageHeader`. That work is a separate plan.
