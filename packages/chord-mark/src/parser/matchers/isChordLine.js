import _escapeRegExp from 'lodash/escapeRegExp';
import clearSpaces from '../helper/clearSpaces';

import syntax from '../syntax';
import isChord from './isChord';
import isTimeSignature from './isTimeSignature';

const chordBeatCountSymbols = new RegExp(
	_escapeRegExp(syntax.chordBeatCount) + '*$',
	'g'
);
const barRepeatSymbols = new RegExp(
	'^' + _escapeRegExp(syntax.barRepeat) + '+$'
);

// Regex to match inline voicing: [xxxxxx] where x is 0-9, a-o, or x
// Allows beat markers (.) after the voicing
const inlineVoicingRegexp = /\[([0-9a-ox]{6})\](\.*)$/;

export function extractInlineVoicing(token) {
	const match = token.match(inlineVoicingRegexp);
	if (!match) return { cleanToken: token, voicing: undefined };

	const voicingStr = match[1];
	const beatMarkers = match[2] || '';
	const voicing = voicingStr.split('').map((char) => {
		if (char === 'x') return null;
		if (char >= '0' && char <= '9') return parseInt(char, 10);
		return char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
	});

	return {
		cleanToken: token.replace(inlineVoicingRegexp, beatMarkers),
		voicing,
	};
}

/**
 * Check if the given line only contains chords and allowed characters.
 * The parsing might still fail at a later stage if some rules are not properly enforced,
 * like having proper chord durations or matching sub-beat openers/closers
 * @param {String} line
 * @returns {Boolean}
 */
export default function isChordLine(line = '') {
	return clearSpaces(getParseableChordLine(line))
		.split(' ')
		.every((potentialChordToken, index, allTokens) => {
			const clean = cleanToken(potentialChordToken);

			return (
				isChord(clean) ||
				(potentialChordToken.match(barRepeatSymbols) && index > 0) ||
				clean === syntax.noChord ||
				(isTimeSignature(potentialChordToken) && allTokens.length > 1)
			);
		});
}

const getParseableChordLine = (chordLine) => {
	return chordLine.replaceAll('add ', 'add');
};

const cleanToken = (token) => {
	const { cleanToken: withoutVoicing } = extractInlineVoicing(token);
	return removeSubBeatDelimiters(removeBeatCount(withoutVoicing));
};

const removeBeatCount = (token) => {
	return token.replace(chordBeatCountSymbols, '');
};

const removeSubBeatDelimiters = (token) => {
	let clean = token;
	if (token.startsWith(syntax.subBeatOpener)) {
		clean = clean.substring(syntax.subBeatOpener.length);
	}
	if (token.endsWith(syntax.subBeatCloser)) {
		clean = clean.substring(0, clean.length - syntax.subBeatCloser.length);
	}
	return clean;
};

export { getParseableChordLine, cleanToken };
