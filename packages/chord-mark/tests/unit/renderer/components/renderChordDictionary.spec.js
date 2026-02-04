import renderChordDictionary from '../../../../src/renderer/components/renderChordDictionary';

describe('renderChordDictionary', () => {
	test('Module', () => {
		expect(renderChordDictionary).toBeInstanceOf(Function);
	});

	test('returns empty string when no definitions', () => {
		const result = renderChordDictionary({});
		expect(result).toBe('');
	});

	test('renders dictionary container', () => {
		const definitions = {
			C: { frets: [null, 3, 2, 0, 1, 0], source: 'directive' },
		};
		const result = renderChordDictionary(definitions);

		expect(result).toContain('cmChordDictionary');
	});

	test('renders all chord diagrams', () => {
		const definitions = {
			C: { frets: [null, 3, 2, 0, 1, 0], source: 'directive' },
			Am: { frets: [null, 0, 2, 2, 1, 0], source: 'directive' },
			G: { frets: [3, 2, 0, 0, 0, 3], source: 'directive' },
		};
		const result = renderChordDictionary(definitions);

		expect(result).toContain('cmChordDiagram');
		// Should contain 3 diagrams
		const diagramMatches = result.match(/cmChordDiagram--/g);
		expect(diagramMatches).toHaveLength(3);
	});

	test('respects position option', () => {
		const definitions = {
			C: { frets: [null, 3, 2, 0, 1, 0], source: 'directive' },
		};

		const topResult = renderChordDictionary(definitions, {
			position: 'top',
		});
		const bottomResult = renderChordDictionary(definitions, {
			position: 'bottom',
		});

		expect(topResult).toContain('cmChordDictionary--top');
		expect(bottomResult).toContain('cmChordDictionary--bottom');
	});

	test('respects size option', () => {
		const definitions = {
			C: { frets: [null, 3, 2, 0, 1, 0], source: 'directive' },
		};

		const result = renderChordDictionary(definitions, { size: 'large' });

		expect(result).toContain('cmChordDiagram--large');
	});
});
