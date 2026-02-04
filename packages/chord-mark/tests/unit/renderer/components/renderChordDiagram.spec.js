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
		expect(result).toContain('class="cmChordDiagram ');
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
		// Chord at 7th position - frets go from 7-10, exceeding the default 5 frets
		const result = renderChordDiagram({
			chordName: 'Bm',
			frets: [null, 7, 9, 9, 8, 7],
		});

		expect(result).toContain('cmChordDiagram-fretNumber');
		expect(result).toContain('>7<'); // The fret number should be 7
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
