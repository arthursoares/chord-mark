import getComposerInSong from '../../../src/parser/getComposerInSong';
import lineTypes from '../../../src/parser/lineTypes';

describe('getComposerInSong', () => {
	test('returns the composer name when a composer line exists', () => {
		const allLines = [
			{ type: lineTypes.COMPOSER_DECLARATION, model: { string: 'Tom Jobim' } },
			{ type: lineTypes.LYRIC, model: { lyrics: 'hello' } },
		];
		expect(getComposerInSong(allLines)).toBe('Tom Jobim');
	});

	test('returns undefined when there is no composer line', () => {
		const allLines = [{ type: lineTypes.LYRIC, model: { lyrics: 'hi' } }];
		expect(getComposerInSong(allLines)).toBeUndefined();
	});
});
