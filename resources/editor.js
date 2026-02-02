let updateTimer;
let editorView;
const preview = document.getElementById('preview');
const editorPane = document.querySelector('.editor-pane');
const previewPane = document.querySelector('.preview-pane');
const storageKey = 'zine-editor-content';

// Extract title and favicon from user's HTML
function extractTitleAndFavicon(htmlCode) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlCode, 'text/html');
	const titleElement = doc.querySelector('title');
	const title = titleElement ? titleElement.textContent.trim() : null;
	const faviconSelectors = [
		'link[rel="icon"]',
		'link[rel="shortcut icon"]',
		'link[rel="apple-touch-icon"]'
	];
	let favicon = null;
	for (const selector of faviconSelectors) {
		const faviconElement = doc.querySelector(selector);
		if (faviconElement && faviconElement.getAttribute('href')) {
			favicon = faviconElement.getAttribute('href');
			break;
		}
	}
	return { title, favicon };
}

function updateMainPageTitleAndFavicon(title, favicon) {
	if (title) {
		document.title = title;
	} else {
		document.title = 'zine.html';
	}
	let faviconLink = document.querySelector('link[rel="icon"]');
	if (!faviconLink) {
		faviconLink = document.createElement('link');
		faviconLink.rel = 'icon';
		document.head.appendChild(faviconLink);
	}
	if (favicon) {
		faviconLink.href = favicon;
	} else {
		faviconLink.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🖨️</text></svg>';
	}
}

// Zine HTML boilerplate template
const ZINE_BOILERPLATE = `<!DOCTYPE html>
<html>
\t<head>
\t\t<style>
\t\t\t
\t\t</style>
\t</head>
\t<body>
\t\t<div class="page" id="front-cover">
\t\t\t
\t\t</div>
\t\t<div class="page" id="page1">
\t\t\t
\t\t</div>
\t\t<div class="page" id="page2">
\t\t\t
\t\t</div>
\t\t<div class="page" id="page3">
\t\t\t
\t\t</div>
\t\t<div class="page" id="page4">
\t\t\t
\t\t</div>
\t\t<div class="page" id="page5">
\t\t\t
\t\t</div>
\t\t<div class="page" id="page6">
\t\t\t
\t\t</div>
\t\t<div class="page" id="back-cover">
\t\t\t
\t\t</div>
\t</body>
</html>
`;

// Get cursor position for boilerplate (inside front-cover div)
function getBoilerplateCursorPos(startPos = 0) {
	return startPos + ZINE_BOILERPLATE.indexOf('<div class="page" id="front-cover">') + 39;
}

// Shared print CSS for zine layout (used by both editor preview and exported viewer)
const ZINE_PRINT_CSS = `
	@page { size: 8.5in 11in portrait; margin: 0; }
	html, body { width: 8.5in; height: 11in; }
	body {
		display: grid !important;
		grid-template-columns: repeat(4, 2.75in);
		grid-template-rows: repeat(2, 4.25in);
		transform: rotate(90deg);
		transform-origin: center center;
		position: absolute;
		top: calc(50% - 4.25in);
		left: calc(50% - 5.5in);
		width: 11in;
		height: 8.5in;
	}
	#front-cover, #page1, #page2, #page3, #page4, #page5, #page6, #back-cover {
		display: block !important;
		width: 2.75in !important;
		height: 4.25in !important;
		padding: 0.2in;
		background: white;
		overflow: hidden;
		overflow-wrap: break-word;
		aspect-ratio: auto !important;
		box-shadow: none !important;
		transform: none;
	}
	#front-cover { grid-row: 2; grid-column: 2; }
	#page1 { grid-row: 2; grid-column: 3; }
	#page2 { grid-row: 2; grid-column: 4; }
	#page3 { grid-row: 1; grid-column: 4; transform: rotate(180deg); }
	#page4 { grid-row: 1; grid-column: 3; transform: rotate(180deg); }
	#page5 { grid-row: 1; grid-column: 2; transform: rotate(180deg); }
	#page6 { grid-row: 1; grid-column: 1; transform: rotate(180deg); }
	#back-cover { grid-row: 2; grid-column: 1; }
	.zine-nav, .zine-empty, .spread-nav, .iframe-fullscreen-toggle, .zine-spread-container { display: contents !important; }
	.zine-spread-container { transform: none !important; }
	a { color: black; }
`;

// Spread definitions
const SPREADS = [
	{ left: null, right: 'front-cover', label: 'Front Cover' },
	{ left: 'page1', right: 'page2', label: 'Pages 1-2' },
	{ left: 'page3', right: 'page4', label: 'Pages 3-4' },
	{ left: 'page5', right: 'page6', label: 'Pages 5-6' },
	{ left: 'back-cover', right: null, label: 'Back Cover' }
];

let currentSpread = 0;
let isFullscreen = false;
let showLineNumbers = false;
let enableLineWrapping = false;
let lineNumbersCompartment;
let lineWrappingCompartment;
let isEditorFocused = false;
let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

// Zine page dimensions in inches
const PAGE_WIDTH_IN = 2.75;
const PAGE_HEIGHT_IN = 4.25;

// Shared CSS for zine pages (used by both editor preview and exported viewer)
const ZINE_PAGE_CSS = `
	#front-cover, #page1, #page2, #page3, #page4, #page5, #page6, #back-cover {
		display: none;
		width: ${PAGE_WIDTH_IN}in;
		height: ${PAGE_HEIGHT_IN}in;
		flex-shrink: 0;
		padding: 0.2in;
		overflow: hidden;
		overflow-wrap: break-word;
	}
	.page {
		background: white;
	}
	.zine-spread-container {
		display: flex;
		transform-origin: center center;
	}
	#front-cover, #page2, #page4, #page6 {
		box-shadow: inset 4px 0 1.3px -3px rgba(0, 0, 0, 0.09), inset 8px 0 6px -6px rgba(0, 0, 0, 0.15);
	}
	#back-cover, #page1, #page3, #page5 {
		box-shadow: inset -4px 0 1.5px -3px rgba(0, 0, 0, 0.09), inset -8px 0 6px -6px rgba(0, 0, 0, 0.15);
	}
	.zine-empty {
		width: ${PAGE_WIDTH_IN}in;
		height: ${PAGE_HEIGHT_IN}in;
		flex-shrink: 0;
		border: 1px dashed #666;
	}
	.zine-empty:first-child {
		border-right: none;
	}
	.zine-empty:last-child {
		border-left: none;
	}
`;

// Generate CSS to show only the current spread
function generateSpreadCSS(spreadIndex) {
	const spread = SPREADS[spreadIndex];
	const visiblePages = [spread.left, spread.right].filter(Boolean);

	return `
		/* Base styles for all views */
		* { margin: 0; padding: 0; box-sizing: border-box; }

		/* Screen view: show spread at actual size, then scale to fit */
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

			.zine-spread-container {
				display: flex !important;
				position: relative;
			}

			#front-cover, #page1, #page2, #page3, #page4, #page5, #page6, #back-cover {
				display: none !important;
				width: ${PAGE_WIDTH_IN}in !important;
				height: ${PAGE_HEIGHT_IN}in !important;
			}

			/* Show visible pages */
			${visiblePages.map(id => `#${id}`).join(', ')} {
				display: block !important;
			}

			.zine-empty {
				display: block !important;
				width: ${PAGE_WIDTH_IN}in !important;
				height: ${PAGE_HEIGHT_IN}in !important;
			}
		}

		/* Print view: 8-page grid for mini-zine folding */
		@media print {
			${ZINE_PRINT_CSS}
		}
	`;
}

// Update spread indicator and button states
function updateSpreadIndicator() {
	const indicator = document.getElementById('spreadIndicator');
	const prevBtn = document.getElementById('prevSpread');
	const nextBtn = document.getElementById('nextSpread');

	indicator.textContent = SPREADS[currentSpread].label;
	prevBtn.disabled = currentSpread === 0;
	nextBtn.disabled = currentSpread === SPREADS.length - 1;
}

// Navigate between spreads
function navigateSpread(delta) {
	const newSpread = currentSpread + delta;
	if (newSpread >= 0 && newSpread < SPREADS.length) {
		currentSpread = newSpread;
		updateSpreadIndicator();
		updatePreview();
	}
}

// Fullscreen toggle
function toggleFullscreen() {
	isFullscreen = !isFullscreen;

	if (isFullscreen) {
		previewPane.classList.add('fullscreen');
		editorPane.classList.add('hidden');
		preview.style.height = window.innerHeight + 'px';
	} else {
		previewPane.classList.remove('fullscreen');
		editorPane.classList.remove('hidden');
		preview.style.height = '';
	}

	try {
		const toggleButton = preview.contentDocument.getElementById('fullscreenToggle');
		if (toggleButton) {
			toggleButton.title = isFullscreen ? 'Exit fullscreen' : 'Toggle fullscreen';
		}
	} catch (e) {}

	// Trigger resize after layout updates so scaleToFit() recalculates
	requestAnimationFrame(() => {
		try {
			preview.contentWindow.dispatchEvent(new Event('resize'));
		} catch (e) {}
	});
}

window.addEventListener('message', function(event) {
	if (event.data === 'toggleFullscreen') {
		toggleFullscreen();
	} else if (event.data === 'prevSpread') {
		navigateSpread(-1);
	} else if (event.data === 'nextSpread') {
		navigateSpread(1);
	}
});

function updatePreview() {
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

	// Inject spread CSS right after <head> so user styles come last and take precedence
	const spreadCSS = generateSpreadCSS(currentSpread);
	let processedCode = code;
	const headStartMatch = processedCode.match(/<head[^>]*>/i);
	if (headStartMatch) {
		const insertPos = processedCode.indexOf(headStartMatch[0]) + headStartMatch[0].length;
		processedCode = processedCode.slice(0, insertPos) +
			`<style id="zine-editor-spread-css">${spreadCSS}</style>` +
			processedCode.slice(insertPos);
	}

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

				// Add empty placeholder before right page if no left page
				if (!spread.left && spread.right) {
					const empty = doc.createElement('div');
					empty.className = 'zine-empty';
					container.appendChild(empty);
				}

				// Move visible pages into container
				const visiblePages = [spread.left, spread.right].filter(Boolean);
				visiblePages.forEach(id => {
					const page = doc.getElementById(id);
					if (page) container.appendChild(page);
				});

				// Add empty placeholder after left page if no right page
				if (spread.left && !spread.right) {
					const empty = doc.createElement('div');
					empty.className = 'zine-empty';
					container.appendChild(empty);
				}

				doc.body.appendChild(container);

				// Scale container to fit viewport
				const scaleToFit = () => {
					const vw = doc.documentElement.clientWidth;
					const vh = doc.documentElement.clientHeight;
					const spreadWidthPx = container.offsetWidth;
					const spreadHeightPx = container.offsetHeight;
					const scaleX = (vw - 40) / spreadWidthPx;
					const scaleY = (vh - 40) / spreadHeightPx;
					const scale = Math.min(scaleX, scaleY);
					container.style.transform = `scale(${scale})`;
				};
				scaleToFit();
				doc.defaultView.addEventListener('resize', scaleToFit);
			}

			// Add keyboard listener for arrow key navigation and print
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

function saveToStorage() {
	try {
		localStorage.setItem(storageKey, editorView.state.doc.toString());
	} catch (e) {
		console.warn('Could not save to localStorage:', e);
	}
}

async function loadContent() {
	let content = ZINE_BOILERPLATE;
	try {
		const saved = localStorage.getItem(storageKey);
		if (saved && saved.trim()) {
			content = saved;
		}
	} catch (e) {
		console.warn('Could not load from localStorage:', e);
	}
	return { content, isBoilerplate: content === ZINE_BOILERPLATE };
}

function loadEditorSettings() {
	try {
		showLineNumbers = localStorage.getItem('zine-editor-line-numbers') === 'true';
		enableLineWrapping = localStorage.getItem('zine-editor-line-wrapping') !== 'false';
	} catch (e) {
		showLineNumbers = false;
		enableLineWrapping = true;
	}
}

function saveEditorSetting(key, value) {
	try {
		localStorage.setItem(key, value.toString());
	} catch (e) {}
}

function toggleLineNumbers() {
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

function toggleLineWrapping() {
	enableLineWrapping = !enableLineWrapping;
	saveEditorSetting('zine-editor-line-wrapping', enableLineWrapping);
	const lineWrappingExtension = enableLineWrapping ? createLineWrappingExtension() : [];
	editorView.dispatch({
		effects: lineWrappingCompartment.reconfigure(lineWrappingExtension)
	});
}

// Generate standalone viewer CSS and JS (matches preview pane rendering)
function generateViewerCode() {
	const css = `
		* { margin: 0; padding: 0; box-sizing: border-box; }

		@media screen {
			html, body {
				height: 100% !important;
				overflow: hidden !important;
			}
			body {
				background: linear-gradient(to top, #2a2a2a, #3a3a3a) !important;
				display: flex !important;
				justify-content: center !important;
				align-items: center !important;
			}
			body > *:not(.zine-spread-container):not(.zine-nav) {
				display: none !important;
			}
			#front-cover, #page1, #page2, #page3, #page4, #page5, #page6, #back-cover {
				display: none;
				width: ${PAGE_WIDTH_IN}in !important;
				height: ${PAGE_HEIGHT_IN}in !important;
				flex-shrink: 0;
				padding: 0.2in;
				overflow: hidden;
				overflow-wrap: break-word;
			}
			.page {
				background: white;
			}
			.zine-spread-container {
				display: flex !important;
				transform-origin: center center;
				position: relative;
			}
			#front-cover, #page2, #page4, #page6 {
				box-shadow: inset 4px 0 1.3px -3px rgba(0, 0, 0, 0.09), inset 8px 0 6px -6px rgba(0, 0, 0, 0.15);
			}
			#back-cover, #page1, #page3, #page5 {
				box-shadow: inset -4px 0 1.5px -3px rgba(0, 0, 0, 0.09), inset -8px 0 6px -6px rgba(0, 0, 0, 0.15);
			}
			.zine-empty {
				width: ${PAGE_WIDTH_IN}in;
				height: ${PAGE_HEIGHT_IN}in;
				flex-shrink: 0;
				border: 1px dashed #666;
			}
			.zine-empty:first-child {
				border-right: none;
			}
			.zine-empty:last-child {
				border-left: none;
			}
			.zine-nav {
				position: fixed;
				bottom: 0;
				left: 0;
				right: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 16px;
				padding: 12px 20px;
				background: transparent;
			}
			.zine-nav button {
				background: rgba(255,255,255,0.15);
				color: white;
				border: none;
				border-radius: 50%;
				width: 36px;
				height: 36px;
				cursor: pointer;
				font-size: 18px;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.zine-nav button:hover:not(:disabled) { background: rgba(255,255,255,0.25); }
			.zine-nav button:disabled { opacity: 0.3; cursor: default; }
			.zine-nav span { color: white; font-size: 14px; min-width: 100px; text-align: center; font-family: system-ui, sans-serif; }
		}

		@media print {
			${ZINE_PRINT_CSS}
		}
	`;

	const js = `
		const SPREADS = [
			{ left: null, right: 'front-cover', label: 'Front Cover' },
			{ left: 'page1', right: 'page2', label: 'Pages 1–2' },
			{ left: 'page3', right: 'page4', label: 'Pages 3–4' },
			{ left: 'page5', right: 'page6', label: 'Pages 5–6' },
			{ left: 'back-cover', right: null, label: 'Back Cover' }
		];
		let currentSpread = 0;
		let container;

		function scaleToFit() {
			if (!container) return;
			const vw = document.documentElement.clientWidth;
			const vh = document.documentElement.clientHeight;
			const spreadWidthPx = container.offsetWidth;
			const spreadHeightPx = container.offsetHeight;
			if (spreadWidthPx === 0 || spreadHeightPx === 0) return;
			const scaleX = (vw - 40) / spreadWidthPx;
			const scaleY = (vh - 40) / spreadHeightPx;
			const scale = Math.min(scaleX, scaleY);
			container.style.transform = 'scale(' + scale + ')';
		}

		function showSpread(index) {
			const spread = SPREADS[index];
			const visible = [spread.left, spread.right].filter(Boolean);

			// Move existing pages back to body before clearing container
			const existingPages = container.querySelectorAll('#front-cover, #page1, #page2, #page3, #page4, #page5, #page6, #back-cover');
			existingPages.forEach(page => {
				page.style.display = 'none';
				document.body.appendChild(page);
			});

			container.innerHTML = '';

			if (!spread.left && spread.right) {
				const empty = document.createElement('div');
				empty.className = 'zine-empty';
				container.appendChild(empty);
			}

			visible.forEach(id => {
				const el = document.getElementById(id);
				if (el) {
					el.style.display = 'block';
					container.appendChild(el);
				}
			});

			if (spread.left && !spread.right) {
				const empty = document.createElement('div');
				empty.className = 'zine-empty';
				container.appendChild(empty);
			}

			document.getElementById('zine-indicator').textContent = spread.label;
			document.getElementById('zine-prev').disabled = index === 0;
			document.getElementById('zine-next').disabled = index === SPREADS.length - 1;
			scaleToFit();
		}

		function navigate(delta) {
			const newIndex = currentSpread + delta;
			if (newIndex >= 0 && newIndex < SPREADS.length) {
				currentSpread = newIndex;
				showSpread(currentSpread);
			}
		}

		document.addEventListener('DOMContentLoaded', () => {
			container = document.createElement('div');
			container.className = 'zine-spread-container';
			document.body.appendChild(container);

			const nav = document.createElement('div');
			nav.className = 'zine-nav';
			nav.innerHTML = '<button id="zine-prev" title="Previous spread">\\u2190</button><span id="zine-indicator"></span><button id="zine-next" title="Next spread">\\u2192</button>';
			document.body.appendChild(nav);

			document.getElementById('zine-prev').addEventListener('click', () => navigate(-1));
			document.getElementById('zine-next').addEventListener('click', () => navigate(1));

			document.addEventListener('keydown', e => {
				if (e.key === 'ArrowLeft') navigate(-1);
				else if (e.key === 'ArrowRight') navigate(1);
				else if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
					e.preventDefault();
					window.print();
				}
			});

			window.addEventListener('resize', scaleToFit);

			showSpread(0);
		});
	`;

	return { css, js };
}

// File operations
window.saveFile = function() {
	const blob = new Blob([editorView.state.doc.toString()], { type: 'text/html' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'my-zine.html';
	a.click();
	URL.revokeObjectURL(url);
};

window.saveFileWithViewer = function() {
	const code = editorView.state.doc.toString();
	const { css, js } = generateViewerCode();

	// Inject viewer CSS at START of head (so user styles take precedence for page content)
	// Inject viewer JS at END of head (needs to run after DOM is ready)
	let processedCode = code;
	const headStartMatch = processedCode.match(/<head[^>]*>/i);
	const headEndMatch = processedCode.match(/<\/head>/i);

	if (headStartMatch && headEndMatch) {
		// Insert CSS right after <head>
		const cssInsertPos = processedCode.indexOf(headStartMatch[0]) + headStartMatch[0].length;
		processedCode = processedCode.slice(0, cssInsertPos) +
			`\n<style id="zine-viewer-css">${css}</style>` +
			processedCode.slice(cssInsertPos);

		// Insert JS before </head> (recalculate position after CSS insertion)
		const newHeadEndMatch = processedCode.match(/<\/head>/i);
		const jsInsertPos = processedCode.indexOf(newHeadEndMatch[0]);
		processedCode = processedCode.slice(0, jsInsertPos) +
			`<script id="zine-viewer-js">${js}<\/script>\n` +
			processedCode.slice(jsInsertPos);
	} else {
		// No proper head found, wrap content
		processedCode = `<!DOCTYPE html>\n<html>\n<head>\n<style id="zine-viewer-css">${css}</style>\n<script id="zine-viewer-js">${js}<\/script>\n</head>\n<body>\n${code}\n</body>\n</html>`;
	}

	const blob = new Blob([processedCode], { type: 'text/html' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'my-zine.html';
	a.click();
	URL.revokeObjectURL(url);
};

window.loadFile = function() {
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
			saveToStorage();
			currentSpread = 0;
			updateSpreadIndicator();
			updatePreview();
		};
		reader.readAsText(file);
	};
	input.click();
};

// Initialize CodeMirror
async function initializeCodeMirror() {
	if (!window.CodeMirror) {
		setTimeout(initializeCodeMirror, 100);
		return;
	}

	const {EditorView, EditorState, Compartment, keymap, defaultKeymap, indentWithTab, html, githubDark, indentUnit, placeholder, undo, redo, history, closeBrackets, search, searchKeymap, closeSearchPanel, openSearchPanel, lineNumbers} = window.CodeMirror;

	const customPhrases = EditorState.phrases.of({
		"Find": "Find..."
	});

	const { content: savedContent, isBoilerplate } = await loadContent();
	loadEditorSettings();

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
				{key: "F1", run: () => { toggleLineNumbers(); return true; }},
				{key: "F2", run: () => { toggleLineWrapping(); return true; }},
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
			placeholder("Type \"<!>\" to insert zine outline..."),
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					clearTimeout(updateTimer);
					updateTimer = setTimeout(updatePreview, 600);
					saveToStorage();
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

	editorView = new EditorView({
		state: EditorState.create(stateConfig),
		parent: document.getElementById('editor')
	});

	if (isBoilerplate) {
		editorView.dispatch({
			selection: { anchor: getBoilerplateCursorPos() }
		});
	}

	// Initialize spread navigation
	document.getElementById('prevSpread').addEventListener('click', () => navigateSpread(-1));
	document.getElementById('nextSpread').addEventListener('click', () => navigateSpread(1));
	updateSpreadIndicator();

	// Initial preview
	updatePreview();

	// Track editor focus
	editorView.contentDOM.addEventListener('focus', () => { isEditorFocused = true; });
	editorView.contentDOM.addEventListener('blur', () => {
		isEditorFocused = false;
		if (isMobileDevice()) {
			exitMobileKeyboardMode();
		}
	});

	editorView.focus();

	// Keyboard shortcuts
	document.addEventListener('keydown', function(e) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
			e.preventDefault();
			closeSearchPanel(editorView) || openSearchPanel(editorView);
		}
		// Print the iframe content instead of the parent page
		if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
			e.preventDefault();
			try {
				preview.contentWindow.print();
			} catch (err) {
				window.print();
			}
		}
	});

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
}

// Mobile keyboard detection
function isMobileDevice() {
	return window.matchMedia("(pointer: coarse), (pointer: none)").matches;
}

function exitMobileKeyboardMode() {
	if (!document.body.classList.contains('mobile-keyboard-open')) return;

	editorPane.style.opacity = '0';
	document.body.classList.remove('mobile-keyboard-open');

	requestAnimationFrame(() => requestAnimationFrame(() => {
		if (editorView) {
			const pos = editorView.state.selection.main.head;
			const lineBlock = editorView.lineBlockAt(pos);
			const targetScroll = lineBlock.top - (editorView.dom.clientHeight / 2);
			editorView.scrollDOM.scrollTop = Math.max(0, targetScroll);
		}
		editorPane.style.opacity = '';
		updatePreview();
	}));
}

function updateViewportVariables() {
	const vv = window.visualViewport;
	if (vv) {
		document.documentElement.style.setProperty('--visual-viewport-height', `${vv.height}px`);
		document.documentElement.style.setProperty('--visual-viewport-offset-top', `${vv.offsetTop}px`);
	}
}

function handleViewportChange() {
	if (!isMobileDevice()) return;

	const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
	const heightDifference = initialViewportHeight - currentHeight;
	const isKeyboardOpen = heightDifference > 150;

	updateViewportVariables();

	if (isKeyboardOpen && isEditorFocused) {
		document.body.classList.add('mobile-keyboard-open');
	} else if (!isKeyboardOpen) {
		exitMobileKeyboardMode();
	}
}

if (window.visualViewport) {
	window.visualViewport.addEventListener('resize', handleViewportChange);
	window.visualViewport.addEventListener('scroll', updateViewportVariables);
} else {
	window.addEventListener('resize', handleViewportChange);
}

// Exit fullscreen when viewport is too short (matches CSS @media max-height: 200px)
window.addEventListener('resize', function() {
	if (isFullscreen && window.innerHeight <= 200) {
		toggleFullscreen();
	}
});

// Initialize
initializeCodeMirror();
