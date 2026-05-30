import _escapeRegExp from 'lodash/escapeRegExp';
import syntax from '../syntax';
import clearSpaces from '../helper/clearSpaces';

// The capture group is consumed by parseComposerDeclaration.
export const composerDeclarationRegexp = new RegExp(
	'^' + _escapeRegExp(syntax.composerDeclarationPrefix) + '(.+)$'
);

export default function isComposerDeclaration(string) {
	return composerDeclarationRegexp.test(clearSpaces(string));
}
