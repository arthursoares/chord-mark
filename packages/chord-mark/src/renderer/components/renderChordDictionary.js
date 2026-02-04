import { chordRendererFactory, chordParserFactory } from 'chord-symbol';
import renderChordDiagram from './renderChordDiagram';
import chordDictionaryTpl from './tpl/chordDictionary';

/**
 * @typedef {Object} RenderChordDictionaryOptions
 * @property {('top'|'bottom')} [position='top']
 * @property {('small'|'medium'|'large')} [size='medium']
 * @property {boolean} [useShortNamings=true]
 */

/**
 * Render a chord dictionary containing all defined chord diagrams
 * @param {Object.<string, {frets: (number|null)[], source: string}>} chordDefinitions
 * @param {RenderChordDictionaryOptions} [options]
 * @returns {string} HTML string
 */
export default function renderChordDictionary(
	chordDefinitions,
	{ position = 'top', size = 'medium', useShortNamings = true } = {}
) {
	const chordNames = Object.keys(chordDefinitions);

	if (chordNames.length === 0) {
		return '';
	}

	// Create parser and renderer to normalize chord names consistently with song rendering
	const parseChord = chordParserFactory();
	const renderChord = chordRendererFactory({ useShortNamings });

	const diagrams = chordNames
		.map((chordName) => {
			const { frets } = chordDefinitions[chordName];
			// Parse and normalize the chord name to match how it appears in the song
			const parsedChord = parseChord(chordName);
			const normalizedName = parsedChord
				? renderChord(parsedChord)
				: chordName;
			return renderChordDiagram({
				chordName: normalizedName,
				frets,
				size,
			});
		})
		.join('');

	const positionClass = `cmChordDictionary--${position}`;

	return chordDictionaryTpl({ diagrams, positionClass });
}
