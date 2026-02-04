import lineTypes from './lineTypes';

/**
 * Extract all chord definitions from parsed song lines
 * @param {SongLine[]} allLines
 * @returns {Object.<string, {frets: (number|null)[], source: string}>}
 */
export default function getAllChordDefinitions(allLines) {
	const definitions = {};

	allLines.forEach((line) => {
		if (line.type === lineTypes.CHORD_DEFINITION) {
			definitions[line.model.chordName] = {
				frets: line.model.frets,
				source: 'directive',
			};
		}
	});

	return definitions;
}
