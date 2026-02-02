import { saveToStorage } from './storage.js';
import { saveFile, saveFileWithViewer, loadFile } from './file-operations.js';
import { updatePreview, setupPreviewPane } from './preview-manager.js';
import { navigateSpread, toggleFullscreen, initializeSpreadNav, getIsFullscreen } from './spread-navigation.js';
import { initializeCodeMirror } from './codemirror-config.js';
import { isMobileDevice, exitMobileKeyboardMode, initializeMobileKeyboard } from './mobile-keyboard.js';

// Global state
let editorView;
let isEditorFocused = false;

// Wrapper functions for updatePreview
function updatePreviewWrapper() {
	updatePreview(editorView, isEditorFocused);
}

function updatePreviewFromContent() {
	updatePreviewWrapper();
}

// Message handler for iframe communication
window.addEventListener('message', function(event) {
	if (event.data === 'toggleFullscreen') {
		toggleFullscreen();
		updatePreviewWrapper();
	} else if (event.data === 'prevSpread') {
		navigateSpread(-1, updatePreviewWrapper);
	} else if (event.data === 'nextSpread') {
		navigateSpread(1, updatePreviewWrapper);
	} else if (event.data === 'saveFile') {
		window.saveFile();
	} else if (event.data === 'saveFileWithViewer') {
		window.saveFileWithViewer();
	}
});

// Expose file operations to window for keyboard shortcuts
window.saveFile = function() {
	saveFile(() => editorView.state.doc.toString());
};

window.saveFileWithViewer = function() {
	saveFileWithViewer(() => editorView.state.doc.toString());
};

window.loadFile = function() {
	loadFile(editorView, updatePreviewWrapper);
};

// Initialize editor
async function initializeEditor() {
	editorView = await initializeCodeMirror(saveToStorage, updatePreviewFromContent);

	// Initialize spread navigation
	initializeSpreadNav((delta) => navigateSpread(delta, updatePreviewWrapper));

	// Setup preview pane
	setupPreviewPane(updatePreviewWrapper);

	// Initial preview
	updatePreviewWrapper();

	// Track editor focus
	editorView.contentDOM.addEventListener('focus', () => { isEditorFocused = true; });
	editorView.contentDOM.addEventListener('blur', () => {
		isEditorFocused = false;
		if (isMobileDevice()) {
			exitMobileKeyboardMode(editorView, updatePreviewWrapper);
		}
	});

	editorView.focus();

	// Keyboard shortcuts (only when editor not focused, since CodeMirror handles its own)
	document.addEventListener('keydown', function(e) {
		const {closeSearchPanel, openSearchPanel} = window.CodeMirror;
		const editorHasFocus = editorView.hasFocus;

		if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
			e.preventDefault();
			closeSearchPanel(editorView) || openSearchPanel(editorView);
		}
		// Export with viewer (Cmd+E) - only handle when editor not focused
		if (!editorHasFocus && (e.metaKey || e.ctrlKey) && e.key === 'e') {
			e.preventDefault();
			window.saveFileWithViewer();
		}
		// Print the iframe content instead of the parent page
		if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
			e.preventDefault();
			try {
				document.getElementById('preview').contentWindow.print();
			} catch (err) {
				window.print();
			}
		}
	});

	// Initialize mobile keyboard handling
	initializeMobileKeyboard(
		() => isEditorFocused,
		() => exitMobileKeyboardMode(editorView, updatePreviewWrapper)
	);

	// Exit fullscreen when viewport is too short (matches CSS @media max-height: 200px)
	window.addEventListener('resize', function() {
		if (getIsFullscreen() && window.innerHeight <= 200) {
			toggleFullscreen();
			updatePreviewWrapper();
		}
	});
}

// Initialize
initializeEditor();
