import chordLineTpl from './tpl/chordLine.js';

import renderBarContent from './renderBarContent';
import barSeparatorTpl from './tpl/barSeparator.js';

import symbols from '../symbols';

/**
 * @param {ChordLine} chordLineModel
 * @param {Boolean} shouldPrintBarSeparators
 * @param {Boolean} shouldPrintSubBeatDelimiters
 * @param {Boolean} shouldPrintInlineTimeSignatures
 * @param {('chord'|'roman')} options.symbolType
 * @param {Boolean} options.showInlineDiagrams - whether to show inline chord diagrams
 * @param {Object} options.chordDefinitions - chord definitions for looking up voicings
 * @param {('small'|'medium'|'large')} options.diagramSize - size of inline diagrams
 * @returns {String} rendered html
 */
export default function renderChordLine(
	chordLineModel,
	{
		shouldPrintBarSeparators = true,
		shouldPrintSubBeatDelimiters = true,
		shouldPrintInlineTimeSignatures = true,
		symbolType = 'chord',
		showInlineDiagrams = false,
		chordDefinitions = {},
		diagramSize = 'small',
	} = {}
) {
	const allBarsRendered = chordLineModel.allBars.map((bar, i) => {
		const isLastBar = !chordLineModel.allBars[i + 1];
		const shouldPrintTimeSignature =
			shouldPrintInlineTimeSignatures && bar.shouldPrintBarTimeSignature;
		return renderBarContent(bar, isLastBar, {
			shouldPrintBarSeparators,
			shouldPrintSubBeatDelimiters,
			shouldPrintTimeSignature,
			symbolType,
			showInlineDiagrams,
			chordDefinitions,
			diagramSize,
		});
	});

	const barSeparator = shouldPrintBarSeparators
		? barSeparatorTpl({
				barSeparator: symbols.barSeparator,
			})
		: '';

	const chordLine =
		barSeparator + allBarsRendered.join(barSeparator) + barSeparator;

	const chordLineOffset = symbols.chordLineOffsetSpacer.repeat(
		chordLineModel.offset || 0
	);

	return chordLineTpl({ chordLineOffset, chordLine, symbolType });
}
