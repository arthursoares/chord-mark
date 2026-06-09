import _isArray from 'lodash/isArray';

import escapeHTML from '../core/dom/escapeHTML';
import stripTags from '../core/dom/stripTags';

import songLinesFactory from './songLinesFactory';

import getAllChordDefinitions from './getAllChordDefinitions';
import getAllChordsInSong from './getAllChordsInSong';
import getAllKeysInSong from './getAllKeysInSong';
import getComposerInSong from './getComposerInSong';
import lineTypes from './lineTypes';
import parseChord from './parseChord';

/**
 * @typedef {Object} Song
 * @type {Object}
 * @property {SongLine[]} allLines
 * @property {SongChord[]} allChords
 * @property {SongKeys} allKeys
 * @property {String} [composer]
 */

/**
 * @typedef {Object} SongChord
 * @type {Object}
 * @property {ChordDef} model
 * @property {number} occurrences - number of times the chord appears in the song
 * @property {number} duration - in beats, cumulated duration of the chord
 */

/**
 * @typedef {Object} SongKeys
 * @type {Object}
 * @property {KeyDeclaration} auto - automatically detected key
 * @property {KeyDeclaration[]} explicit - explicitly declared keys
 */

/**
 * @param {string|array} songSrc
 * @param {Object} [options]
 * @param {Object} [options.windowObject] - A JSDOM window object for using chordmark in NodeJs
 * @returns {Song}
 */
export default function parseSong(songSrc, { windowObject } = {}) {
	const songArray = !_isArray(songSrc) ? songSrc.split('\n') : songSrc;

	const songLines = songLinesFactory();

	/**
	 * @type {SongLine[]}
	 */
	songArray
		.map((line) => escapeHTML(line, windowObject))
		.map((line) => stripTags(line, windowObject))
		.forEach(songLines.addLine);

	songLines.flagPositionedChords();

	const allLines = songLines.asArray();
	const allChords = getAllChordsInSong(allLines);
	const allKeys = getAllKeysInSong(allLines, allChords);
	applyAutoKeyToNumerals(allLines, allKeys);
	const chordDefinitions = getAllChordDefinitions(allLines);
	const composer = getComposerInSong(allLines);

	return {
		allLines,
		allChords,
		allKeys,
		chordDefinitions,
		composer,
	};
}

/**
 * Chord numerals are computed when each chord line is parsed, at which point
 * only an explicitly declared key is known. When the song has no explicit key
 * but one could be auto-detected, recompute the numerals against the detected
 * key — otherwise every chord is analyzed against its own root (e.g. all
 * minor chords render as "i" with symbolType: 'roman').
 * Only the numeral is replaced: the rest of the chord model does not depend
 * on the key.
 * @param {SongLine[]} allLines
 * @param {SongKeys} allKeys
 */
function applyAutoKeyToNumerals(allLines, allKeys) {
	if (!allKeys.auto) return;

	allLines
		.filter((line) => line.type === lineTypes.CHORD)
		.forEach((line) => {
			line.model.allBars.forEach((bar) => {
				bar.allChords.forEach((chord) => {
					if (
						chord.model &&
						typeof chord.model === 'object' &&
						chord.model.input
					) {
						chord.model.numeral = parseChord(
							chord.model.input.symbol,
							allKeys.auto
						).numeral;
					}
				});
			});
		});
}
