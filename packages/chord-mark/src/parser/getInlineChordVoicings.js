import lineTypes from './lineTypes';

/**
 * Collect the inline voicings (`Chord[x32010]`) used in the song's chord lines,
 * so they can be shown in the chord dictionary alongside `chord` directives.
 * The first voicing seen for a given chord symbol wins.
 * @param {SongLine[]} allLines
 * @returns {Object.<string, {frets: (number|null)[], source: string}>}
 */
export default function getInlineChordVoicings(allLines) {
	const voicings = {};

	allLines.forEach((line) => {
		if (line.type !== lineTypes.CHORD) return;

		line.model.allBars.forEach((bar) => {
			bar.allChords.forEach((chord) => {
				const symbol = chord.model.input?.symbol;
				if (chord.inlineVoicing && symbol && !voicings[symbol]) {
					voicings[symbol] = {
						frets: chord.inlineVoicing,
						source: 'inline',
					};
				}
			});
		});
	});

	return voicings;
}
