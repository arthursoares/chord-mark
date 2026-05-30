import lineTypes from './lineTypes';

/**
 * @param {SongLine[]} allLines
 * @returns {String|undefined}
 */
export default function getComposerInSong(allLines) {
	const composerLine = allLines.find(
		(line) => line.type === lineTypes.COMPOSER_DECLARATION
	);
	return composerLine ? composerLine.model.string : undefined;
}
