interface Section {
	/** Based on dir name - e.g. `03-props` should be #3 section */
	index: number;
	/** Should be stored in meta.json */
	title: string;
	/** Sub-dirs in Section */
	chapters: Chapter[];
}

interface Chapter {
	/** Based on dir name - e.g. `03-props` should be #3 section */
	index: number;
	/** Should be in frontmatter of Markdown file */
	title: string;
	/**
	 * Contents of actual markdown file, but processed
	 * - Front matter stripped off
	 * - Title injected as h2
	 * - All existing headings downgraded (h2 > h3)
	 */
	processedMd: string;
	/** Svelte files in ${Section}/${Chapter}/app-b */
	svelteApps: Array<{
		filename: string;
		filepath: string;
		rawContents: string;
	}>;
}

interface BuildInfo {
	sha: string;
	buildAtMs: number;
}
