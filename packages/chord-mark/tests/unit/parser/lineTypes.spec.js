import lineTypes from '../../../src/parser/lineTypes';

describe('lineTypes', () => {
	test('Module', () => {
		expect(lineTypes).toBeInstanceOf(Object);
	});

	test('contains CHORD_DEFINITION type', () => {
		expect(lineTypes.CHORD_DEFINITION).toBe('chordDefinition');
	});
});
