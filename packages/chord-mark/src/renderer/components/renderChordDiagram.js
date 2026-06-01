const SIZES = {
	small: { width: 50, height: 80, fontSize: 10 },
	medium: { width: 70, height: 105, fontSize: 12 },
	large: { width: 100, height: 140, fontSize: 16 },
};

const NUM_STRINGS = 6;
const NUM_FRETS = 5;

// Top padding for a labeled diagram, and the share of it that exists only to
// hold the chord-name label (dropped for inline diagrams that have no label).
const LABELED_TOP = 35;
const LABEL_BAND = 15;

const ROMAN = [
	'',
	'I',
	'II',
	'III',
	'IV',
	'V',
	'VI',
	'VII',
	'VIII',
	'IX',
	'X',
	'XI',
	'XII',
	'XIII',
	'XIV',
	'XV',
	'XVI',
	'XVII',
	'XVIII',
	'XIX',
	'XX',
	'XXI',
	'XXII',
	'XXIII',
	'XXIV',
];

const toRoman = (n) => ROMAN[n] || String(n);

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

/**
 * Detect a barre: if 2 or more fretted strings share the position fret
 * (startFret), return the min and max string indices that are barred;
 * otherwise return null.
 */
function detectBarre(frets, startFret) {
	const barredIndices = frets.reduce((acc, fret, idx) => {
		if (fret === startFret) acc.push(idx);
		return acc;
	}, []);
	if (barredIndices.length < 2) return null;
	return {
		minString: barredIndices[0],
		maxString: barredIndices[barredIndices.length - 1],
	};
}

function renderBarre({ barre, padding, stringSpacing, fretSpacing }) {
	const x1 = padding.left + barre.minString * stringSpacing;
	const x2 = padding.left + barre.maxString * stringSpacing;
	// Row center for relative fret 1 (startFret maps to row 1)
	const y = padding.top + 0.5 * fretSpacing;
	return `<line class="cmChordDiagram-barre" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`;
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

/** Compute layout metrics for a chord diagram of the given size and label. */
function computeLayout({ size, hasLabel, frets }) {
	const resolvedSize = SIZES[size] ? size : 'medium';
	const { width, height: fullHeight, fontSize } = SIZES[resolvedSize];
	const height = hasLabel ? fullHeight : fullHeight - LABEL_BAND;
	const startFret = calculateStartFret(frets);
	const fretNumberFont = fontSize * 0.8;
	const romanLabel = startFret > 1 ? toRoman(startFret) : '';
	const fretNumberWidth =
		romanLabel.length > 0 ? romanLabel.length * fretNumberFont * 0.6 : 0;
	const leftMargin = Math.max(10, Math.ceil(fretNumberWidth) + 4);
	const padding = {
		top: hasLabel ? LABELED_TOP : LABELED_TOP - LABEL_BAND,
		left: leftMargin,
		right: 10,
		bottom: 10,
	};
	const gridWidth = width - padding.left - padding.right;
	const gridHeight = height - padding.top - padding.bottom;
	const stringSpacing = gridWidth / (NUM_STRINGS - 1);
	const fretSpacing = gridHeight / NUM_FRETS;
	return {
		resolvedSize,
		width,
		height,
		fontSize,
		fretNumberFont,
		startFret,
		padding,
		gridWidth,
		gridHeight,
		stringSpacing,
		fretSpacing,
	};
}

/** Render the nut bar (open position) or Roman-numeral fret label (high pos). */
function renderPositionIndicator({
	startFret,
	padding,
	gridWidth,
	fretSpacing,
	fretNumberFont,
}) {
	if (startFret === 1) {
		const nutX2 = padding.left + gridWidth;
		return (
			`<line class="cmChordDiagram-nut" x1="${padding.left}" y1="${padding.top}" ` +
			`x2="${nutX2}" y2="${padding.top}" stroke-width="3"/>`
		);
	}
	const fretNumY = padding.top + fretSpacing / 2 + 4;
	return (
		`<text class="cmChordDiagram-fretNumber" x="${padding.left - 4}" y="${fretNumY}" ` +
		`text-anchor="end" font-size="${fretNumberFont}">${toRoman(startFret)}</text>`
	);
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
	const hasLabel = Boolean(chordName);
	const layout = computeLayout({ size, hasLabel, frets });
	const {
		resolvedSize,
		width,
		height,
		fontSize,
		fretNumberFont,
		startFret,
		padding,
		gridWidth,
		gridHeight,
		stringSpacing,
		fretSpacing,
	} = layout;
	const sizeClass = `cmChordDiagram--${resolvedSize}`;
	const grid = { padding, gridWidth, gridHeight, stringSpacing, fretSpacing };

	const elements = [];
	if (chordName) {
		elements.push(
			`<text class="cmChordDiagram-label" x="${width / 2}" y="${fontSize}" ` +
				`text-anchor="middle" font-size="${fontSize}">${escapeXml(chordName)}</text>`
		);
	}
	elements.push(
		renderPositionIndicator({
			startFret,
			padding,
			gridWidth,
			fretSpacing,
			fretNumberFont,
		})
	);
	const barre = detectBarre(frets, startFret);
	if (barre) elements.push(renderBarre({ barre, ...grid }));
	elements.push(...renderGridLines(grid));
	elements.push(
		...renderFingerPositions({ ...grid, frets, fontSize, startFret })
	);

	return (
		`<svg class="cmChordDiagram ${sizeClass}" viewBox="0 0 ${width} ${height}" ` +
		`width="${width}" height="${height}">${elements.join('')}</svg>`
	);
}
