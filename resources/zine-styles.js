import { PAGE_WIDTH_IN, PAGE_HEIGHT_IN, PAGE_PADDING_IN, ALL_PAGES_SELECTOR, RIGHT_PAGES_SELECTOR, LEFT_PAGES_SELECTOR, SPREADS } from './constants.js';

// Shared print CSS for zine layout (used by both editor preview and exported viewer)
export const ZINE_PRINT_CSS = `
	@page { size: 8.5in 11in portrait; margin: 0; }
	html, body { width: 8.5in; height: 11in; }
	body {
		display: grid !important;
		grid-template-columns: repeat(4, ${PAGE_WIDTH_IN}in);
		grid-template-rows: repeat(2, ${PAGE_HEIGHT_IN}in);
		transform: rotate(90deg);
		transform-origin: center center;
		position: absolute;
		top: calc(50% - ${PAGE_HEIGHT_IN}in);
		left: calc(50% - 5.5in);
		width: 11in;
		height: 8.5in;
	}
	${ALL_PAGES_SELECTOR} {
		display: block !important;
		width: ${PAGE_WIDTH_IN}in !important;
		height: ${PAGE_HEIGHT_IN}in !important;
		padding: ${PAGE_PADDING_IN}in;
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

// CSS for 3D page flip animation
export const ZINE_FLIP_CSS = `
	.zine-book {
		position: relative;
		width: ${PAGE_WIDTH_IN * 2}in;
		height: ${PAGE_HEIGHT_IN}in;
		perspective: 2000px;
		transform-style: preserve-3d;
		transform-origin: center center;
	}

	.zine-leaf {
		position: absolute;
		width: ${PAGE_WIDTH_IN}in;
		height: ${PAGE_HEIGHT_IN}in;
		left: ${PAGE_WIDTH_IN}in;
		top: 0;
		transform-origin: left center;
		transform-style: preserve-3d;
		transition: none;
	}

	/* When flipping, use high z-index so it's on top during animation */
	.zine-leaf[data-state="flipping"] {
		z-index: 20 !important;
		transition: none;
	}

	.zine-leaf-front,
	.zine-leaf-back {
		position: absolute;
		width: 100%;
		height: 100%;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	.zine-leaf-front {
		transform: rotateY(0deg);
		z-index: 2;
	}

	.zine-leaf-back {
		transform: rotateY(180deg);
		z-index: 1;
	}

	.zine-leaf-front .page,
	.zine-leaf-back .page {
		width: 100%;
		height: 100%;
		display: block !important;
	}

	/* Base pages - shown beneath the flipping leaves */
	.zine-base-pages {
		position: absolute;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 0;
	}

	.zine-base-page {
		position: absolute;
		width: ${PAGE_WIDTH_IN}in;
		height: ${PAGE_HEIGHT_IN}in;
		display: none !important;
		z-index: 0;
	}

	/* Position base pages */
	.zine-base-page[data-page-id="front-cover"],
	.zine-base-page[data-page-id="page2"],
	.zine-base-page[data-page-id="page4"],
	.zine-base-page[data-page-id="page6"] {
		right: 0;
	}

	.zine-base-page[data-page-id="page1"],
	.zine-base-page[data-page-id="page3"],
	.zine-base-page[data-page-id="page5"],
	.zine-base-page[data-page-id="back-cover"] {
		left: 0;
	}
`;

// Shared CSS for zine pages (used by both editor preview and exported viewer)
export const ZINE_PAGE_CSS = `
	${ALL_PAGES_SELECTOR} {
		display: none;
		width: ${PAGE_WIDTH_IN}in;
		height: ${PAGE_HEIGHT_IN}in;
		flex-shrink: 0;
		padding: ${PAGE_PADDING_IN}in;
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
	${RIGHT_PAGES_SELECTOR} {
		box-shadow: inset 4px 0 1.3px -3px rgba(0, 0, 0, 0.09), inset 8px 0 6px -6px rgba(0, 0, 0, 0.15);
	}
	${LEFT_PAGES_SELECTOR} {
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
export function generateSpreadCSS(spreadIndex) {
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

			${ALL_PAGES_SELECTOR} {
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
