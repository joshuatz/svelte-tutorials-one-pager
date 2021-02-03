const fs = require('fs-extra');
const { localClonePath, distPath } = require('./constants');

/** @type {Record<string, string>} */
const degitCopyMap = {
	'/static/prism.css': '/prism.css',
	'/static/global.css': '/global.css',
};

const copyFiles = async () => {
	await Promise.all(
		Object.keys(degitCopyMap).map((k) => {
			const srcPath = `${localClonePath}${k}`;
			const destPath = `${distPath}${degitCopyMap[k]}`;
			return fs.copyFile(srcPath, destPath);
		})
	);

	await fs.copyFile(`${__dirname}/style.css`, `${distPath}/style.css`);
};

module.exports = {
	copyFiles,
};
