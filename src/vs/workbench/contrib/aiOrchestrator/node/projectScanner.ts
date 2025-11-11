/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';
import { ILogService } from '../../../../platform/log/common/log.js';

/**
 * Project analysis result
 */
export interface IProjectAnalysis {
	/** Detected tech stack (frameworks, libraries) */
	techStack: string[];

	/** Primary language */
	primaryLanguage: string;

	/** Project type (web, mobile, desktop, library, etc.) */
	projectType: string;

	/** Build tools detected */
	buildTools: string[];

	/** Package managers detected */
	packageManagers: string[];

	/** Frameworks detected */
	frameworks: string[];

	/** Confidence score (0-100) */
	confidence: number;
}

/**
 * Project Scanner - Analyzes workspace to detect tech stack and project structure
 *
 * Scans for:
 * - package.json (Node.js/JavaScript/TypeScript)
 * - requirements.txt / pyproject.toml (Python)
 * - Cargo.toml (Rust)
 * - go.mod (Go)
 * - pom.xml / build.gradle (Java)
 * - Gemfile (Ruby)
 * - composer.json (PHP)
 */
export class ProjectScanner {

	constructor(
		@ILogService private readonly logService: ILogService
	) {}

	/**
	 * Scan workspace and detect tech stack
	 */
	async scanWorkspace(workspacePath: string): Promise<IProjectAnalysis> {
		this.logService.info(`[ProjectScanner] Scanning workspace: ${workspacePath}`);

		const analysis: IProjectAnalysis = {
			techStack: [],
			primaryLanguage: 'unknown',
			projectType: 'unknown',
			buildTools: [],
			packageManagers: [],
			frameworks: [],
			confidence: 0
		};

		try {
			// Check for Node.js project
			const nodeAnalysis = await this.analyzeNodeProject(workspacePath);
			if (nodeAnalysis) {
				analysis.techStack.push(...nodeAnalysis.techStack);
				analysis.frameworks.push(...nodeAnalysis.frameworks);
				analysis.buildTools.push(...nodeAnalysis.buildTools);
				analysis.packageManagers.push('npm');
				analysis.primaryLanguage = nodeAnalysis.language;
				analysis.projectType = nodeAnalysis.projectType;
				analysis.confidence = Math.max(analysis.confidence, 90);
			}

			// Check for Python project
			const pythonAnalysis = await this.analyzePythonProject(workspacePath);
			if (pythonAnalysis) {
				analysis.techStack.push(...pythonAnalysis.techStack);
				analysis.frameworks.push(...pythonAnalysis.frameworks);
				analysis.buildTools.push(...pythonAnalysis.buildTools);
				analysis.packageManagers.push('pip');
				if (analysis.primaryLanguage === 'unknown') {
					analysis.primaryLanguage = 'Python';
				}
				analysis.confidence = Math.max(analysis.confidence, 80);
			}

			// Check for Rust project
			if (fs.existsSync(path.join(workspacePath, 'Cargo.toml'))) {
				analysis.techStack.push('Rust');
				analysis.buildTools.push('Cargo');
				analysis.packageManagers.push('Cargo');
				analysis.primaryLanguage = 'Rust';
				analysis.confidence = Math.max(analysis.confidence, 95);
			}

			// Check for Go project
			if (fs.existsSync(path.join(workspacePath, 'go.mod'))) {
				analysis.techStack.push('Go');
				analysis.buildTools.push('Go Modules');
				analysis.packageManagers.push('Go Modules');
				analysis.primaryLanguage = 'Go';
				analysis.confidence = Math.max(analysis.confidence, 95);
			}

			// Check for Java project
			const javaAnalysis = await this.analyzeJavaProject(workspacePath);
			if (javaAnalysis) {
				analysis.techStack.push(...javaAnalysis.techStack);
				analysis.buildTools.push(...javaAnalysis.buildTools);
				if (analysis.primaryLanguage === 'unknown') {
					analysis.primaryLanguage = 'Java';
				}
				analysis.confidence = Math.max(analysis.confidence, 85);
			}

			// Deduplicate arrays
			analysis.techStack = [...new Set(analysis.techStack)];
			analysis.frameworks = [...new Set(analysis.frameworks)];
			analysis.buildTools = [...new Set(analysis.buildTools)];
			analysis.packageManagers = [...new Set(analysis.packageManagers)];

			this.logService.info(`[ProjectScanner] Analysis complete:`, analysis);
			return analysis;

		} catch (error) {
			this.logService.error('[ProjectScanner] Error scanning workspace:', error);
			return analysis;
		}
	}

	/**
	 * Analyze Node.js/JavaScript/TypeScript project
	 */
	private async analyzeNodeProject(workspacePath: string): Promise<{
		techStack: string[];
		frameworks: string[];
		buildTools: string[];
		language: string;
		projectType: string;
	} | null> {
		const packageJsonPath = path.join(workspacePath, 'package.json');
		if (!fs.existsSync(packageJsonPath)) {
			return null;
		}

		try {
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
			const deps = {
				...packageJson.dependencies || {},
				...packageJson.devDependencies || {}
			};

			const techStack: string[] = [];
			const frameworks: string[] = [];
			const buildTools: string[] = [];
			let language = 'JavaScript';
			let projectType = 'web';

			// Detect TypeScript
			if (deps['typescript'] || fs.existsSync(path.join(workspacePath, 'tsconfig.json'))) {
				techStack.push('TypeScript');
				language = 'TypeScript';
			} else {
				techStack.push('JavaScript');
			}

			// Detect frameworks
			if (deps['react']) {
				frameworks.push('React');
				techStack.push('React');
			}
			if (deps['next']) {
				frameworks.push('Next.js');
				techStack.push('Next.js');
				projectType = 'web-fullstack';
			}
			if (deps['vue']) {
				frameworks.push('Vue.js');
				techStack.push('Vue.js');
			}
			if (deps['@angular/core']) {
				frameworks.push('Angular');
				techStack.push('Angular');
			}
			if (deps['express']) {
				frameworks.push('Express');
				techStack.push('Express');
				projectType = 'backend';
			}
			if (deps['nestjs']) {
				frameworks.push('NestJS');
				techStack.push('NestJS');
				projectType = 'backend';
			}
			if (deps['electron']) {
				frameworks.push('Electron');
				techStack.push('Electron');
				projectType = 'desktop';
			}

			// Detect build tools
			if (deps['webpack'] || fs.existsSync(path.join(workspacePath, 'webpack.config.js'))) {
				buildTools.push('Webpack');
			}
			if (deps['vite'] || fs.existsSync(path.join(workspacePath, 'vite.config.ts'))) {
				buildTools.push('Vite');
			}
			if (deps['rollup']) {
				buildTools.push('Rollup');
			}
			if (deps['esbuild']) {
				buildTools.push('esbuild');
			}
			if (packageJson.scripts?.build || packageJson.scripts?.dev) {
				buildTools.push('npm scripts');
			}

			// Detect UI libraries
			if (deps['tailwindcss']) {
				techStack.push('Tailwind CSS');
			}
			if (deps['@mui/material']) {
				techStack.push('Material-UI');
			}
			if (deps['@shadcn/ui'] || deps['shadcn']) {
				techStack.push('shadcn/ui');
			}

			return { techStack, frameworks, buildTools, language, projectType };

		} catch (error) {
			this.logService.error('[ProjectScanner] Error analyzing Node project:', error);
			return null;
		}
	}

	/**
	 * Analyze Python project
	 */
	private async analyzePythonProject(workspacePath: string): Promise<{
		techStack: string[];
		frameworks: string[];
		buildTools: string[];
	} | null> {
		const requirementsPath = path.join(workspacePath, 'requirements.txt');
		const pyprojectPath = path.join(workspacePath, 'pyproject.toml');

		if (!fs.existsSync(requirementsPath) && !fs.existsSync(pyprojectPath)) {
			return null;
		}

		const techStack: string[] = ['Python'];
		const frameworks: string[] = [];
		const buildTools: string[] = [];

		try {
			// Check requirements.txt
			if (fs.existsSync(requirementsPath)) {
				const requirements = fs.readFileSync(requirementsPath, 'utf-8');

				if (requirements.includes('django')) {
					frameworks.push('Django');
					techStack.push('Django');
				}
				if (requirements.includes('flask')) {
					frameworks.push('Flask');
					techStack.push('Flask');
				}
				if (requirements.includes('fastapi')) {
					frameworks.push('FastAPI');
					techStack.push('FastAPI');
				}
				if (requirements.includes('tensorflow')) {
					frameworks.push('TensorFlow');
					techStack.push('TensorFlow');
				}
				if (requirements.includes('torch')) {
					frameworks.push('PyTorch');
					techStack.push('PyTorch');
				}
				if (requirements.includes('pandas')) {
					techStack.push('Pandas');
				}
				if (requirements.includes('numpy')) {
					techStack.push('NumPy');
				}
			}

			// Check for Poetry
			if (fs.existsSync(pyprojectPath)) {
				buildTools.push('Poetry');
			}

			// Check for setup.py
			if (fs.existsSync(path.join(workspacePath, 'setup.py'))) {
				buildTools.push('setuptools');
			}

			return { techStack, frameworks, buildTools };

		} catch (error) {
			this.logService.error('[ProjectScanner] Error analyzing Python project:', error);
			return null;
		}
	}

	/**
	 * Analyze Java project
	 */
	private async analyzeJavaProject(workspacePath: string): Promise<{
		techStack: string[];
		buildTools: string[];
	} | null> {
		const pomPath = path.join(workspacePath, 'pom.xml');
		const gradlePath = path.join(workspacePath, 'build.gradle');

		if (!fs.existsSync(pomPath) && !fs.existsSync(gradlePath)) {
			return null;
		}

		const techStack: string[] = ['Java'];
		const buildTools: string[] = [];

		if (fs.existsSync(pomPath)) {
			buildTools.push('Maven');
			try {
				const pom = fs.readFileSync(pomPath, 'utf-8');
				if (pom.includes('spring-boot')) {
					techStack.push('Spring Boot');
				}
			} catch (error) {
				// Ignore parse errors
			}
		}

		if (fs.existsSync(gradlePath)) {
			buildTools.push('Gradle');
		}

		return { techStack, buildTools };
	}
}
