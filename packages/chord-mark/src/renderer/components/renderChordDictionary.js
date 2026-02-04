import renderChordDiagram from './renderChordDiagram';
import chordDictionaryTpl from './tpl/chordDictionary';

/**
 * @typedef {Object} RenderChordDictionaryOptions
 * @property {('top'|'bottom')} [position='top']
 * @property {('small'|'medium'|'large')} [size='medium']
 */

/**
 * Render a chord dictionary containing all defined chord diagrams
 * @param {Object.<string, {frets: (number|null)[], source: string}>} chordDefinitions
 * @param {RenderChordDictionaryOptions} [options]
 * @returns {string} HTML string
 */
export default function renderChordDictionary(
	chordDefinitions,
	{ position = 'top', size = 'medium' } = {}
) {
	const chordNames = Object.keys(chordDefinitions);

	if (chordNames.length === 0) {
		return '';
	}

	const diagrams = chordNames
		.map((chordName) => {
			const { frets } = chordDefinitions[chordName];
			return renderChordDiagram({ chordName, frets, size });
		})
		.join('');

	const positionClass = `cmChordDictionary--${position}`;

	return chordDictionaryTpl({ diagrams, positionClass });
}
