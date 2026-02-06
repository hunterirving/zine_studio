import { saveToStorage } from './storage.js';
import { saveFile, loadFile } from './file-operations.js';
import { updatePreview, setupPreviewPane } from './preview-manager.js';
import { navigateSpread, toggleFullscreen, initializeSpreadNav, getIsFullscreen } from './spread-navigation.js';
import { initializeCodeMirror } from './codemirror-config.js';
import { preloadAllFonts } from './font-registry.js';
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
	} else if (event.data?.type === 'scaleChange') {
		// Update background grid size and position to match zine preview
		const previewPane = document.querySelector('.preview-pane');
		const preview = document.querySelector('#preview');
		if (previewPane && preview) {
			// Get iframe position relative to preview pane
			const iframeRect = preview.getBoundingClientRect();
			const paneRect = previewPane.getBoundingClientRect();
			const iframeOffsetX = iframeRect.left - paneRect.left;
			const iframeOffsetY = iframeRect.top - paneRect.top;

			// Spread position in pane coordinates
			const spreadLeft = iframeOffsetX + event.data.spreadLeft;
			const spreadTop = iframeOffsetY + event.data.spreadTop;

			previewPane.style.setProperty('--grid-width', `${event.data.gridWidth}px`);
			previewPane.style.setProperty('--grid-height', `${event.data.gridHeight}px`);
			previewPane.style.setProperty('--spread-left', `${spreadLeft}px`);
			previewPane.style.setProperty('--spread-top', `${spreadTop}px`);
			previewPane.classList.add('grid-ready');
		}
	}
});

// Expose file operations to window for keyboard shortcuts
window.saveFile = function() {
	saveFile(() => editorView.state.doc.toString());
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

		if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
			e.preventDefault();
			closeSearchPanel(editorView) || openSearchPanel(editorView);
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
		if (getIsFullscreen() && window.innerHeight <= 270) {
			toggleFullscreen();
			updatePreviewWrapper();
		}
	});
}

// Initialize
initializeEditor();

// Preload fonts in the background so they're ready when needed
preloadAllFonts();
