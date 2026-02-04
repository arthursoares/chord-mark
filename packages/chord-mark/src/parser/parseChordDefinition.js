import clearSpaces from './helper/clearSpaces';
import isChordDefinition, {
	chordDefinitionRegexp,
} from './matchers/isChordDefinition';

/**
 * Parse a fret character to a number or null
 * @param {string} char - single character (0-9, a-o, x)
 * @returns {number|null}
 */
function parseFretChar(char) {
	if (char === 'x') return null;
	if (char >= '0' && char <= '9') return parseInt(char, 10);
	// a=10, b=11, ..., o=24
	return char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
}

/**
 * Parse a fret string into an array of fret numbers
 * @param {string} fretString - 6 character fret string
 * @returns {(number|null)[]}
 */
function parseFretString(fretString) {
	return fretString.split('').map(parseFretChar);
}

/**
 * @param {String} string
 * @returns {{chordName: string, frets: (number|null)[]}}
 */
export default function parseChordDefinition(string) {
	if (!isChordDefinition(string)) {
		throw new TypeError('Expected chord definition, received: ' + string);
	}

	const found = clearSpaces(string).match(chordDefinitionRegexp);
	const chordName = found[1];
	const fretString = found[2];

	return {
		chordName,
		frets: parseFretString(fretString),
	};
}
