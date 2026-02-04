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
