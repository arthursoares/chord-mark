import _cloneDeep from 'lodash/cloneDeep';
import lineTypes from '../../parser/lineTypes';

/**
 * Count the total number of chords across an array of bars.
 *
 * @param {Bar[]} bars
 * @returns {number}
 */
function countChordsInBars(bars) {
	return bars.reduce((total, bar) => total + bar.allChords.length, 0);
}

/**
 * Split a chord-line model into chunks of at most `barsPerLine` bars.
 * Returns an array of new chord-line model objects.
 *
 * @param {ChordLine} chordLineModel
 * @param {number} barsPerLine
 * @returns {ChordLine[]}
 */
function splitChordLineModel(chordLineModel, barsPerLine) {
	const chunks = [];
	const allBars = chordLineModel.allBars;

	for (let start = 0; start < allBars.length; start += barsPerLine) {
		const barsSlice = _cloneDeep(allBars.slice(start, start + barsPerLine));
		chunks.push({ ...chordLineModel, allBars: barsSlice });
	}
	return chunks;
}

/**
 * Build boundary chord counts (fence-post array) for a set of chord-model chunks.
 * Entry 0 is always 0; entry k+1 = entry k + chord count of chunk k.
 *
 * @param {ChordLine[]} chordModelChunks
 * @returns {number[]}
 */
function buildBoundaryChordCounts(chordModelChunks) {
	const boundaries = [0];
	let cumulative = 0;
	chordModelChunks.forEach((chunk) => {
		cumulative += countChordsInBars(chunk.allBars);
		boundaries.push(cumulative);
	});
	return boundaries;
}

/**
 * Split a lyric-line model to match bar-chunk boundaries.
 *
 * @param {LyricLine} lyricModel
 * @param {number[]} boundaryChordCounts - fence-post array from buildBoundaryChordCounts
 * @returns {LyricLine[]}
 */
function splitLyricModel(lyricModel, boundaryChordCounts) {
	const { lyrics, chordPositions } = lyricModel;
	const totalChunks = boundaryChordCounts.length - 1;

	return Array.from({ length: totalChunks }, (_, i) => {
		const chordStart = boundaryChordCounts[i];
		const chordEnd = boundaryChordCounts[i + 1];

		const charStart =
			chordStart < chordPositions.length
				? chordPositions[chordStart]
				: lyrics.length;

		const charEnd =
			chordEnd < chordPositions.length
				? chordPositions[chordEnd]
				: lyrics.length;

		const newChordPositions = chordPositions
			.slice(chordStart, chordEnd)
			.map((pos) => pos - charStart);

		return {
			lyrics: lyrics.substring(charStart, charEnd),
			chordPositions: newChordPositions,
		};
	});
}

/**
 * Emit the split chord/lyric line pairs for one chord line that needs splitting.
 *
 * @param {SongLine} chordSongLine - the chord line to split
 * @param {SongLine|null} lyricSongLine - the immediately following lyric line, or null
 * @param {number} barsPerLine
 * @returns {SongLine[]}
 */
function emitSplitLines(chordSongLine, lyricSongLine, barsPerLine) {
	const chordModelChunks = splitChordLineModel(
		chordSongLine.model,
		barsPerLine
	);
	const lyricModelChunks = lyricSongLine
		? splitLyricModel(
				lyricSongLine.model,
				buildBoundaryChordCounts(chordModelChunks)
			)
		: null;

	const result = [];
	chordModelChunks.forEach((chordModel, c) => {
		const chunkLyric = lyricModelChunks ? lyricModelChunks[c] : null;
		const chunkIsPositioned =
			!!chordSongLine.model.hasPositionedChords &&
			!!chunkLyric &&
			chunkLyric.chordPositions.length > 0;

		result.push({
			...chordSongLine,
			model: { ...chordModel, hasPositionedChords: chunkIsPositioned },
		});

		if (chunkLyric) {
			result.push({ ...lyricSongLine, model: chunkLyric });
		}
	});
	return result;
}

/**
 * Transform `allLines` by re-segmenting chord lines into rows of at most
 * `barsPerLine` bars each.  When a chord line is immediately followed by a
 * lyric line the lyric is split at the bar-chunk boundaries to match.
 *
 * @param {SongLine[]} allLines
 * @param {number|undefined} barsPerLine - maximum bars per chord line row;
 *   falsy (0 / undefined) disables the transform and returns allLines unchanged.
 * @returns {SongLine[]}
 */
export default function splitBarsPerLine(allLines, barsPerLine) {
	if (!barsPerLine) {
		return allLines;
	}

	const result = [];
	let i = 0;

	while (i < allLines.length) {
		const line = allLines[i];
		const needsSplit =
			line.type === lineTypes.CHORD &&
			line.model.allBars.length > barsPerLine;

		if (!needsSplit) {
			result.push(line);
			i++;
			continue;
		}

		const nextLine = allLines[i + 1];
		const lyricLine =
			nextLine && nextLine.type === lineTypes.LYRIC ? nextLine : null;

		result.push(...emitSplitLines(line, lyricLine, barsPerLine));
		i += lyricLine ? 2 : 1;
	}

	return result;
}
