import chordSymbolTpl from './tpl/chordSymbol.js';
import renderChordDiagram from './renderChordDiagram';
import symbols from '../symbols';

function isValidVoicing(voicing) {
	return voicing && Array.isArray(voicing) && voicing.length === 6;
}

function getInlineDiagram(voicing, diagramSize) {
	if (!isValidVoicing(voicing)) {
		return '';
	}
	return renderChordDiagram({
		chordName: '', // No label for inline diagrams
		frets: voicing,
		size: diagramSize,
	});
}

function getChordSymbol(chord, shouldPrintChordSymbol) {
	return shouldPrintChordSymbol ? chord.symbol : chord.model.numeral.symbol;
}

function shouldUseChordSymbol(chord, symbolType) {
	return (
		symbolType === 'chord' ||
		chord.model === symbols.barRepeat ||
		chord.model === symbols.noChordSymbol
	);
}

/**
 * @param {ChordLineChord} chord
 * @param {Object} options
 * @returns {String} rendered html
 */
export default function renderChordSymbol(
	chord,
	{
		shouldPrintChordsDuration = false,
		shouldPrintSubBeatOpener = false,
		shouldPrintSubBeatCloser = false,
		symbolType = 'chord',
		voicing = undefined,
		diagramSize = 'small',
	}
) {
	const shouldPrintChordSymbol = shouldUseChordSymbol(chord, symbolType);
	const chordSymbol = getChordSymbol(chord, shouldPrintChordSymbol);
	const inlineDiagram = getInlineDiagram(voicing, diagramSize);

	return chordSymbolTpl({
		chordSymbol,
		chordDuration: shouldPrintChordsDuration
			? symbols.chordBeat.repeat(chord.duration)
			: false,
		subBeatGroupOpener: shouldPrintSubBeatOpener
			? symbols.subBeatGroupOpener
			: '',
		subBeatGroupCloser: shouldPrintSubBeatCloser
			? symbols.subBeatGroupCloser
			: '',
		numeralType: shouldPrintChordSymbol ? '' : chord.model.numeral.type,
		inlineDiagram,
	});
}
