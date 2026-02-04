// Page flip animation state
let isAnimating = false;
let currentSpreadIndex = 0;
let pendingFlipQueue = [];
let bookContainer = null;

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
	bookContainer = book;

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
	updateBookPosition(0, false);
}

// Update the book container horizontal position based on spread
// Spreads 0 and 4 (single pages) should be centered, others at normal position
function updateBookPosition(spreadIndex, animated = true) {
	if (!bookContainer) {
		console.error('updateBookPosition: bookContainer is null!');
		return;
	}

	// Spread 0 (front cover): single right page, shift left to center
	// Spread 4 (back cover): single left page, shift right to center
	// Half page width = 1.375in
	let shiftAmount = '0in';
	if (spreadIndex === 0) {
		shiftAmount = '-1.375in';
	} else if (spreadIndex === 4) {
		shiftAmount = '1.375in';
	}

	const currentTransform = bookContainer.style.transform;
	const currentTransition = bookContainer.style.transition;
	console.log(`updateBookPosition(spread=${spreadIndex}, animated=${animated})`);
	console.log(`  Current transform: "${currentTransform}"`);
	console.log(`  Current transition: "${currentTransition}"`);
	console.log(`  Target: translateX(${shiftAmount})`);

	if (animated) {
		// Clear any existing transition first to ensure clean state
		bookContainer.style.transition = '';
		// Force a reflow
		bookContainer.offsetHeight;

		// Now set the transition for this animation
		bookContainer.style.transition = 'transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000)';
		console.log(`  Set transition, will animate in rAF`);

		// Use requestAnimationFrame to set transform (same as leaf flip animation)
		// This ensures both animations start in the same frame
		requestAnimationFrame(() => {
			console.log(`  rAF: Setting transform to translateX(${shiftAmount})`);
			bookContainer.style.transform = `translateX(${shiftAmount})`;
		});

		// Remove transition after animation completes
		setTimeout(() => {
			bookContainer.style.transition = '';
		}, 600);
	} else {
		bookContainer.style.transition = 'none';
		// For non-animated, use explicit translateX or none
		const newTransform = shiftAmount !== '0in' ? `translateX(${shiftAmount})` : 'translateX(0in)';
		console.log(`  Non-animated: Setting transform to ${newTransform}`);
		bookContainer.style.transform = newTransform;
	}
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

// Process next queued flip if any
function processNextFlip() {
	if (pendingFlipQueue.length === 0) {
		isAnimating = false;
		return;
	}

	const nextFlip = pendingFlipQueue.shift();
	// Use current spread index as fromSpread since we're now at a different position
	executePageFlip(currentSpreadIndex, nextFlip.toSpread, nextFlip.container, nextFlip.doc, nextFlip.onComplete);
}

// Execute a single page flip (internal function)
function executePageFlip(fromSpread, toSpread, container, doc, onComplete) {
	isAnimating = true;
	currentSpreadIndex = toSpread;

	console.log(`\n=== executePageFlip: ${fromSpread} → ${toSpread} ===`);

	// Update book position synchronously with the flip animation
	updateBookPosition(toSpread, true);

	const direction = toSpread > fromSpread ? 'forward' : 'backward';
	console.log(`Direction: ${direction}`);
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
			let cleanupCalled = false;
			const cleanup = () => {
				if (cleanupCalled) return;
				cleanupCalled = true;

				leafToFlip.dataset.state = 'open';
				leafToFlip.style.transition = '';
				// Set z-index for open state (lower than closed leaves)
				leafToFlip.style.zIndex = String(fromSpread + 1);
				if (onComplete) onComplete();
				leafToFlip.removeEventListener('transitionend', cleanup);
				clearTimeout(timeoutId);
				// Process next flip in queue
				processNextFlip();
			};
			leafToFlip.addEventListener('transitionend', cleanup);

			// Fallback timeout in case transitionend doesn't fire
			const timeoutId = setTimeout(cleanup, 800);
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
			let cleanupCalled = false;
			const cleanup = () => {
				if (cleanupCalled) return;
				cleanupCalled = true;

				leafToFlip.dataset.state = 'closed';
				leafToFlip.style.transition = '';
				// Set z-index for closed state (higher than open leaves)
				leafToFlip.style.zIndex = String(20 - toSpread);
				if (onComplete) onComplete();
				leafToFlip.removeEventListener('transitionend', cleanup);
				clearTimeout(timeoutId);
				// Process next flip in queue
				processNextFlip();
			};
			leafToFlip.addEventListener('transitionend', cleanup);

			// Fallback timeout in case transitionend doesn't fire
			const timeoutId = setTimeout(cleanup, 800);
		}
	}
}

// Animate page flip with input buffering
export function animatePageFlip(fromSpread, toSpread, container, doc, onComplete) {
	// If already animating, queue this flip request
	if (isAnimating) {
		// Check if there's already a queued flip to the same target - if so, skip this one
		// This prevents the queue from growing unnecessarily when users spam the same direction
		const lastQueued = pendingFlipQueue[pendingFlipQueue.length - 1];
		if (!lastQueued || lastQueued.toSpread !== toSpread) {
			pendingFlipQueue.push({ fromSpread, toSpread, container, doc, onComplete });
		}
		return;
	}

	// Start the flip immediately
	executePageFlip(fromSpread, toSpread, container, doc, onComplete);
}

// Set current spread without animation (for initial load)
export function setSpreadImmediate(spreadIndex, doc) {
	console.log(`\n=== setSpreadImmediate(${spreadIndex}) ===`);
	currentSpreadIndex = spreadIndex;
	updateLeafStates(spreadIndex, doc);
	updateBookPosition(spreadIndex, false);
}
