import parseSong from '../../../../src/parser/parseSong';
import splitBarsPerLine from '../../../../src/renderer/helpers/splitBarsPerLine';
import lineTypes from '../../../../src/parser/lineTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsedLines(songSrc) {
	return parseSong(songSrc).allLines;
}

// ---------------------------------------------------------------------------
// Module smoke-test
// ---------------------------------------------------------------------------

describe('splitBarsPerLine', () => {
	test('is a function', () => {
		expect(splitBarsPerLine).toBeInstanceOf(Function);
	});

	// -----------------------------------------------------------------------
	// barsPerLine falsy / undefined → no-op
	// -----------------------------------------------------------------------

	test('returns allLines unchanged when barsPerLine is 0', () => {
		const lines = parsedLines('C G Am F\nsome lyrics');
		expect(splitBarsPerLine(lines, 0)).toStrictEqual(lines);
	});

	test('returns allLines unchanged when barsPerLine is undefined', () => {
		const lines = parsedLines('C G Am F\nsome lyrics');
		expect(splitBarsPerLine(lines, undefined)).toStrictEqual(lines);
	});

	// -----------------------------------------------------------------------
	// barsPerLine >= barCount → no split
	// -----------------------------------------------------------------------

	test('does not split when barsPerLine equals bar count', () => {
		// 4 bars, barsPerLine 4 → unchanged
		const lines = parsedLines('C G Am F');
		const result = splitBarsPerLine(lines, 4);
		expect(result).toHaveLength(lines.length);
		const chordLine = result.find((l) => l.type === lineTypes.CHORD);
		expect(chordLine.model.allBars).toHaveLength(4);
	});

	test('does not split when barsPerLine is larger than bar count', () => {
		const lines = parsedLines('C G Am F');
		const result = splitBarsPerLine(lines, 99);
		expect(result).toHaveLength(lines.length);
		const chordLine = result.find((l) => l.type === lineTypes.CHORD);
		expect(chordLine.model.allBars).toHaveLength(4);
	});

	// -----------------------------------------------------------------------
	// Chord-only line: split bars, no lyric handling
	// -----------------------------------------------------------------------

	describe('chord-only line (no following lyric)', () => {
		test('6-bar chord line splits into 3 lines of 2 bars each', () => {
			// 6 bars: C | G | Am | F | Dm | E
			const lines = parsedLines('C G Am F Dm E');
			const result = splitBarsPerLine(lines, 2);

			const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
			expect(chordLines).toHaveLength(3);
			chordLines.forEach((cl) => {
				expect(cl.model.allBars).toHaveLength(2);
			});
		});

		test('produced chord-only lines have hasPositionedChords = false', () => {
			const lines = parsedLines('C G Am F Dm E');
			const result = splitBarsPerLine(lines, 2);
			const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
			chordLines.forEach((cl) => {
				expect(cl.model.hasPositionedChords).toBe(false);
			});
		});

		test('5-bar chord line with barsPerLine=2 produces [2,2,1] bars', () => {
			// 5 bars: C G Am F Dm
			const lines = parsedLines('C G Am F Dm');
			const result = splitBarsPerLine(lines, 2);
			const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
			expect(chordLines).toHaveLength(3);
			expect(chordLines[0].model.allBars).toHaveLength(2);
			expect(chordLines[1].model.allBars).toHaveLength(2);
			expect(chordLines[2].model.allBars).toHaveLength(1);
		});

		test('preserves bar chord content after splitting', () => {
			const original = parsedLines('C G Am F Dm E');
			const result = splitBarsPerLine(original, 2);
			const chordLines = result.filter((l) => l.type === lineTypes.CHORD);

			// First chunk should contain C and G
			expect(chordLines[0].model.allBars[0].allChords[0].string).toBe(
				'C'
			);
			expect(chordLines[1].model.allBars[0].allChords[0].string).toBe(
				'Am'
			);
			expect(chordLines[2].model.allBars[0].allChords[0].string).toBe(
				'Dm'
			);
		});
	});

	// -----------------------------------------------------------------------
	// Chord line NOT immediately followed by a lyric line
	// -----------------------------------------------------------------------

	test('non-lyric line between chord lines: only chord line is split', () => {
		// two chord lines in a row (no lyric between them)
		const lines = parsedLines('C G Am F Dm E\nAb Bb');
		const result = splitBarsPerLine(lines, 2);

		const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
		// first chord line (6 bars) → 3 chunks; second chord line (2 bars) → unchanged
		expect(chordLines).toHaveLength(4);
	});

	// -----------------------------------------------------------------------
	// Chord line + positioned lyric line
	// -----------------------------------------------------------------------

	describe('chord line with positioned lyrics', () => {
		// Song: 3 bars, each bar has one chord, 6 positioned chords total
		// "C.. G.. | Am.. F.. | Dm.. E.."  → 6 chords across 3 bars
		// Lyric: "_one _two _three _four _five _six"
		// barsPerLine: 1 → 3 chunks of 1 bar

		function setupSixChords() {
			// Each bar has 2 chords (4/4: 2 beats each), 3 bars = 6 chords
			const songSrc =
				'C.. G.. Am.. F.. Dm.. E..\n_one _two _three _four _five _six';
			const lines = parseSong(songSrc).allLines;
			return splitBarsPerLine(lines, 1);
		}

		test('produces 3 chord lines and 3 lyric lines for 3-bar song with barsPerLine=1', () => {
			const result = setupSixChords();
			const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
			const lyricLines = result.filter((l) => l.type === lineTypes.LYRIC);
			expect(chordLines).toHaveLength(3);
			expect(lyricLines).toHaveLength(3);
		});

		test('chord and lyric lines are interleaved after split', () => {
			const result = setupSixChords();
			expect(result[0].type).toBe(lineTypes.CHORD);
			expect(result[1].type).toBe(lineTypes.LYRIC);
			expect(result[2].type).toBe(lineTypes.CHORD);
			expect(result[3].type).toBe(lineTypes.LYRIC);
			expect(result[4].type).toBe(lineTypes.CHORD);
			expect(result[5].type).toBe(lineTypes.LYRIC);
		});

		test('first lyric chunk contains words for first bar', () => {
			const result = setupSixChords();
			const firstLyric = result[1].model.lyrics;
			// first bar has chords at positions 0 and 4 (for "one " and "two ")
			// first chunk should contain "one " and "two " up to boundary
			expect(firstLyric).toContain('one');
			expect(firstLyric).toContain('two');
			expect(firstLyric).not.toContain('three');
		});

		test('second lyric chunk contains words for second bar', () => {
			const result = setupSixChords();
			const secondLyric = result[3].model.lyrics;
			expect(secondLyric).toContain('three');
			expect(secondLyric).toContain('four');
			expect(secondLyric).not.toContain('one');
			expect(secondLyric).not.toContain('five');
		});

		test('third lyric chunk contains words for third bar', () => {
			const result = setupSixChords();
			const thirdLyric = result[5].model.lyrics;
			expect(thirdLyric).toContain('five');
			expect(thirdLyric).toContain('six');
			expect(thirdLyric).not.toContain('one');
			expect(thirdLyric).not.toContain('three');
		});

		test('lyric chunk chordPositions are re-based (start from 0 relative to chunk)', () => {
			const result = setupSixChords();
			// The second chunk's first chordPosition should be 0 (re-based)
			const secondLyricModel = result[3].model;
			expect(secondLyricModel.chordPositions[0]).toBe(0);
		});

		test('each lyric chunk preserves the right number of chordPositions', () => {
			const result = setupSixChords();
			// Each bar has 2 chords → 2 positions per chunk
			expect(result[1].model.chordPositions).toHaveLength(2);
			expect(result[3].model.chordPositions).toHaveLength(2);
			expect(result[5].model.chordPositions).toHaveLength(2);
		});

		test('produced chord lines have hasPositionedChords = true', () => {
			const result = setupSixChords();
			const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
			chordLines.forEach((cl) => {
				expect(cl.model.hasPositionedChords).toBe(true);
			});
		});
	});

	// -----------------------------------------------------------------------
	// barsPerLine = 2 on a 3-bar + lyric song
	// -----------------------------------------------------------------------

	describe('barsPerLine=2 on 3-bar + lyric', () => {
		// 3 bars, 6 chords, barsPerLine=2 → chunk [2 bars, 1 bar]
		function setup() {
			const songSrc =
				'C.. G.. Am.. F.. Dm.. E..\n_one _two _three _four _five _six';
			const lines = parseSong(songSrc).allLines;
			return splitBarsPerLine(lines, 2);
		}

		test('produces 2 chord lines and 2 lyric lines', () => {
			const result = setup();
			expect(
				result.filter((l) => l.type === lineTypes.CHORD)
			).toHaveLength(2);
			expect(
				result.filter((l) => l.type === lineTypes.LYRIC)
			).toHaveLength(2);
		});

		test('first chord chunk has 2 bars', () => {
			const result = setup();
			expect(result[0].model.allBars).toHaveLength(2);
		});

		test('second chord chunk has 1 bar', () => {
			const result = setup();
			expect(result[2].model.allBars).toHaveLength(1);
		});

		test('first lyric chunk contains words one through four', () => {
			const result = setup();
			const firstLyric = result[1].model.lyrics;
			expect(firstLyric).toContain('one');
			expect(firstLyric).toContain('four');
			expect(firstLyric).not.toContain('five');
		});

		test('second lyric chunk contains words five and six', () => {
			const result = setup();
			const secondLyric = result[3].model.lyrics;
			expect(secondLyric).toContain('five');
			expect(secondLyric).toContain('six');
			expect(secondLyric).not.toContain('one');
		});
	});

	// -----------------------------------------------------------------------
	// Non-chord lines pass through unchanged
	// -----------------------------------------------------------------------

	test('non-chord lines pass through unchanged', () => {
		const songSrc = '#v\nC G Am F\nsome lyrics\n\n#c\nF G\nchorus lyrics';
		const lines = parsedLines(songSrc);
		const result = splitBarsPerLine(lines, 1);

		// Section labels should still be present
		const sectionLabels = result.filter(
			(l) => l.type === lineTypes.SECTION_LABEL
		);
		expect(sectionLabels).toHaveLength(2);

		// Empty line should still be present
		const emptyLines = result.filter(
			(l) => l.type === lineTypes.EMPTY_LINE
		);
		expect(emptyLines).toHaveLength(1);
	});

	// -----------------------------------------------------------------------
	// Trailing lyric text after last chord position goes with last chunk
	// -----------------------------------------------------------------------

	test('trailing text after last chord position goes with last chunk', () => {
		// lyric: "_hello world _goodbye moon trailing text"
		// 2 bars, barsPerLine=1
		const songSrc = 'C G\n_hello world _goodbye moon trailing text';
		const lines = parseSong(songSrc).allLines;
		const result = splitBarsPerLine(lines, 1);

		const lyricLines = result.filter((l) => l.type === lineTypes.LYRIC);
		expect(lyricLines).toHaveLength(2);

		// second chunk should contain "goodbye moon trailing text"
		expect(lyricLines[1].model.lyrics).toContain('trailing text');
	});

	// -----------------------------------------------------------------------
	// Chord line with fewer positioned chords than bars (some chords unpositioned)
	// -----------------------------------------------------------------------

	test('handles case where positioned chords < total chords gracefully', () => {
		// 3 bars, 3 chords, only 1 positioned chord in lyric line
		// barsPerLine=1 → split into 3 chunks; only first lyric chunk gets a word
		const songSrc = 'C G Am\n_only one position';
		const lines = parseSong(songSrc).allLines;
		const result = splitBarsPerLine(lines, 1);

		const lyricLines = result.filter((l) => l.type === lineTypes.LYRIC);
		// Reflow change: blank lyric chunks (the 2nd and 3rd bars carry no
		// lyric text) are no longer emitted as empty lyric lines, so only the
		// first chunk produces a lyric line.
		expect(lyricLines).toHaveLength(1);

		// First lyric chunk has the one positioned chord
		expect(lyricLines[0].model.chordPositions).toHaveLength(1);
	});

	// -----------------------------------------------------------------------
	// Song with multiple chord lines (only the ones needing split are affected)
	// -----------------------------------------------------------------------

	test('only splits chord lines with more bars than barsPerLine', () => {
		// First chord line: 4 bars → needs split at barsPerLine=2
		// Second chord line: 1 bar → no split
		const songSrc = 'C G Am F\nD';
		const lines = parseSong(songSrc).allLines;
		const result = splitBarsPerLine(lines, 2);

		const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
		// 4-bar line splits into 2; 1-bar line stays as 1 → total 3
		expect(chordLines).toHaveLength(3);
		expect(chordLines[0].model.allBars).toHaveLength(2);
		expect(chordLines[1].model.allBars).toHaveLength(2);
		expect(chordLines[2].model.allBars).toHaveLength(1);
	});

	// -----------------------------------------------------------------------
	// barsPerLine=1 on a single-bar chord line → no split
	// -----------------------------------------------------------------------

	test('single-bar chord line with barsPerLine=1 is not split', () => {
		// "C" alone = 1 bar (whole bar, 4 beats) in 4/4
		const lines = parsedLines('C');
		const result = splitBarsPerLine(lines, 1);
		const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
		expect(chordLines).toHaveLength(1);
		expect(chordLines[0].model.allBars).toHaveLength(1);
	});

	// -----------------------------------------------------------------------
	// Reflow: merge contiguous chord(+lyric) runs and re-chunk to fill N bars
	// -----------------------------------------------------------------------

	describe('reflow (merge then re-chunk)', () => {
		// 1. Lone bar absorbed: 9 lyric-less bars across 3 lines → [4,4,1]
		test('absorbs lone bars across lyric-less lines into [4,4,1]', () => {
			const lines = parsedLines(
				'A7+ A°7 Bm7/F# DmM7(b5)\nA7+ Gm6 Bm7/F# E7(b9)\nA7+'
			);
			const result = splitBarsPerLine(lines, 4);
			const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
			const lyricLines = result.filter((l) => l.type === lineTypes.LYRIC);
			expect(lyricLines).toHaveLength(0);
			expect(chordLines.map((l) => l.model.allBars.length)).toEqual([
				4, 4, 1,
			]);
			chordLines.forEach((cl) => {
				expect(cl.model.hasPositionedChords).toBe(false);
			});
		});

		// 2. Lyric-less line merges with following positioned chord+lyric line
		test('lyric-less line merges with following lyric line bars', () => {
			// Gdim7 (1 bar, no lyric) + D6/F# Fdim7 E7 (3 bars, positioned lyric)
			const lines = parsedLines(
				'Gdim7\nD6/F# Fdim7 E7\n_one _two _three'
			);
			const result = splitBarsPerLine(lines, 4);
			const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
			const lyricLines = result.filter((l) => l.type === lineTypes.LYRIC);
			// 1 + 3 = 4 bars → one merged 4-bar chord line + one lyric line
			expect(chordLines).toHaveLength(1);
			expect(chordLines[0].model.allBars).toHaveLength(4);
			expect(lyricLines).toHaveLength(1);
			// lyric text preserved in order; first bar (Gdim7) has no word
			expect(lyricLines[0].model.lyrics).toContain('one');
			expect(lyricLines[0].model.lyrics).toContain('two');
			expect(lyricLines[0].model.lyrics).toContain('three');
			expect(lyricLines[0].model.lyrics.indexOf('one')).toBeLessThan(
				lyricLines[0].model.lyrics.indexOf('two')
			);
		});

		// 3. Two positioned chord+lyric lines merge & re-chunk
		test('two positioned chord+lyric lines re-chunk to [4,2] at barsPerLine=4', () => {
			const lines = parsedLines('A B C D\n_a _b _c _d\nE F\n_e _f');
			const result = splitBarsPerLine(lines, 4);
			const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
			const lyricLines = result.filter((l) => l.type === lineTypes.LYRIC);
			expect(chordLines.map((l) => l.model.allBars.length)).toEqual([
				4, 2,
			]);
			expect(lyricLines).toHaveLength(2);
			expect(lyricLines[0].model.lyrics).toBe('a b c d');
			expect(lyricLines[1].model.lyrics).toBe('e f');
		});

		test('two positioned chord+lyric lines merge into [6] at barsPerLine=6', () => {
			const lines = parsedLines('A B C D\n_a _b _c _d\nE F\n_e _f');
			const result = splitBarsPerLine(lines, 6);
			const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
			const lyricLines = result.filter((l) => l.type === lineTypes.LYRIC);
			expect(chordLines).toHaveLength(1);
			expect(chordLines[0].model.allBars).toHaveLength(6);
			expect(lyricLines).toHaveLength(1);
			// single-space separator between the two lyric segments
			expect(lyricLines[0].model.lyrics).toBe('a b c d e f');
		});

		// 4. Empty line breaks the run
		test('empty line breaks the run (no merge across blank line)', () => {
			const lines = parsedLines('A B\n\nC D');
			const result = splitBarsPerLine(lines, 4);
			const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
			const emptyLines = result.filter(
				(l) => l.type === lineTypes.EMPTY_LINE
			);
			expect(emptyLines).toHaveLength(1);
			expect(chordLines).toHaveLength(2);
			expect(chordLines[0].model.allBars).toHaveLength(2);
			expect(chordLines[1].model.allBars).toHaveLength(2);
		});

		// 5. Section label breaks the run
		test('section label breaks the run (no merge across section)', () => {
			const lines = parsedLines('A B\n#chorus\nC D');
			const result = splitBarsPerLine(lines, 4);
			const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
			const sectionLabels = result.filter(
				(l) => l.type === lineTypes.SECTION_LABEL
			);
			expect(sectionLabels).toHaveLength(1);
			expect(chordLines).toHaveLength(2);
			expect(chordLines[0].model.allBars).toHaveLength(2);
			expect(chordLines[1].model.allBars).toHaveLength(2);
		});

		// 6. Non-positioned lyric is not merged
		test('non-positioned lyric pair is not merged with following chord line', () => {
			// "C G\nhello world" is non-positioned; "Am F" follows
			const lines = parsedLines('C G\nhello world\nAm F');
			const result = splitBarsPerLine(lines, 4);
			const chordLines = result.filter((l) => l.type === lineTypes.CHORD);
			const lyricLines = result.filter((l) => l.type === lineTypes.LYRIC);
			// not merged → two separate chord lines of 2 bars each
			expect(chordLines).toHaveLength(2);
			expect(chordLines[0].model.allBars).toHaveLength(2);
			expect(chordLines[1].model.allBars).toHaveLength(2);
			expect(lyricLines).toHaveLength(1);
			expect(lyricLines[0].model.lyrics).toBe('hello world');
		});
	});
});
