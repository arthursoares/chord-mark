import clearSpaces from '../helper/clearSpaces';

// Fret chars: 0-9 for frets 0-9, a-o for frets 10-24, x for muted
const fretCharPattern = '[0-9a-ox]';
const fretStringPattern = `${fretCharPattern}{6}`;

export const chordDefinitionRegexp = new RegExp(
	`^chord\\s+(.+?)\\s+(${fretStringPattern})$`
);

export default function isChordDefinition(string) {
	const cleaned = clearSpaces(string);
	return chordDefinitionRegexp.test(cleaned);
}
