import { parseSong, renderSong, lineTypes } from '../../src/chordMark';

describe('chordMark exports', () => {
	test('lineTypes includes CHORD_DEFINITION', () => {
		expect(lineTypes.CHORD_DEFINITION).toBe('chordDefinition');
	});
});
