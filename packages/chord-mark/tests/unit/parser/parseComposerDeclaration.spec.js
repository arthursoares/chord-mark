import parseComposerDeclaration from '../../../src/parser/parseComposerDeclaration';

describe('parseComposerDeclaration', () => {
	test('returns the composer name', () => {
		expect(parseComposerDeclaration('composer Antonio Carlos Jobim')).toEqual(
			{ string: 'Antonio Carlos Jobim' }
		);
	});

	test('trims surrounding whitespace', () => {
		expect(parseComposerDeclaration('  composer  Tom Jobim ')).toEqual({
			string: 'Tom Jobim',
		});
	});

	test('throws on a non-composer line', () => {
		expect(() => parseComposerDeclaration('key C')).toThrow(TypeError);
	});
});
