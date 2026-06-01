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
		expect(result).toContain('>VII<'); // The fret number should be VII (Roman)
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

	test('widens the left margin so a wide Roman numeral is not clipped', () => {
		// Voicing at the 8th fret -> Roman "VIII" (4 chars) — verifies the
		// wider label pushes the grid right and fits inside the viewBox.
		const result = renderChordDiagram({
			chordName: 'C',
			frets: [8, 10, 10, 9, 8, 8],
		});

		expect(result).toContain('cmChordDiagram-fretNumber');
		expect(result).toContain('>VIII<');
		// the position label's left edge must stay within the viewBox (x >= 0)
		const fx = Number(
			result.match(/cmChordDiagram-fretNumber" x="([\d.]+)"/)[1]
		);
		const fretFont = 12 * 0.8; // medium fontSize * 0.8
		// "VIII" is 4 chars wide — left edge = fx - (4 chars * fretFont * 0.6)
		expect(fx - 4 * fretFont * 0.6).toBeGreaterThanOrEqual(0);
		// grid was pushed right to make room (VIII = 4 chars → leftMargin > 10)
		expect(leftMargin(result)).toBeGreaterThan(10);
	});

	test('keeps the default left margin for Roman numerals up to 1 char wide', () => {
		// startFret 10 → Roman "X" (1 char): fretNumberWidth = 1*9.6*0.6 = 5.76
		// ceil(5.76)+4 = 10, so leftMargin stays at the minimum of 10.
		const result = renderChordDiagram({
			chordName: 'C',
			frets: [null, 12, 10, 12, 12, null],
		});

		expect(result).toContain('>X<');
		expect(leftMargin(result)).toBe(10);
	});

	// ── Roman numeral position indicator ──────────────────────────────────────

	test('renders Roman V for startFret 5', () => {
		// All frets 5-9, maxFret 9 > 5 frets, so startFret = 5
		const result = renderChordDiagram({
			chordName: 'A',
			frets: [5, 7, 7, 6, 5, 5],
		});

		expect(result).toContain('cmChordDiagram-fretNumber');
		expect(result).toContain('>V<');
		expect(result).not.toContain('>5<');
	});

	test('renders Roman VIII for startFret 8', () => {
		const result = renderChordDiagram({
			chordName: 'C',
			frets: [8, 10, 10, 9, 8, 8],
		});

		expect(result).toContain('>VIII<');
		expect(result).not.toContain('>8<');
	});

	test('Roman VIII label is not clipped at the viewBox left edge', () => {
		const result = renderChordDiagram({
			chordName: 'C',
			frets: [8, 10, 10, 9, 8, 8],
		});

		// x attribute of the fretNumber text (text-anchor="end", so this is rightmost)
		const fx = Number(
			result.match(/cmChordDiagram-fretNumber" x="([\d.]+)"/)[1]
		);
		const fretFont = 12 * 0.8; // medium fontSize * 0.8
		// "VIII" = 4 chars; leftmost pixel = fx - 4 * fretFont * 0.6
		expect(fx - 4 * fretFont * 0.6).toBeGreaterThanOrEqual(0);
	});

	test('renders Roman XII for startFret 12', () => {
		const result = renderChordDiagram({
			chordName: 'D',
			frets: [null, 14, 14, 13, 12, 12],
		});

		expect(result).toContain('>XII<');
		expect(result).not.toContain('>12<');
	});

	test('Roman XII label is not clipped at the viewBox left edge', () => {
		const result = renderChordDiagram({
			chordName: 'D',
			frets: [null, 14, 14, 13, 12, 12],
		});

		const fx = Number(
			result.match(/cmChordDiagram-fretNumber" x="([\d.]+)"/)[1]
		);
		const fretFont = 12 * 0.8;
		// "XII" = 3 chars
		expect(fx - 3 * fretFont * 0.6).toBeGreaterThanOrEqual(0);
	});

	// ── Barre lines ───────────────────────────────────────────────────────────

	test('emits a barre line for an F-chord barre at fret 1', () => {
		// F chord: [1,1,2,3,3,1] low-E→high-e  (all six strings at fret 1)
		const result = renderChordDiagram({
			chordName: 'F',
			frets: [1, 3, 3, 2, 1, 1],
		});

		expect(result).toContain('cmChordDiagram-barre');
	});

	test('barre line spans from string 0 to string 5 for F chord', () => {
		// frets [1,3,3,2,1,1]: strings at startFret(1): indices 0,4,5
		// barre spans string 0 (x1) to string 5 (x2)
		const result = renderChordDiagram({
			chordName: 'F',
			frets: [1, 3, 3, 2, 1, 1],
		});

		const barreLine = result.match(
			/class="cmChordDiagram-barre"[^/]*x1="([\d.]+)"[^/]*x2="([\d.]+)"/
		);
		expect(barreLine).not.toBeNull();

		// For medium size: leftMargin=10 (single-char Roman "I"), stringSpacing = (70-10-10)/5 = 10
		const x1 = Number(barreLine[1]);
		const x2 = Number(barreLine[2]);
		expect(x1).toBe(10); // string 0: padding.left + 0 * stringSpacing
		expect(x2).toBe(60); // string 5: padding.left + 5 * stringSpacing = 10 + 50
	});

	test('barre line for high-position chord at startFret', () => {
		// Bm barre at 7: [null,7,9,9,8,7] → strings 1 and 5 are at startFret 7
		const result = renderChordDiagram({
			chordName: 'Bm',
			frets: [null, 7, 9, 9, 8, 7],
		});

		expect(result).toContain('cmChordDiagram-barre');
	});

	test('no barre line when fewer than 2 strings share the position fret', () => {
		// C chord: [null,3,2,0,1,0] → only one string at startFret(1): string index 4
		const result = renderChordDiagram({
			chordName: 'C',
			frets: [null, 3, 2, 0, 1, 0],
		});

		expect(result).not.toContain('cmChordDiagram-barre');
	});

	test('no barre line for non-barre voicing', () => {
		// Am7: [null,0,2,0,1,0] — only one fretted string at startFret 1
		const result = renderChordDiagram({
			chordName: 'Am7',
			frets: [null, 0, 2, 0, 1, 0],
		});

		expect(result).not.toContain('cmChordDiagram-barre');
	});

	test('no barre line for all-open chord', () => {
		const result = renderChordDiagram({
			chordName: 'Em7',
			frets: [0, 0, 0, 0, 0, 0],
		});

		expect(result).not.toContain('cmChordDiagram-barre');
	});

	test('no barre line for all-muted chord', () => {
		const result = renderChordDiagram({
			chordName: 'X',
			frets: [null, null, null, null, null, null],
		});

		expect(result).not.toContain('cmChordDiagram-barre');
	});

	test('falls back to Arabic numeral for fret positions beyond ROMAN array (> 24)', () => {
		// Guitar frets above 24 are outside the ROMAN lookup; toRoman falls back
		// to String(n) to avoid emitting undefined.
		const result = renderChordDiagram({
			chordName: 'High',
			frets: [null, 25, 27, 27, 26, 25],
		});

		expect(result).toContain('cmChordDiagram-fretNumber');
		expect(result).toContain('>25<');
	});
});
