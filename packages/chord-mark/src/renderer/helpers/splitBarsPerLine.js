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

		// The very first chunk always starts at the beginning of the lyric
		// text (this also covers non-positioned lyrics, which carry no chord
		// positions to anchor against).
		const charStart =
			chordStart < chordPositions.length
				? chordPositions[chordStart]
				: chordStart === 0
					? 0
					: lyrics.length;

		const charEnd =
			chordEnd < chordPositions.length
				? chordPositions[chordEnd]
				: lyrics.length;

		const newChordPositions = chordPositions
			.slice(chordStart, chordEnd)
			.map((pos) => pos - charStart);

		// Trim a trailing separator space left at a chunk boundary (merged
		// runs insert a single space between adjacent lyric segments).
		return {
			lyrics: lyrics.substring(charStart, charEnd).replace(/ $/, ''),
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

		if (chunkLyric && chunkLyric.lyrics !== '') {
			result.push({ ...lyricSongLine, model: chunkLyric });
		}
	});
	return result;
}

/**
 * Determine whether a (chord, lyric?) pair can be merged into a reflow run.
 * A pair is mergeable when it is either lyric-less, or paired with a
 * positioned lyric (the chord line has positioned chords AND the lyric line
 * carries chord positions).  A non-positioned lyric pair is NOT mergeable
 * because the merge math is entirely position-based.
 *
 * @param {SongLine} chordSongLine
 * @param {SongLine|null} lyricSongLine
 * @returns {boolean}
 */
function isMergeable(chordSongLine, lyricSongLine) {
	if (!lyricSongLine) {
		return true;
	}
	return (
		!!chordSongLine.model.hasPositionedChords &&
		lyricSongLine.model.chordPositions.length > 0
	);
}

/**
 * Merge a run of (chord, lyric?) pairs into a single chord SongLine and an
 * optional single lyric SongLine, then re-chunk them into rows of at most
 * `barsPerLine` bars via `emitSplitLines`.
 *
 * @param {{chord: SongLine, lyric: SongLine|null}[]} run
 * @param {number} barsPerLine
 * @returns {SongLine[]}
 */
function emitMergedRun(run, barsPerLine) {
	const mergedBars = [];
	let mergedLyrics = '';
	const mergedChordPositions = [];
	let hasPositionedChords = false;
	let hasAnyLyric = false;

	run.forEach((item) => {
		const itemBars = _cloneDeep(item.chord.model.allBars);

		if (item.lyric) {
			hasAnyLyric = true;
			hasPositionedChords = true;
			if (mergedLyrics !== '') {
				mergedLyrics += ' ';
			}
			const offset = mergedLyrics.length;
			mergedLyrics += item.lyric.model.lyrics;
			item.lyric.model.chordPositions.forEach((pos) => {
				mergedChordPositions.push(pos + offset);
			});
		} else {
			const chordCount = countChordsInBars(itemBars);
			for (let c = 0; c < chordCount; c++) {
				mergedChordPositions.push(mergedLyrics.length);
			}
		}

		mergedBars.push(...itemBars);
	});

	const firstChord = run[0].chord;
	const mergedChordSongLine = {
		...firstChord,
		model: {
			...firstChord.model,
			allBars: mergedBars,
			hasPositionedChords,
		},
	};

	let mergedLyricSongLine = null;
	if (hasAnyLyric) {
		const lyricItem = run.find((item) => item.lyric);
		mergedLyricSongLine = {
			...lyricItem.lyric,
			model: {
				...lyricItem.lyric.model,
				lyrics: mergedLyrics,
				chordPositions: mergedChordPositions,
			},
		};
	}

	return emitSplitLines(
		mergedChordSongLine,
		mergedLyricSongLine,
		barsPerLine
	);
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
	let run = [];
	let i = 0;

	const flushRun = () => {
		if (run.length > 0) {
			result.push(...emitMergedRun(run, barsPerLine));
			run = [];
		}
	};

	while (i < allLines.length) {
		const line = allLines[i];

		if (line.type !== lineTypes.CHORD) {
			// EMPTY_LINE, SECTION_LABEL or any other non-chord line breaks the
			// current run and passes through unchanged (preserves spacing).
			flushRun();
			result.push(line);
			i++;
			continue;
		}

		const nextLine = allLines[i + 1];
		const lyricLine =
			nextLine && nextLine.type === lineTypes.LYRIC ? nextLine : null;

		if (isMergeable(line, lyricLine)) {
			run.push({ chord: line, lyric: lyricLine });
		} else {
			// A chord line paired with a non-positioned lyric cannot join the
			// position-based merge: flush, then split it on its own.
			flushRun();
			result.push(...emitSplitLines(line, lyricLine, barsPerLine));
		}
		i += lyricLine ? 2 : 1;
	}

	flushRun();

	return result;
}
