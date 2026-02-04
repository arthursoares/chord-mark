const render = ({
	chordDictionaryTop = '',
	song,
	chordDictionaryBottom = '',
}) => {
	return `${chordDictionaryTop}<div class="cmSong">${song}</div>${chordDictionaryBottom}`;
};
export default render;
