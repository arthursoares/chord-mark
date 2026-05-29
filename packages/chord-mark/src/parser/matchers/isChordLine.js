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

// Regex to match an inline voicing, in either of two interchangeable forms:
//  - compact:  [x32010]            6 single chars (0-9 = frets 0-9,
//                                  a-o = frets 10-24, x = muted)
//  - decimal:  [x,12,10,12,12,x]   6 comma-separated tokens, each x or a
//                                  1-2 digit fret; readable up the neck
// Allows beat markers (.) after the voicing. The decimal form is matched
// permissively here (\d{1,2}); the 0-24 range is enforced in the decoder.
const MAX_FRET = 24;
const compactVoicing = '[0-9a-ox]{6}';
const decimalVoicing = '(?:x|\\d{1,2})(?:,(?:x|\\d{1,2})){5}';
const inlineVoicingRegexp = new RegExp(
	`\\[(${compactVoicing}|${decimalVoicing})\\](\\.*)$`
);

function decodeVoicing(body) {
	if (body.includes(',')) {
		return body
			.split(',')
			.map((tok) => (tok === 'x' ? null : parseInt(tok, 10)));
	}
	return body.split('').map((char) => {
		if (char === 'x') return null;
		if (char >= '0' && char <= '9') return parseInt(char, 10);
		return char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
	});
}

const isValidVoicing = (voicing) =>
	voicing.length === 6 &&
	voicing.every(
		(fret) =>
			fret === null ||
			(Number.isInteger(fret) && fret >= 0 && fret <= MAX_FRET)
	);

export function extractInlineVoicing(token) {
	const match = token.match(inlineVoicingRegexp);
	if (!match) return { cleanToken: token, voicing: undefined };

	const beatMarkers = match[2] || '';
	const voicing = decodeVoicing(match[1]);

	// A structurally-matched but out-of-range voicing is not accepted: leave
	// the token untouched so it simply fails to parse as a chord (no throw,
	// because this runs during chord-line detection too).
	if (!isValidVoicing(voicing)) {
		return { cleanToken: token, voicing: undefined };
	}

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
