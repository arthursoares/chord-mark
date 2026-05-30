import clearSpaces from './helper/clearSpaces';
import isComposerDeclaration, {
	composerDeclarationRegexp,
} from './matchers/isComposerDeclaration';

/**
 * @typedef {Object} ComposerDeclaration
 * @property {String} string - the composer name
 */

/**
 * @param {String} string
 * @returns {ComposerDeclaration}
 */
export default function parseComposerDeclaration(string) {
	if (!isComposerDeclaration(string)) {
		throw new TypeError(
			'Expected composer declaration, received: ' + string
		);
	}

	const found = clearSpaces(string).match(composerDeclarationRegexp);

	return { string: found[1] };
}
