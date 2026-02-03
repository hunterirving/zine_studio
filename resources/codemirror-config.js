import { ZINE_BOILERPLATE, getBoilerplateCursorPos } from './constants.js';
import { loadContent, loadEditorSettings, saveEditorSetting } from './storage.js';

let lineNumbersCompartment;
let lineWrappingCompartment;
let showLineNumbers = false;
let enableLineWrapping = false;

export function toggleLineNumbers(editorView) {
	const {lineNumbers} = window.CodeMirror;
	showLineNumbers = !showLineNumbers;
	saveEditorSetting('zine-editor-line-numbers', showLineNumbers);
	editorView.dispatch({
		effects: lineNumbersCompartment.reconfigure(showLineNumbers ? lineNumbers() : [])
	});
}

function createLineWrappingExtension() {
	const {EditorView, Decoration} = window.CodeMirror;

	return [
		EditorView.lineWrapping,
		EditorView.decorations.of((view) => {
			const decorations = [];
			for (let {from, to} of view.visibleRanges) {
				for (let pos = from; pos <= to;) {
					const line = view.state.doc.lineAt(pos);
					const lineText = line.text;
					let indentChars = 0;
					for (let i = 0; i < lineText.length; i++) {
						if (lineText[i] === '\t') {
							indentChars += 2;
						} else if (lineText[i] === ' ') {
							indentChars += 1;
						} else {
							break;
						}
					}
					if (indentChars > 0) {
						const indentDecoration = Decoration.line({
							attributes: {
								style: `text-indent: -${indentChars}ch; padding-left: calc(${indentChars}ch + 6px);`
							}
						});
						decorations.push(indentDecoration.range(line.from));
					}
					pos = line.to + 1;
				}
			}
			return decorations.length > 0 ? Decoration.set(decorations) : Decoration.none;
		}),
	];
}

export function toggleLineWrapping(editorView) {
	enableLineWrapping = !enableLineWrapping;
	saveEditorSetting('zine-editor-line-wrapping', enableLineWrapping);
	const lineWrappingExtension = enableLineWrapping ? createLineWrappingExtension() : [];
	editorView.dispatch({
		effects: lineWrappingCompartment.reconfigure(lineWrappingExtension)
	});
}

// Initialize CodeMirror
export async function initializeCodeMirror(saveToStorageCallback, updatePreviewCallback) {
	if (!window.CodeMirror) {
		setTimeout(() => initializeCodeMirror(saveToStorageCallback, updatePreviewCallback), 100);
		return;
	}

	const {EditorView, EditorState, Compartment, keymap, defaultKeymap, indentWithTab, html, githubDark, indentUnit, placeholder, undo, redo, history, closeBrackets, search, searchKeymap, lineNumbers} = window.CodeMirror;

	const customPhrases = EditorState.phrases.of({
		"Find": "Find..."
	});

	const { content: savedContent, isBoilerplate } = await loadContent();
	const settings = loadEditorSettings();
	showLineNumbers = settings.showLineNumbers;
	enableLineWrapping = settings.enableLineWrapping;

	lineNumbersCompartment = new Compartment();
	lineWrappingCompartment = new Compartment();

	const initialLineWrappingExtension = enableLineWrapping ? createLineWrappingExtension() : [];

	const stateConfig = {
		doc: savedContent,
		extensions: [
			customPhrases,
			history(),
			search(),
			closeBrackets(),
			keymap.of([
				{key: "Mod-z", run: undo},
				{key: "Mod-y", run: redo},
				{key: "Mod-Shift-z", run: redo},
				{key: "Mod-o", run: () => { window.loadFile(); return true; }},
				{key: "Mod-s", run: () => { window.saveFile(); return true; }},
				{key: "Mod-e", run: () => { window.saveFileWithViewer(); return true; }},
				{key: "F1", run: (view) => { toggleLineNumbers(view); return true; }},
				{key: "F2", run: (view) => { toggleLineWrapping(view); return true; }},
				indentWithTab,
				...searchKeymap.filter(binding => binding.key !== "Mod-f"),
				...defaultKeymap
			]),
			html(),
			EditorView.inputHandler.of((view, from, to, text) => {
				if (text !== '>') return false;
				const before = view.state.doc.sliceString(Math.max(0, from - 20), from);
				if (before.endsWith('<!')) {
					const startPos = from - 2;
					view.dispatch({
						changes: { from: startPos, to: from, insert: ZINE_BOILERPLATE },
						selection: { anchor: getBoilerplateCursorPos(startPos) }
					});
					return true;
				}
				const match = before.match(/<(style|script)(\s[^>]*)?$/i);
				if (!match) return false;
				const tagName = match[1].toLowerCase();
				const closingTag = `</${tagName}>`;
				view.dispatch({
					changes: { from, to, insert: '>' + closingTag },
					selection: { anchor: from + 1 }
				});
				return true;
			}),
			githubDark,
			indentUnit.of("\t"),
			placeholder("Type <!> to insert zine boilerplate..."),
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					const content = update.state.doc.toString();
					clearTimeout(window.updateTimer);
					window.updateTimer = setTimeout(() => updatePreviewCallback(content), 600);
					saveToStorageCallback(content);
				}
			}),
			EditorView.contentAttributes.of({
				'autocomplete': 'off',
				'autocorrect': 'off',
				'autocapitalize': 'off',
				'spellcheck': 'false'
			}),
			lineNumbersCompartment.of(showLineNumbers ? lineNumbers() : []),
			lineWrappingCompartment.of(initialLineWrappingExtension)
		]
	};

	const editorView = new EditorView({
		state: EditorState.create(stateConfig),
		parent: document.getElementById('editor')
	});

	if (isBoilerplate) {
		editorView.dispatch({
			selection: { anchor: getBoilerplateCursorPos() }
		});
	}

	// Disable browser autocomplete on search panel inputs
	const editorElement = document.getElementById('editor');
	const searchInputObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node.nodeType === Node.ELEMENT_NODE) {
					const searchInputs = node.querySelectorAll?.('.cm-search input[name="search"], .cm-search input[name="replace"]');
					searchInputs?.forEach(input => input.setAttribute('autocomplete', 'off'));
				}
			}
		}
	});
	searchInputObserver.observe(editorElement, { childList: true, subtree: true });

	return editorView;
}
