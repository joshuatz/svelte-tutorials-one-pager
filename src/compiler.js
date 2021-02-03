const fs = require('fs-extra');
const marked = require('marked');
const { distPath } = require('./constants');

const templatePath = `${__dirname}/template.html`;
const outPath = `${distPath}/index.html`;

/**
 * Compile MD and build info to final dist doc
 * @param {string} onePagerMd
 * @param {BuildInfo} buildInfo
 */
const compile = async (onePagerMd, buildInfo) => {
	// Convert combined tutorial markdown
	const convertedTutContent = marked(onePagerMd);

	const replaceableVars = {
		...buildInfo,
		buildAtReadable: new Date(buildInfo.buildAtMs).toISOString(),
		tutContent: convertedTutContent,
	};

	// Read in template file
	const templateHtml = fs.readFileSync(templatePath, { encoding: 'utf-8' });
	let compiledHtml = templateHtml;

	Object.keys(replaceableVars).forEach((n) => {
		// prettier-ignore
		const varName = /** @type {keyof typeof replaceableVars} */ (n);
		const replacePatt = new RegExp(`{{${varName}}}`, 'g');
		compiledHtml = compiledHtml.replace(replacePatt, replaceableVars[varName].toString());
	});

	// Write back out compiled HTML
	fs.writeFileSync(outPath, compiledHtml, { encoding: 'utf-8' });
};

module.exports = {
	compile,
};
