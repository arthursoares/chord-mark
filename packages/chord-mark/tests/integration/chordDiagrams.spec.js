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
		});

		expect(rendered).toContain('cmChordDictionary--top');
		expect(rendered).toContain('cmChordDiagram');
		expect(rendered).toContain('Cmaj7');
		expect(rendered).toContain('Am7');
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
});
