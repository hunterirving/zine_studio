#!/usr/bin/env node
// Build script to bundle CodeMirror for offline use
//
// Usage:
//	cd vendor
//	npm install
//	npm run build
//
// This will regenerate ../codemirror-bundle.js

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

await esbuild.build({
	stdin: {
		contents: `
			export {EditorView, keymap, placeholder, lineNumbers, Decoration} from "@codemirror/view";
			export {EditorState, Compartment} from "@codemirror/state";
			export {defaultKeymap, indentWithTab, undo, redo, undoDepth, redoDepth, history, historyKeymap} from "@codemirror/commands";
			export {closeBrackets, closeBracketsKeymap} from "@codemirror/autocomplete";
			export {html} from "@codemirror/lang-html";
			export {githubDark} from "@fsegurai/codemirror-theme-github-dark";
			export {indentUnit} from "@codemirror/language";
			export {search, searchKeymap, closeSearchPanel, openSearchPanel} from "@codemirror/search";
		`,
		resolveDir: __dirname,
		loader: 'js',
	},
	bundle: true,
	format: 'esm',
	outfile: join(__dirname, '..', 'codemirror-bundle.js'),
	minify: true,
	target: ['es2020'],
});

console.log('✓ CodeMirror bundle created: ../codemirror-bundle.js');
