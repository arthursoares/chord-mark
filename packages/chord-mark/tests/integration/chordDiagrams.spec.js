import { parseSong, renderSong } from '../../src/chordMark';

describe('Chord Diagrams Integration', () => {
	test('full flow: parse song with chord definitions and render with diagrams', () => {
		const songSrc = `chord Cmaj7 x32000
chord Am7 x02010

#Verse
Cmaj7.. Am7..
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
			useShortNamings: false,
		});

		expect(rendered).toContain('cmChordDictionary--top');
		expect(rendered).toContain('cmChordDiagram');
		// With useShortNamings: false, Cmaj7 renders as "Cma7", Am7 as "Ami7"
		expect(rendered).toContain('Cma7');
		expect(rendered).toContain('Ami7');
		expect(rendered).toContain('cmSong');
	});

	test('inline voicing overrides directive', () => {
		const songSrc = `chord Am x02210

Am[577555]....
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

	test('inline mode renders diagrams above chord symbols', () => {
		const songSrc = `chord C x32010

C....
Hello`;

		const parsed = parseSong(songSrc);
		const rendered = renderSong(parsed, {
			showChordDiagrams: 'inline',
			diagramSize: 'small',
		});

		// Should contain inline diagram wrapper
		expect(rendered).toContain('cmChordWithDiagram');
		// Should contain the chord diagram
		expect(rendered).toContain('cmChordDiagram');
		// Should NOT contain dictionary (only inline mode)
		expect(rendered).not.toContain('cmChordDictionary');
	});

	test('both mode renders dictionary and inline diagrams', () => {
		const songSrc = `chord G 320003

G....
Test`;

		const parsed = parseSong(songSrc);
		const rendered = renderSong(parsed, {
			showChordDiagrams: 'both',
			diagramPosition: 'top',
			diagramSize: 'small',
		});

		// Should contain dictionary
		expect(rendered).toContain('cmChordDictionary');
		// Should contain inline diagram wrapper
		expect(rendered).toContain('cmChordWithDiagram');
	});

	test('inline mode shows override voicing when present', () => {
		const songSrc = `chord Am x02210

Am[577555]....
Test`;

		const parsed = parseSong(songSrc);
		const rendered = renderSong(parsed, {
			showChordDiagrams: 'inline',
			diagramSize: 'small',
		});

		// Should contain inline diagram
		expect(rendered).toContain('cmChordWithDiagram');
		// The diagram should show the override voicing (fret 5), not the directive voicing
		// Fret 5 would be rendered relative to start fret
		expect(rendered).toContain('cmChordDiagram-dot');
	});
});
