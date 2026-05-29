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

	test('falls back to medium class for an unknown size', () => {
		const result = renderChordDiagram({
			chordName: 'C',
			frets: [null, 3, 2, 0, 1, 0],
			size: 'bogus',
		});

		// Dimensions already fall back to medium; the CSS class must match,
		// otherwise the diagram is rendered with no themed styles at all.
		expect(result).toContain('viewBox="0 0 70 105"');
		expect(result).toContain('cmChordDiagram--medium');
		expect(result).not.toContain('cmChordDiagram--bogus');
	});

	test('renders an all-open chord with nut and open markers', () => {
		const result = renderChordDiagram({
			chordName: 'Em7add11',
			frets: [0, 0, 0, 0, 0, 0],
		});

		// startFret falls back to 1, so the nut must be drawn (not a fret number)
		expect(result).toContain('cmChordDiagram-nut');
		expect(result).not.toContain('cmChordDiagram-fretNumber');
		expect((result.match(/cmChordDiagram-openString/g) || []).length).toBe(
			6
		);
	});

	test('renders an all-muted chord with nut and muted markers', () => {
		const result = renderChordDiagram({
			chordName: 'X',
			frets: [null, null, null, null, null, null],
		});

		expect(result).toContain('cmChordDiagram-nut');
		expect(result).not.toContain('cmChordDiagram-fretNumber');
		expect((result.match(/cmChordDiagram-mutedString/g) || []).length).toBe(
			6
		);
	});

	test('drops the label band height for inline diagrams (no chord name)', () => {
		const frets = [null, 3, 2, 0, 1, 0];
		const labeled = renderChordDiagram({ chordName: 'C', frets });
		const inline = renderChordDiagram({ chordName: '', frets });

		// Labeled keeps the full medium height; inline drops the 15px label band.
		expect(labeled).toContain('viewBox="0 0 70 105"');
		expect(labeled).toContain('height="105"');
		expect(inline).toContain('viewBox="0 0 70 90"');
		expect(inline).toContain('height="90"');
		expect(inline).not.toContain('cmChordDiagram-label');
	});

	test('keeps the fretboard size identical with or without a label', () => {
		const frets = [null, 3, 2, 0, 1, 0];
		const labeled = renderChordDiagram({ chordName: 'C', frets });
		const inline = renderChordDiagram({ chordName: '', frets });

		// Only the empty label band is removed, so the fretboard (the span from
		// the first to the last fret line) is identical in both diagrams.
		const fretYs = (svg) =>
			[
				...svg.matchAll(
					/class="cmChordDiagram-fret" x1="\d+" y1="(\d+)"/g
				),
			]
				.map((m) => Number(m[1]))
				.sort((a, b) => a - b);
		const span = (ys) => ys[ys.length - 1] - ys[0];
		expect(span(fretYs(inline))).toBe(span(fretYs(labeled)));
	});

	const leftMargin = (svg) =>
		Number(svg.match(/cmChordDiagram-string" x1="([\d.]+)"/)[1]);

	test('widens the left margin so a two-digit fret position is not clipped', () => {
		// Voicing up at the 10th fret -> position number "10" must fit inside
		// the viewBox instead of being clipped at the left edge.
		const result = renderChordDiagram({
			chordName: 'C',
			frets: [null, 12, 10, 12, 12, null],
		});

		expect(result).toContain('cmChordDiagram-fretNumber');
		expect(result).toContain('>10<');
		// the position label's left edge must stay within the viewBox (x >= 0)
		const fx = Number(
			result.match(/cmChordDiagram-fretNumber" x="([\d.]+)"/)[1]
		);
		const fretFont = 12 * 0.8; // medium fontSize * 0.8
		expect(fx - 2 * fretFont * 0.6).toBeGreaterThanOrEqual(0);
		// grid was pushed right to make room
		expect(leftMargin(result)).toBeGreaterThan(10);
	});

	test('keeps the default left margin for single-digit positions', () => {
		const result = renderChordDiagram({
			chordName: 'Bm',
			frets: [null, 7, 9, 9, 8, 7],
		});

		expect(result).toContain('>7<');
		expect(leftMargin(result)).toBe(10);
	});
});
