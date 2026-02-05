// Zine page dimensions in inches
export const PAGE_WIDTH_IN = 2.75;
export const PAGE_HEIGHT_IN = 4.25;
export const PAGE_PADDING_IN = 0.2;

// All page IDs for selectors
export const PAGE_IDS = ['front-cover', 'page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'back-cover'];
export const ALL_PAGES_SELECTOR = PAGE_IDS.map(id => `#${id}`).join(', ');
export const RIGHT_PAGES_SELECTOR = '#front-cover, #page2, #page4, #page6';
export const LEFT_PAGES_SELECTOR = '#back-cover, #page1, #page3, #page5';

// Spread definitions
export const SPREADS = [
	{ left: null, right: 'front-cover', label: 'Front Cover' },
	{ left: 'page1', right: 'page2', label: 'Pages 1-2' },
	{ left: 'page3', right: 'page4', label: 'Pages 3-4' },
	{ left: 'page5', right: 'page6', label: 'Pages 5-6' },
	{ left: 'back-cover', right: null, label: 'Back Cover' }
];

// Height of nav bar for layout calculations
export const NAV_HEIGHT = 60;

// Shared navigation button CSS (used by both editor spread-nav and exported viewer zine-nav)
export const NAV_BUTTON_CSS = `
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16px;
	padding: 12px 20px;
`;

export const NAV_BUTTON_STYLES = `
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
`;

// Zine HTML boilerplate template
export const ZINE_BOILERPLATE = `<!DOCTYPE html>
<html>
	<head>
		<style>
\t\t\t
		</style>
	</head>
	<body>
		<div class="page" id="front-cover">
\t\t\t
		</div>
		<div class="page" id="page1">
\t\t\t
		</div>
		<div class="page" id="page2">
\t\t\t
		</div>
		<div class="page" id="page3">
\t\t\t
		</div>
		<div class="page" id="page4">
\t\t\t
		</div>
		<div class="page" id="page5">
\t\t\t
		</div>
		<div class="page" id="page6">
\t\t\t
		</div>
		<div class="page" id="back-cover">
\t\t\t
		</div>
	</body>
</html>
`;

// Get cursor position for boilerplate (inside front-cover div)
export function getBoilerplateCursorPos(startPos = 0) {
	return startPos + ZINE_BOILERPLATE.indexOf('<div class="page" id="front-cover">') + 39;
}

// Storage key
export const STORAGE_KEY = 'zine-editor-content';
