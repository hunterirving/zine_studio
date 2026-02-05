import { insertAfterHead } from './html-utils.js';
import { extractTitleAndFavicon, updateMainPageTitleAndFavicon } from './html-utils.js';
import { generateSpreadCSS, ZINE_PAGE_CSS, ZINE_FLIP_CSS, ZINE_PRINT_CSS } from './zine-styles.js';
import { SPREADS } from './constants.js';
import { getCurrentSpread } from './spread-navigation.js';
import { isMobileDevice } from './mobile-keyboard.js';
import { setupSpreadLayout, scaleSpreadToFit, navigateToSpread } from './spread-layout.js';
import { setSpreadImmediate } from './page-flip-animation.js';
import { generateFontFaceCSS } from './font-registry.js';

// Track if flip mode is enabled
let flipModeEnabled = true; // Default to enabled
let previousSpread = 0;

export function setFlipMode(enabled) {
	flipModeEnabled = enabled;
}

export function isFlipModeEnabled() {
	return flipModeEnabled;
}

// Generate CSS for flip mode
function generateFlipModeCSS() {
	return `
		* { margin: 0; padding: 0; box-sizing: border-box; }

		@media screen {
			html, body {
				height: 100% !important;
				overflow: hidden !important;
			}

			body {
				display: flex !important;
				justify-content: center !important;
				align-items: center !important;
			}

			body > *:not(.zine-spread-container):not(.iframe-fullscreen-toggle) {
				display: none !important;
			}

			${ZINE_PAGE_CSS}
			${ZINE_FLIP_CSS}

			.zine-spread-container {
				display: flex !important;
				position: relative;
			}

			.page {
				display: block !important;
			}
		}

		@media print {
			${ZINE_PRINT_CSS}
		}
	`;
}

export function updatePreview(editorView, isEditorFocused) {
	const preview = document.getElementById('preview');

	if (isMobileDevice() && isEditorFocused && document.body.classList.contains('mobile-keyboard-open')) {
		return;
	}

	const code = editorView.state.doc.toString();

	// Extract and update title and favicon from user's HTML
	const { title, favicon } = extractTitleAndFavicon(code);
	updateMainPageTitleAndFavicon(title, favicon);

	let scrollX = 0, scrollY = 0;
	try {
		if (preview.contentWindow?.scrollX !== undefined) {
			scrollX = preview.contentWindow.scrollX;
			scrollY = preview.contentWindow.scrollY;
		}
	} catch (e) {}

	// Inject font-face declarations and spread CSS right after <head> so user styles come last and take precedence
	const currentSpread = getCurrentSpread();
	const spreadCSS = flipModeEnabled ? generateFlipModeCSS() : generateSpreadCSS(currentSpread);
	const fontCSS = generateFontFaceCSS();
	const processedCode = insertAfterHead(code, `<style id="zine-editor-fonts">${fontCSS}</style><style id="zine-editor-spread-css">${spreadCSS}</style>`);

	preview.srcdoc = processedCode || '<!DOCTYPE html><html><head></head><body></body></html>';

	const onLoad = () => {
		try {
			const doc = preview.contentDocument;
			if (!doc) return;

			// Add CSS for overscroll and fullscreen button
			const style = doc.createElement('style');
			style.textContent = '* { overscroll-behavior: none !important; } .iframe-fullscreen-toggle { position: fixed; top: 5px; right: 5px; z-index: 10000; background: rgba(0, 0, 0, 0.2); color: white; border: none; border-radius: 4px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background-color 0.2s; box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2); -webkit-tap-highlight-color: transparent; outline: none; user-select: none; } .iframe-fullscreen-toggle svg { filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3)); opacity: 0.8; transition: opacity 0.2s; } @media (hover: hover) and (pointer: fine) { .iframe-fullscreen-toggle:hover { background: rgba(0, 0, 0, 0.35); } .iframe-fullscreen-toggle:hover svg { opacity: 1; } }';
			doc.head.appendChild(style);

			// Create fullscreen button
			const existingButton = doc.getElementById('fullscreenToggle');
			if (existingButton) existingButton.remove();

			const button = doc.createElement('button');
			button.id = 'fullscreenToggle';
			button.className = 'iframe-fullscreen-toggle';
			button.title = 'Toggle fullscreen';
			button.innerHTML = '<svg width="20" height="20" viewBox="0 0 14 14" fill="white"><path d="M 7,14 H 5 v 5 h 5 V 17 H 7 Z M 5,10 H 7 V 7 h 3 V 5 H 5 Z m 12,7 h -3 v 2 h 5 V 14 H 17 Z M 14,5 v 2 h 3 v 3 h 2 V 5 Z" transform="translate(-5,-5)"/></svg>';
			button.addEventListener('click', function() {
				parent.postMessage('toggleFullscreen', '*');
			});

			if (doc.body) {
				doc.body.appendChild(button);

				// Create container for the spread and wrap visible pages
				const spread = SPREADS[currentSpread];
				const container = doc.createElement('div');
				container.className = 'zine-spread-container';

				if (flipModeEnabled) {
					// Setup flip animation mode
					setupSpreadLayout(container, spread, doc, true);
					doc.body.appendChild(container);

					// Set initial spread state without animation
					setTimeout(() => {
						scaleSpreadToFit(container, doc); // Must call this BEFORE setSpreadImmediate so zoom is set
						setSpreadImmediate(currentSpread, doc);

						// On resize, update zoom and reposition book
						const handleResize = () => {
							scaleSpreadToFit(container, doc);
							// Get the actual current spread from the leaf states
							const leaves = doc.querySelectorAll('.zine-leaf');
							let activeSpread = 0;
							leaves.forEach((leaf, index) => {
								if (leaf.dataset.state === 'open') {
									activeSpread = index + 1;
								}
							});
							setSpreadImmediate(activeSpread, doc);
						};
						doc.defaultView.addEventListener('resize', handleResize);
					}, 0);
				} else {
					// Original non-animated mode
					setupSpreadLayout(container, spread, doc, false);
					doc.body.appendChild(container);

					// Scale container to fit viewport
					const scaleToFit = () => scaleSpreadToFit(container, doc);
					scaleToFit();
					doc.defaultView.addEventListener('resize', scaleToFit);
				}

				// Store container and flip mode state for navigation updates
				doc._zineContainer = container;
				doc._flipModeEnabled = flipModeEnabled;
			}

			// Add keyboard listener for navigation and shortcuts
			doc.addEventListener('keydown', function(e) {
				if (e.key === 'ArrowLeft') {
					e.preventDefault();
					parent.postMessage('prevSpread', '*');
				} else if (e.key === 'ArrowRight') {
					e.preventDefault();
					parent.postMessage('nextSpread', '*');
				} else if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
					e.preventDefault();
					window.print();
				} else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
					e.preventDefault();
					parent.postMessage('saveFile', '*');
				}
			});

			setTimeout(() => {
				try {
					preview.contentWindow?.scrollTo(scrollX, scrollY);
				} catch (e) {}
			}, 10);
		} catch (e) {}

		preview.removeEventListener('load', onLoad);
	};
	preview.addEventListener('load', onLoad);
}

// Setup preview pane interactions
export function setupPreviewPane(updatePreviewCallback) {
	const previewPane = document.querySelector('.preview-pane');
	const preview = document.getElementById('preview');

	// Focus preview when clicking anywhere in the preview pane (for keyboard nav)
	previewPane.addEventListener('click', (e) => {
		// Don't steal focus if clicking nav buttons
		if (!e.target.closest('.spread-nav button')) {
			preview.focus();
		}
	});
}
