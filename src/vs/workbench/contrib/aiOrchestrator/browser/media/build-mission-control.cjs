/*---------------------------------------------------------------------------------------------
 *  Mission Control React App Bundler
 *  Bundles the React application for use in VS Code webview
 *--------------------------------------------------------------------------------------------*/

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const isDev = process.argv.includes('--watch');
const sourceDir = '/mnt/c/Users/bubun/CascadeProjects/coding-agent-template/mission-control-dashboard';
const outDir = path.resolve(__dirname);

console.log('Building Mission Control React app...');
console.log('Source:', sourceDir);
console.log('Output:', outDir);

// Verify source directory exists
if (!fs.existsSync(sourceDir)) {
	console.error('ERROR: Source directory not found:', sourceDir);
	console.error('Make sure the mission-control-dashboard folder exists at:');
	console.error('  C:\\Users\\bubun\\CascadeProjects\\coding-agent-template\\mission-control-dashboard');
	process.exit(1);
}

const buildOptions = {
	entryPoints: [path.join(sourceDir, 'app/page.tsx')],
	bundle: true,
	outfile: path.join(outDir, 'mission-control-bundle.js'),
	platform: 'browser',
	target: 'es2020',
	format: 'iife',
	globalName: 'MissionControl',
	loader: {
		'.tsx': 'tsx',
		'.ts': 'ts',
		'.jsx': 'jsx',
		'.js': 'js',
		'.css': 'css',
	},
	define: {
		'process.env.NODE_ENV': isDev ? '"development"' : '"production"',
		global: 'window',
	},
	external: [],
	minify: !isDev,
	sourcemap: isDev,
	logLevel: 'info',
	alias: {
		'@': sourceDir,
	},
	// Tell esbuild where to find node_modules
	nodePaths: [path.join(sourceDir, 'node_modules')],
	// Inject React into global scope for JSX
	inject: [path.join(__dirname, 'react-shim.js')],
};

async function build() {
	try {
		if (isDev) {
			const ctx = await esbuild.context(buildOptions);
			await ctx.watch();
			console.log('Watching for changes...');
		} else {
			await esbuild.build(buildOptions);
			console.log('Build completed successfully!');
		}
	} catch (error) {
		console.error('Build failed:', error);
		process.exit(1);
	}
}

build();
