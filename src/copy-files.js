const fs = require('fs-extra');
const { localClonePath, distPath } = require('./constants');

/** @type {Record<string, string>} */
const degitCopyMap = {
	'/static/prism.css': '/prism.css',
	'/static/global.css': '/global.css',
	'/static/fonts': '/fonts',
};
/** @type {Record<string, string>} */
const projectRootCopyMap = {
	'/node_modules/@sveltejs/site-kit/base.css': '/svelte-site-kit-base.css',
};

const copyFiles = async () => {
	const degitCopyOps = Object.keys(degitCopyMap).map((k) => {
		const srcPath = `${localClonePath}${k}`;
		const destPath = `${distPath}${degitCopyMap[k]}`;
		return fs.copy(srcPath, destPath);
	});
	const rootCopyOps = Object.keys(projectRootCopyMap).map((k) => {
		const srcPath = `${__dirname}/../${k}`;
		const destPath = `${distPath}${projectRootCopyMap[k]}`;
		return fs.copy(srcPath, destPath);
	});
	await Promise.all([...degitCopyOps, ...rootCopyOps]);

	await fs.copy(`${__dirname}/style.css`, `${distPath}/style.css`);
};

module.exports = {
	copyFiles,
};
