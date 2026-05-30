import getInlineChordVoicings from '../../../src/parser/getInlineChordVoicings';
import lineTypes from '../../../src/parser/lineTypes';

const chordLine = (chords) => ({
	type: lineTypes.CHORD,
	model: { allBars: [{ allChords: chords }] },
});

describe('getInlineChordVoicings', () => {
	test('Module', () => {
		expect(getInlineChordVoicings).toBeInstanceOf(Function);
	});

	test('collects chords that carry an inline voicing, keyed by symbol', () => {
		const allLines = [
			chordLine([
				{
					model: { input: { symbol: 'A7+' } },
					inlineVoicing: [5, null, 6, 6, 5, null],
				},
				{
					model: { input: { symbol: 'Bm7/F#' } },
					inlineVoicing: [2, null, 0, 2, 0, null],
				},
			]),
		];

		expect(getInlineChordVoicings(allLines)).toEqual({
			'A7+': { frets: [5, null, 6, 6, 5, null], source: 'inline' },
			'Bm7/F#': { frets: [2, null, 0, 2, 0, null], source: 'inline' },
		});
	});

	test('keeps the first voicing seen for a repeated chord', () => {
		const allLines = [
			chordLine([
				{
					model: { input: { symbol: 'A7+' } },
					inlineVoicing: [5, null, 6, 6, 5, null],
				},
				{
					model: { input: { symbol: 'A7+' } },
					inlineVoicing: [0, 0, 0, 0, 0, 0],
				},
			]),
		];

		expect(getInlineChordVoicings(allLines)['A7+'].frets).toEqual([
			5,
			null,
			6,
			6,
			5,
			null,
		]);
	});

	test('ignores chords without an inline voicing or symbol', () => {
		const allLines = [
			chordLine([
				{ model: { input: { symbol: 'C' } } }, // no voicing
				{ model: {}, inlineVoicing: [0, 0, 0, 0, 0, 0] }, // no symbol
			]),
			{ type: lineTypes.LYRIC, model: { lyrics: 'hi' } },
		];

		expect(getInlineChordVoicings(allLines)).toEqual({});
	});
});
