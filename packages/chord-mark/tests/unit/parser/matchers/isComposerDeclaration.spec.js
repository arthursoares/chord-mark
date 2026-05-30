import isComposerDeclaration from '../../../../src/parser/matchers/isComposerDeclaration';

describe('isComposerDeclaration', () => {
	test('Module', () => {
		expect(isComposerDeclaration).toBeInstanceOf(Function);
	});

	test.each([
		['composer Antonio Carlos Jobim', true],
		['composer  Tom Jobim e Vinicius', true],
		['  composer Caetano Veloso  ', true],
		['composer', false], // no name
		['composer ', false], // empty name
		['composerX', false], // keyword with no following space
		['key C', false],
		['Cmaj7', false],
		['', false],
	])('correctly detects "%s" -> %s', (line, expected) => {
		expect(isComposerDeclaration(line)).toBe(expected);
	});
});
