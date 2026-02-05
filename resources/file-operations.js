import { saveToStorage } from './storage.js';
import { setCurrentSpread, updateSpreadIndicator } from './spread-navigation.js';

// File operations
function downloadHtmlFile(content, filename = 'zine.html') {
	const blob = new Blob([content], { type: 'text/html' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function saveFile(getEditorContent) {
	downloadHtmlFile(getEditorContent());
}

export function loadFile(editorView, updatePreviewCallback) {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.html,.htm';
	input.onchange = function(event) {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = function(e) {
			editorView.dispatch({
				changes: { from: 0, to: editorView.state.doc.length, insert: e.target.result }
			});
			saveToStorage(e.target.result);
			setCurrentSpread(0);
			updateSpreadIndicator();
			updatePreviewCallback();
		};
		reader.readAsText(file);
	};
	input.click();
}
