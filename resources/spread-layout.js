import { SPREADS } from './constants.js';
import { createEmptyPlaceholder } from './html-utils.js';
import { initPageFlip, animatePageFlip, setSpreadImmediate, getIsAnimating } from './page-flip-animation.js';

// Track whether flip mode is enabled
let flipModeEnabled = false;
let currentFlipSpread = 0;

// Enable/disable flip animation mode
export function setFlipMode(enabled) {
	flipModeEnabled = enabled;
}

export function isFlipModeEnabled() {
	return flipModeEnabled;
}

// Common logic for displaying a spread (used by both editor preview and standalone viewer)
export function setupSpreadLayout(container, spread, doc, useFlipAnimation = false) {
	if (useFlipAnimation) {
		// Initialize flip animation on first call
		if (!container.querySelector('.zine-book')) {
			initPageFlip(container, doc);
		}
		return;
	}

	// Original non-animated behavior
	// Add empty placeholder before right page if no left page
	if (!spread.left && spread.right) {
		container.appendChild(createEmptyPlaceholder(doc));
	}

	// Move visible pages into container
	const visiblePages = [spread.left, spread.right].filter(Boolean);
	visiblePages.forEach(id => {
		const page = doc.getElementById(id);
		if (page) container.appendChild(page);
	});

	// Add empty placeholder after left page if no right page
	if (spread.left && !spread.right) {
		container.appendChild(createEmptyPlaceholder(doc));
	}
}

// Navigate to a spread with optional flip animation
export function navigateToSpread(container, spreadIndex, doc, useFlipAnimation = false, onComplete) {
	if (useFlipAnimation && container.querySelector('.zine-book')) {
		// Always call animatePageFlip - it now handles queueing internally
		animatePageFlip(currentFlipSpread, spreadIndex, container, doc, onComplete);
		currentFlipSpread = spreadIndex;
	} else {
		// Original non-animated behavior
		const spread = SPREADS[spreadIndex];
		container.innerHTML = '';
		setupSpreadLayout(container, spread, doc, false);
		if (onComplete) onComplete();
	}
}

// Scale spread container to fit viewport
export function scaleSpreadToFit(container, doc, bottomPadding = 0) {
	// Find the book container if in flip mode
	const bookContainer = container.querySelector('.zine-book') || container;

	const vw = doc.documentElement.clientWidth;
	const vh = doc.documentElement.clientHeight - bottomPadding;
	const spreadWidthPx = bookContainer.offsetWidth;
	const spreadHeightPx = bookContainer.offsetHeight;
	if (spreadWidthPx === 0 || spreadHeightPx === 0) return;
	const scaleX = (vw - 40) / spreadWidthPx;
	const scaleY = (vh - 40) / spreadHeightPx;
	const scale = Math.min(scaleX, scaleY);

	// Preserve any existing translateX from book positioning
	const currentTransform = bookContainer.style.transform || '';
	const translateMatch = currentTransform.match(/translateX\([^)]+\)/);
	const translateX = translateMatch ? translateMatch[0] : '';

	bookContainer.style.transform = translateX ? `scale(${scale}) ${translateX}` : `scale(${scale})`;
}
