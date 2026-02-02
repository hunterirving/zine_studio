// Page flip animation state
let isAnimating = false;
let currentSpreadIndex = 0;

// Get animation state
export function getIsAnimating() {
	return isAnimating;
}

// Page structure for flip animation
// Each "leaf" has a front and back side
// front-cover/page1 are on opposite sides of the same leaf
// page2/page3 are on opposite sides of the next leaf, etc.
const PAGE_LEAVES = [
	{ front: 'front-cover', back: 'page1' },      // Leaf 0
	{ front: 'page2', back: 'page3' },            // Leaf 1
	{ front: 'page4', back: 'page5' },            // Leaf 2
	{ front: 'page6', back: 'back-cover' }        // Leaf 3
];

// Initialize the 3D page flip system
export function initPageFlip(container, doc) {
	currentSpreadIndex = 0;

	// Create the book structure
	const book = doc.createElement('div');
	book.className = 'zine-book';

	// Create all leaves (page pairs)
	PAGE_LEAVES.forEach((leaf, index) => {
		const leafEl = doc.createElement('div');
		leafEl.className = 'zine-leaf';
		leafEl.dataset.leafIndex = index;
		leafEl.dataset.state = 'closed'; // closed, flipping, open

		// Front side of the leaf
		const frontSide = doc.createElement('div');
		frontSide.className = 'zine-leaf-front';
		const frontPage = doc.getElementById(leaf.front);
		if (frontPage) {
			frontSide.appendChild(frontPage.cloneNode(true));
		}

		// Back side of the leaf
		const backSide = doc.createElement('div');
		backSide.className = 'zine-leaf-back';
		const backPage = doc.getElementById(leaf.back);
		if (backPage) {
			backSide.appendChild(backPage.cloneNode(true));
		}

		leafEl.appendChild(frontSide);
		leafEl.appendChild(backSide);
		book.appendChild(leafEl);
	});

	container.appendChild(book);

	// Hide original pages in body
	const originalPages = doc.querySelectorAll('.page:not(.zine-base-page)');
	originalPages.forEach(page => {
		page.style.display = 'none';
	});

	// Set initial state - all leaves closed, showing front cover
	updateLeafStates(0, doc);
}

// Update which leaves are open/closed based on current spread
function updateLeafStates(spreadIndex, doc) {
	const leaves = doc.querySelectorAll('.zine-leaf');

	leaves.forEach((leaf, index) => {
		// Spread 0 = front cover (no leaves flipped)
		// Spread 1 = pages 1-2 (leaf 0 flipped)
		// Spread 2 = pages 3-4 (leaves 0-1 flipped)
		// Spread 3 = pages 5-6 (leaves 0-2 flipped)
		// Spread 4 = back cover (all leaves flipped)

		if (index < spreadIndex) {
			// This leaf should be flipped to the left (showing back)
			leaf.dataset.state = 'open';
			leaf.style.transform = 'rotateY(-180deg)';
			// Open leaves on left have lower z-index
			leaf.style.zIndex = String(index + 1);
		} else {
			// This leaf should be closed (on the right, showing front)
			leaf.dataset.state = 'closed';
			leaf.style.transform = 'rotateY(0deg)';
			// Closed leaves stack with first on top
			leaf.style.zIndex = String(20 - index);
		}
	});

}

// Animate page flip
export function animatePageFlip(fromSpread, toSpread, container, doc, onComplete) {
	if (isAnimating) return;

	isAnimating = true;
	currentSpreadIndex = toSpread;

	const direction = toSpread > fromSpread ? 'forward' : 'backward';
	const leaves = doc.querySelectorAll('.zine-leaf');

	if (direction === 'forward') {
		// Flipping forward (right to left)
		const leafToFlip = leaves[fromSpread];
		if (leafToFlip) {
			leafToFlip.dataset.state = 'flipping';
			leafToFlip.style.zIndex = '100'; // Put it on top during flip

			// Enable transition
			leafToFlip.style.transition = 'transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000)';

			// Trigger the flip
			requestAnimationFrame(() => {
				leafToFlip.style.transform = 'rotateY(-180deg)';
			});

			// Clean up after animation
			const cleanup = () => {
				leafToFlip.dataset.state = 'open';
				leafToFlip.style.transition = '';
				// Set z-index for open state (lower than closed leaves)
				leafToFlip.style.zIndex = String(fromSpread + 1);
				isAnimating = false;
				if (onComplete) onComplete();
				leafToFlip.removeEventListener('transitionend', cleanup);
			};
			leafToFlip.addEventListener('transitionend', cleanup);
		}
	} else {
		// Flipping backward (left to right)
		const leafToFlip = leaves[toSpread];
		if (leafToFlip) {
			leafToFlip.dataset.state = 'flipping';
			leafToFlip.style.zIndex = '100'; // Put it on top during flip

			// Enable transition
			leafToFlip.style.transition = 'transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000)';

			// Trigger the flip
			requestAnimationFrame(() => {
				leafToFlip.style.transform = 'rotateY(0deg)';
			});

			// Clean up after animation
			const cleanup = () => {
				leafToFlip.dataset.state = 'closed';
				leafToFlip.style.transition = '';
				// Set z-index for closed state (higher than open leaves)
				leafToFlip.style.zIndex = String(20 - toSpread);
				isAnimating = false;
				if (onComplete) onComplete();
				leafToFlip.removeEventListener('transitionend', cleanup);
			};
			leafToFlip.addEventListener('transitionend', cleanup);
		}
	}
}

// Set current spread without animation (for initial load)
export function setSpreadImmediate(spreadIndex, doc) {
	currentSpreadIndex = spreadIndex;
	updateLeafStates(spreadIndex, doc);
}
