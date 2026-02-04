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
