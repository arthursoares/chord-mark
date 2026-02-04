const SIZES = {
	small: { width: 50, height: 80, fontSize: 10 },
	medium: { width: 70, height: 105, fontSize: 12 },
	large: { width: 100, height: 140, fontSize: 16 },
};

const NUM_STRINGS = 6;
const NUM_FRETS = 5;

function escapeXml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function calculateStartFret(frets) {
	const nonNullFrets = frets.filter((f) => f !== null && f > 0);
	const minFret = nonNullFrets.length > 0 ? Math.min(...nonNullFrets) : 1;
	const maxFret = nonNullFrets.length > 0 ? Math.max(...nonNullFrets) : 1;
	return maxFret <= NUM_FRETS ? 1 : minFret;
}

function renderGridLines({
	padding,
	gridWidth,
	gridHeight,
	stringSpacing,
	fretSpacing,
}) {
	const elements = [];
	for (let i = 0; i <= NUM_FRETS; i++) {
		const y = padding.top + i * fretSpacing;
		const x2 = padding.left + gridWidth;
		elements.push(
			`<line class="cmChordDiagram-fret" x1="${padding.left}" y1="${y}" x2="${x2}" y2="${y}"/>`
		);
	}
	for (let i = 0; i < NUM_STRINGS; i++) {
		const x = padding.left + i * stringSpacing;
		const y2 = padding.top + gridHeight;
		elements.push(
			`<line class="cmChordDiagram-string" x1="${x}" y1="${padding.top}" x2="${x}" y2="${y2}"/>`
		);
	}
	return elements;
}

function renderFingerPositions({
	frets,
	padding,
	stringSpacing,
	fretSpacing,
	fontSize,
	startFret,
}) {
	const elements = [];
	frets.forEach((fret, stringIndex) => {
		const x = padding.left + stringIndex * stringSpacing;
		const markerY = padding.top - 8;
		if (fret === null) {
			elements.push(
				`<text class="cmChordDiagram-mutedString" x="${x}" y="${markerY}" ` +
					`text-anchor="middle" font-size="${fontSize}">×</text>`
			);
		} else if (fret === 0) {
			elements.push(
				`<text class="cmChordDiagram-openString" x="${x}" y="${markerY}" ` +
					`text-anchor="middle" font-size="${fontSize}">○</text>`
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
	return elements;
}

/**
 * Render a guitar chord diagram as SVG
 * @param {Object} options
 * @param {string} options.chordName
 * @param {(number|null)[]} options.frets - array of 6 fret numbers, null for muted
 * @param {('small'|'medium'|'large')} [options.size='medium']
 * @returns {string} SVG string
 */
export default function renderChordDiagram({
	chordName,
	frets,
	size = 'medium',
}) {
	const { width, height, fontSize } = SIZES[size] || SIZES.medium;
	const sizeClass = `cmChordDiagram--${size}`;
	const padding = { top: 35, left: 10, right: 10, bottom: 10 };
	const gridWidth = width - padding.left - padding.right;
	const gridHeight = height - padding.top - padding.bottom;
	const stringSpacing = gridWidth / (NUM_STRINGS - 1);
	const fretSpacing = gridHeight / NUM_FRETS;
	const startFret = calculateStartFret(frets);
	const grid = { padding, gridWidth, gridHeight, stringSpacing, fretSpacing };

	const elements = [];

	// Only add label if chordName is provided (not for inline diagrams)
	if (chordName) {
		elements.push(
			`<text class="cmChordDiagram-label" x="${width / 2}" y="${fontSize}" ` +
				`text-anchor="middle" font-size="${fontSize}">${escapeXml(chordName)}</text>`
		);
	}

	if (startFret === 1) {
		const nutX2 = padding.left + gridWidth;
		elements.push(
			`<line class="cmChordDiagram-nut" x1="${padding.left}" y1="${padding.top}" ` +
				`x2="${nutX2}" y2="${padding.top}" stroke-width="3"/>`
		);
	} else {
		const fretNumY = padding.top + fretSpacing / 2 + 4;
		elements.push(
			`<text class="cmChordDiagram-fretNumber" x="${padding.left - 5}" y="${fretNumY}" ` +
				`text-anchor="end" font-size="${fontSize * 0.8}">${startFret}</text>`
		);
	}

	elements.push(...renderGridLines(grid));
	elements.push(
		...renderFingerPositions({ ...grid, frets, fontSize, startFret })
	);

	return (
		`<svg class="cmChordDiagram ${sizeClass}" viewBox="0 0 ${width} ${height}" ` +
		`width="${width}" height="${height}">${elements.join('')}</svg>`
	);
}
