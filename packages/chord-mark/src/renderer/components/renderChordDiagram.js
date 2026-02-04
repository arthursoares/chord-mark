const SIZES = {
	small: { width: 50, height: 65, fontSize: 10 },
	medium: { width: 70, height: 90, fontSize: 12 },
	large: { width: 100, height: 125, fontSize: 16 },
};

const NUM_STRINGS = 6;
const NUM_FRETS = 5;

/**
 * Render a guitar chord diagram as SVG
 * @param {Object} options
 * @param {string} options.chordName
 * @param {(number|null)[]} options.frets - array of 6 fret numbers, null for muted
 * @param {('small'|'medium'|'large')} [options.size='medium']
 * @returns {string} SVG string
 */
export default function renderChordDiagram({ chordName, frets, size = 'medium' }) {
	const { width, height, fontSize } = SIZES[size] || SIZES.medium;
	const sizeClass = `cmChordDiagram--${size}`;

	const padding = { top: 20, left: 10, right: 10, bottom: 10 };
	const gridWidth = width - padding.left - padding.right;
	const gridHeight = height - padding.top - padding.bottom;
	const stringSpacing = gridWidth / (NUM_STRINGS - 1);
	const fretSpacing = gridHeight / NUM_FRETS;

	// Calculate fret range
	const nonNullFrets = frets.filter((f) => f !== null && f > 0);
	const minFret = nonNullFrets.length > 0 ? Math.min(...nonNullFrets) : 1;
	const maxFret = nonNullFrets.length > 0 ? Math.max(...nonNullFrets) : 1;
	const startFret = maxFret <= NUM_FRETS ? 1 : minFret;
	const showFretNumber = startFret > 1;

	const elements = [];

	// Chord name label
	elements.push(
		`<text class="cmChordDiagram-label" x="${width / 2}" y="${fontSize}" text-anchor="middle" font-size="${fontSize}">${escapeXml(chordName)}</text>`
	);

	// Nut (thick line at top) or fret number
	if (startFret === 1) {
		elements.push(
			`<line class="cmChordDiagram-nut" x1="${padding.left}" y1="${padding.top}" x2="${padding.left + gridWidth}" y2="${padding.top}" stroke-width="3"/>`
		);
	} else {
		elements.push(
			`<text class="cmChordDiagram-fretNumber" x="${padding.left - 5}" y="${padding.top + fretSpacing / 2 + 4}" text-anchor="end" font-size="${fontSize * 0.8}">${startFret}</text>`
		);
	}

	// Fret lines (horizontal)
	for (let i = 0; i <= NUM_FRETS; i++) {
		const y = padding.top + i * fretSpacing;
		elements.push(
			`<line class="cmChordDiagram-fret" x1="${padding.left}" y1="${y}" x2="${padding.left + gridWidth}" y2="${y}"/>`
		);
	}

	// String lines (vertical)
	for (let i = 0; i < NUM_STRINGS; i++) {
		const x = padding.left + i * stringSpacing;
		elements.push(
			`<line class="cmChordDiagram-string" x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + gridHeight}"/>`
		);
	}

	// Finger positions, muted strings, open strings
	frets.forEach((fret, stringIndex) => {
		const x = padding.left + stringIndex * stringSpacing;
		const markerY = padding.top - 8;

		if (fret === null) {
			elements.push(
				`<text class="cmChordDiagram-mutedString" x="${x}" y="${markerY}" text-anchor="middle" font-size="${fontSize}">×</text>`
			);
		} else if (fret === 0) {
			elements.push(
				`<text class="cmChordDiagram-openString" x="${x}" y="${markerY}" text-anchor="middle" font-size="${fontSize}">○</text>`
			);
		} else {
			const relativeFret = fret - startFret + 1;
			const y = padding.top + (relativeFret - 0.5) * fretSpacing;
			const dotRadius = fretSpacing * 0.35;
			elements.push(
				`<circle class="cmChordDiagram-dot" cx="${x}" cy="${y}" r="${dotRadius}"/>`
			);
		}
	});

	return `<svg class="cmChordDiagram ${sizeClass}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${elements.join('')}</svg>`;
}

function escapeXml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
