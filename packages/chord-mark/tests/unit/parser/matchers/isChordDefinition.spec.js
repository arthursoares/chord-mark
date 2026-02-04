import isChordDefinition from '../../../../src/parser/matchers/isChordDefinition';

describe('isChordDefinition', () => {
	test('Module', () => {
		expect(isChordDefinition).toBeInstanceOf(Function);
	});
});

describe.each([
	['chord Cmaj7 x32000', true],
	['chord Am7 x02010', true],
	['chord Dm7 xx0211', true],
	['chord G7 320001', true],
	['chord F#m7 242222', true],
	['chord Bb x13331', true],
	['chord C/G 332010', true],
	['chord   Am7   x02010', true],
	['   chord   Am7   x02010', true],
	['   chord   Am7   x02010  ', true],
	['chord Cmaj7 x3545a', true],
	['key Am', false],
	['Chord Am x02010', false],
	['CHORD Am x02010', false],
	['chordAm x02010', false],
	['chord Am', false],
	['chord x02010', false],
	['chord Am x0201', false],
	['chord Am x020100', false],
	['chord Am x0201z', false],
	['chord', false],
	['', false],
])('%s => %s', (string, result) => {
	test('Correctly detect chord definition', () => {
		expect(isChordDefinition(string)).toEqual(result);
	});
});
