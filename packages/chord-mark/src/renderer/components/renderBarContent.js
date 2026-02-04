import _isFinite from 'lodash/isFinite';

import symbols from '../symbols';

import renderChordSymbol from './renderChordSymbol';
import renderTimeSignature from './renderTimeSignature';
import barContentTpl from './tpl/barContent.js';

const space = ' ';

const defaultSpacesWithin = 0;
const defaultSpacesAfter = 2;

function getVoicing(chord, chordDefinitions) {
	// Priority: inline voicing override > chord definition
	if (chord.inlineVoicing) {
		return chord.inlineVoicing;
	}
	// chord.model.input is an object with a symbol property
	const chordName = chord.model?.input?.symbol;
	if (chordName) {
		const def = chordDefinitions[chordName];
		if (def && def.frets) {
			return def.frets;
		}
	}
	return undefined;
}

/**
 * @param {Bar} bar
 * @param {Boolean} isLastBar
 * @param {Boolean} shouldPrintBarSeparators
 * @param {Boolean} shouldPrintSubBeatDelimiters
 * @param {Boolean} shouldPrintTimeSignature
 * @param {('chord'|'roman')} options.symbolType
 * @param {Boolean} options.showInlineDiagrams - whether to show inline chord diagrams
 * @param {Object} options.chordDefinitions - chord definitions for looking up voicings
 * @param {('small'|'medium'|'large')} options.diagramSize - size of inline diagrams
 * @returns {String} rendered html
 */
export default function renderBarContent(
	bar,
	isLastBar = false,
	{
		shouldPrintBarSeparators = true,
		shouldPrintSubBeatDelimiters = true,
		shouldPrintTimeSignature = false,
		symbolType = 'chord',
		showInlineDiagrams = false,
		chordDefinitions = {},
		diagramSize = 'small',
	} = {}
) {
	let spacesWithin = 0;
	let spacesAfter = 0;
	let barContent = '';

	if (shouldPrintTimeSignature) {
		barContent +=
			renderTimeSignature(bar.timeSignature) +
			' '.repeat(symbols.spacesAfterTimeSignature);
	}

	barContent += bar.allChords.reduce((rendering, chord, i) => {
		spacesWithin = _isFinite(chord.spacesWithin)
			? chord.spacesWithin
			: defaultSpacesWithin;
		spacesAfter = _isFinite(chord.spacesAfter)
			? chord.spacesAfter
			: defaultSpacesAfter;

		const voicing = showInlineDiagrams
			? getVoicing(chord, chordDefinitions)
			: undefined;

		rendering += renderChordSymbol(chord, {
			shouldPrintChordsDuration: chord.isInSubBeatGroup
				? false
				: bar.shouldPrintChordsDuration,
			shouldPrintSubBeatOpener:
				shouldPrintSubBeatDelimiters && chord.isFirstOfSubBeat,
			shouldPrintSubBeatCloser:
				shouldPrintSubBeatDelimiters && chord.isLastOfSubBeat,
			symbolType,
			voicing,
			diagramSize,
		});

		const isLastChordOfLine = isLastChordOfBar(bar, i) && isLastBar;
		const shouldPrintSpaces =
			!isLastChordOfLine ||
			(isLastChordOfLine && shouldPrintBarSeparators);

		if (shouldPrintSpaces) {
			rendering += space.repeat(spacesWithin) + space.repeat(spacesAfter);
		}

		return rendering;
	}, '');

	return barContentTpl({ barContent });
}

function isLastChordOfBar(bar, i) {
	return !bar.allChords[i + 1];
}
