const render = ({
	chordSymbol,
	chordDuration,
	subBeatGroupOpener,
	subBeatGroupCloser,
	numeralType,
	inlineDiagram,
}) => {
	const groupOpen = subBeatGroupOpener
		? `<span class="cmSubBeatGroupOpener">${subBeatGroupOpener}</span>`
		: '';

	const groupClose = subBeatGroupCloser
		? `<span class="cmSubBeatGroupCloser">${subBeatGroupCloser}</span>`
		: '';

	const symbolClasses = ['cmChordSymbol'];

	if (numeralType) {
		symbolClasses.push(`cmRomanNumeral`, `cmRomanNumeral-${numeralType}`);
	}

	if (inlineDiagram) {
		symbolClasses.push('cmChordSymbol--withDiagram');
	}

	const symbolHtml = `<span class="${symbolClasses.join(
		' '
	)}">${chordSymbol}${
		chordDuration
			? `<span class="cmChordDuration">${chordDuration}</span>`
			: ''
	}</span>`;

	if (inlineDiagram) {
		return `${groupOpen}<span class="cmChordWithDiagram">${inlineDiagram}${symbolHtml}</span>${groupClose}`;
	}

	return `${groupOpen}${symbolHtml}${groupClose}`;
};
export default render;
