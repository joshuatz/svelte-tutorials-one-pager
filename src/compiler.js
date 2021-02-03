const fs = require('fs-extra');
const marked = require('marked');
const { distPath } = require('./constants');
const { JSDOM } = require('jsdom');

const templatePath = `${__dirname}/template.html`;
const outPath = `${distPath}/index.html`;

/**
 * Compile MD and build info to final dist doc
 * @param {string} onePagerMd
 * @param {BuildInfo} buildInfo
 */
const compileToDistHtml = async (onePagerMd, buildInfo) => {
	// Convert combined tutorial markdown
	const convertedTutContent = marked(onePagerMd, {
		baseUrl: `https://svelte.dev/`,
	});

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

	// Fixup
	console.log(`Patching up HTML...`);
	compiledHtml = fixupHtml(compiledHtml);

	// Write back out compiled HTML
	fs.ensureFileSync(outPath);
	fs.writeFileSync(outPath, compiledHtml, { encoding: 'utf-8' });
};

/**
 * @param {string} html
 */
const fixupHtml = (html) => {
	const jsDom = new JSDOM(html);
	const vDom = jsDom.window.document;
	// Wrap headings in links, if they have anchor IDs
	vDom.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
		const id = h.getAttribute('id');
		if (h.parentNode && h.parentNode.nodeName !== 'A' && !!id) {
			const wrapperA = vDom.createElement('a');
			wrapperA.href = `#${id}`;
			h.parentNode.insertBefore(wrapperA, h);
			wrapperA.appendChild(h);
		}
	});

	return vDom.documentElement.outerHTML;
};

module.exports = {
	compileToDistHtml,
};
