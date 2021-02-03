#!/usr/bin/env node
const childProc = require('child_process');
const fs = require('fs-extra');
const fetch = require('node-fetch').default;
const { compile } = require('./compiler');
const { degitPath, repoName, tutorialDirPath, localClonePath, localCloneTutPath } = require('./constants');

// Ensure that caching info file is present
const buildInfoFile = `${__dirname}/../build-info.json`;
let lastBuildInfo = {
	sha: null,
	builtAtMs: null,
};
if (fs.existsSync(buildInfoFile)) {
	lastBuildInfo = JSON.parse(fs.readFileSync(buildInfoFile, 'utf-8'));
}

async function build() {
	// Check that latest commit has actually changed contents of docs since last build
	const lastCommitInfoRes = await fetch(
		`https://api.github.com/repos/${repoName}/commits?path=${tutorialDirPath}&page=1&per_page=1`
	);
	/** @type {import('@octokit/types').Endpoints["GET /repos/{owner}/{repo}/commits"]['response']['data']} */
	const lastCommits = await lastCommitInfoRes.json();

	if (!lastCommits.length) {
		throw new Error(`Could not find any commits for ${repoName} - ${tutorialDirPath}`);
	}

	const sourceLastCommit = lastCommits[0];
	if (sourceLastCommit.sha === lastBuildInfo.sha) {
		console.log(`Skipping fresh build - source is still at ${lastBuildInfo.sha}`);
		return false;
	}

	// Start fresh build - clone from src
	console.log(`Starting fresh build... source is at ${sourceLastCommit.sha}, local is at ${lastBuildInfo.sha}`);
	await fs.emptyDir(localClonePath);
	const degitRes = childProc.execSync(`degit ${repoName}/${degitPath} ${localClonePath}`);

	const combinedMd = await buildOnePagerFromLocal();

	/** @type {BuildInfo} */
	const freshBuildInfo = {
		sha: sourceLastCommit.sha,
		buildAtMs: Date.now(),
	};

	compile(combinedMd, freshBuildInfo);
	fs.writeJSONSync(buildInfoFile, freshBuildInfo);
	return true;
}

const buildOnePagerFromLocal = async () => {
	if (!fs.existsSync(localClonePath) || !fs.existsSync(localCloneTutPath)) {
		throw new Error('Remote was not cloned!');
	}

	let onePagerMd = '';
	const sectionDirNames = await fs.readdir(localCloneTutPath);
	/** @type {Section[]} */
	const sections = await Promise.all(
		sectionDirNames.map(async (chapterDirName) => {
			const sectionDirPath = `${localCloneTutPath}/${chapterDirName}`;
			const index = getIndexFromDirName(chapterDirName);
			const title = (await fs.readJson(`${sectionDirPath}/meta.json`)).title;
			const chapterDirNames = await fs.readdir(sectionDirPath);

			// Recurse another level into chapters
			/** @type {Chapter[]} */
			const chapters = [];
			/** @type {Chapter[]} */
			await Promise.all(
				chapterDirNames.map(async (dirName) => {
					const chapterDirPath = `${sectionDirPath}/${dirName}`;
					if (!fs.statSync(chapterDirPath).isDirectory()) {
						return;
					}

					const index = getIndexFromDirName(dirName);
					let title = `${chapterDirName} / ${dirName}`;
					// Read in and process the raw MD file
					const rawTextMd = fs.readFileSync(`${chapterDirPath}/text.md`, { encoding: 'utf-8' });
					const frMatterMatcher = /(---[\r\n]+)(.+?)^(---(?:\r\n|\n))[\r\n]*/ims;
					const mdTitleMatcher = /^(?:---[\r\n]+).*?^title:([^\r\n]+).*?^(?:---(?:\r\n|\n))[\r\n]*/ims;
					const titleMatches = mdTitleMatcher.exec(rawTextMd);
					if (titleMatches && titleMatches.length && !!titleMatches[1]) {
						title = titleMatches[1];
					}

					// Strip any front-matter from MD so it can concatenated
					let processedMd = rawTextMd.replace(frMatterMatcher, '');
					// Downgrade all existing headings
					processedMd = downgradeMdHeadings(processedMd, 1);
					// Inject title as h2
					// Give it a prefix to avoid global heading conflicts
					processedMd = `## Chapter #${index} - ${title}\n\n${processedMd}`;

					// Grab all svelte apps
					// Make sure to only grab the "solution" files - in `/app-b` in all chapters except first
					/** @type {Chapter['svelteApps']} */
					const svelteApps = [];
					let svelteFiles = [];
					/** @type {null | string} */
					let solutionDirName = null;
					let currDirPaths = await fs.readdir(chapterDirPath);
					if (currDirPaths.includes('app-b')) {
						solutionDirName = 'app-b';
					} else if (currDirPaths.includes('app-a') && currDirPaths.length === 1) {
						solutionDirName = 'app-a';
					}
					if (solutionDirName) {
						svelteFiles = await fs.readdir(`${chapterDirPath}/${solutionDirName}`);
						svelteFiles.forEach((filename) => {
							if (filename.endsWith('.svelte')) {
								const filepath = `${chapterDirPath}/${solutionDirName}/${filename}`;
								svelteApps.push({
									filepath,
									filename,
									rawContents: fs.readFileSync(filepath, { encoding: 'utf-8' }),
								});
							}
						});
					}

					chapters.push({
						index,
						title,
						processedMd,
						svelteApps,
					});
				})
			);

			return {
				index,
				title,
				chapters: chapters.sort((chapA, chapB) => chapA.index - chapB.index),
			};
		})
	);

	// Sort sections, and then iterate over in original order, to make final one-pager
	sections
		.sort((sectionA, sectionB) => sectionA.index - sectionB.index)
		.forEach((section) => {
			onePagerMd += `<div class="chapter title" id="section-${section.title}">${section.title}</div>\n\n`;
			onePagerMd += section.chapters.map((c) => c.processedMd).join(`\n\n`);
		});

	return onePagerMd;
};

/**
 * @param {string} dirName
 */
const getIndexFromDirName = (dirName) => {
	return parseInt(dirName.split('-')[0], 10);
};

/**
 * Downgrades all headings in a MD document
 *  - This assumes normal MD syntax
 * @param {string} mdString The raw Markdown doc
 * @param {number} [levelsToDowngrade] How many levels to downgrade (e.g. value of 1 means `#` becomes `##`)
 */
const downgradeMdHeadings = (mdString, levelsToDowngrade = 1) => {
	const fill = Array(levelsToDowngrade).fill('#').join('');
	return mdString.replace(/^([^#\r\n]*)#/gm, (match, g1) => {
		return `${g1}${fill}#`;
	});
};

build()
	.then((res) => {
		console.log(res);
		process.exit(0);
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
