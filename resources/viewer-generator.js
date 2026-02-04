import { PAGE_IDS, SPREADS, NAV_HEIGHT, NAV_BUTTON_CSS, NAV_BUTTON_STYLES } from './constants.js';
import { ZINE_PAGE_CSS, ZINE_PRINT_CSS, ZINE_FLIP_CSS } from './zine-styles.js';

// Generate standalone viewer CSS and JS (matches preview pane rendering)
export function generateViewerCode() {
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
				padding-bottom: ${NAV_HEIGHT}px !important;
			}
			body > *:not(.zine-spread-container):not(.zine-nav) {
				display: none !important;
			}
			${ZINE_PAGE_CSS}
			${ZINE_FLIP_CSS}

			/* Dynamic z-index based on leaf state */
			.zine-leaf[data-state="closed"][data-leaf-index="0"] { z-index: 14 !important; }
			.zine-leaf[data-state="closed"][data-leaf-index="1"] { z-index: 13 !important; }
			.zine-leaf[data-state="closed"][data-leaf-index="2"] { z-index: 12 !important; }
			.zine-leaf[data-state="closed"][data-leaf-index="3"] { z-index: 11 !important; }
			.zine-leaf[data-state="open"][data-leaf-index="0"] { z-index: 4 !important; }
			.zine-leaf[data-state="open"][data-leaf-index="1"] { z-index: 3 !important; }
			.zine-leaf[data-state="open"][data-leaf-index="2"] { z-index: 2 !important; }
			.zine-leaf[data-state="open"][data-leaf-index="3"] { z-index: 1 !important; }
			.zine-leaf[data-state="flipping"] { z-index: 20 !important; }

			.zine-spread-container {
				display: flex !important;
				position: relative;
			}
			.zine-nav {
				position: fixed;
				bottom: 0;
				left: 0;
				right: 0;
				height: ${NAV_HEIGHT}px;
				${NAV_BUTTON_CSS}
				background: transparent;
			}
			.zine-nav button {
				${NAV_BUTTON_STYLES}
			}
			.zine-nav button:hover:not(:disabled) { background: rgba(255,255,255,0.25); }
			.zine-nav button:disabled { opacity: 0.3; cursor: default; }
			.zine-nav span { color: white; font-size: 14px; min-width: 100px; text-align: center; font-family: monospace; }
		}

		@media print {
			${ZINE_PRINT_CSS}
		}

		/* Hide content when viewport is very short */
		@media screen and (max-height: 200px) {
			.zine-spread-container, .zine-nav {
				display: none !important;
			}
		}
	`;

	// Serialize SPREADS array for the viewer
	const spreadsJson = JSON.stringify(SPREADS);
	const pageIdsJson = JSON.stringify(PAGE_IDS);

	const js = `
		const SPREADS = ${spreadsJson};
		const PAGE_IDS = ${pageIdsJson};
		const NAV_HEIGHT = ${NAV_HEIGHT};
		let currentSpread = 0;
		let container;
		let isAnimating = false;
		const USE_FLIP_ANIMATION = true;

		// Page leaf structure (front and back of each physical page)
		const PAGE_LEAVES = [
			{ front: 'front-cover', back: 'page1' },
			{ front: 'page2', back: 'page3' },
			{ front: 'page4', back: 'page5' },
			{ front: 'page6', back: 'back-cover' }
		];

		function easeInOutCubic(t) {
			return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
		}

		function scaleToFit() {
			if (!container) return;
			const bookContainer = container.querySelector('.zine-book') || container;
			const vw = document.documentElement.clientWidth;
			const vh = document.documentElement.clientHeight - NAV_HEIGHT;
			const spreadWidthPx = bookContainer.offsetWidth;
			const spreadHeightPx = bookContainer.offsetHeight;
			if (spreadWidthPx === 0 || spreadHeightPx === 0) return;
			const scaleX = (vw - 40) / spreadWidthPx;
			const scaleY = (vh - 40) / spreadHeightPx;
			const scale = Math.min(scaleX, scaleY);
			bookContainer.style.zoom = scale;
			bookContainer.dataset.currentZoom = scale;
		}

		function updateBookPosition(spreadIndex, animated) {
			const bookContainer = container.querySelector('.zine-book');
			if (!bookContainer) return;

			// Spread 0 (front cover): single right page, shift left to center
			// Spread 4 (back cover): single left page, shift right to center
			// Half page width = 1.375in
			let shiftAmount = '0in';
			if (spreadIndex === 0) {
				shiftAmount = '-1.375in';
			} else if (spreadIndex === 4) {
				shiftAmount = '1.375in';
			}

			if (animated) {
				// Clear any existing transition first to ensure clean state
				bookContainer.style.transition = '';
				// Force a reflow
				bookContainer.offsetHeight;

				// Now set the transition for this animation
				bookContainer.style.transition = 'transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000)';

				// Use requestAnimationFrame to set transform (same as leaf flip animation)
				// This ensures both animations start in the same frame
				requestAnimationFrame(function() {
					bookContainer.style.transform = 'translateX(' + shiftAmount + ')';
				});

				// Remove transition after animation completes
				setTimeout(function() {
					bookContainer.style.transition = '';
				}, 600);
			} else {
				bookContainer.style.transition = 'none';
				// For non-animated, use explicit translateX
				bookContainer.style.transform = shiftAmount !== '0in' ? 'translateX(' + shiftAmount + ')' : 'translateX(0in)';
			}
		}

		function initFlipMode() {
			const book = document.createElement('div');
			book.className = 'zine-book';

			// Create all leaves
			PAGE_LEAVES.forEach((leaf, index) => {
				const leafEl = document.createElement('div');
				leafEl.className = 'zine-leaf';
				leafEl.dataset.leafIndex = index;
				leafEl.dataset.state = 'closed';
				leafEl.style.zIndex = String(20 - index); // Initial z-index for closed state

				const frontSide = document.createElement('div');
				frontSide.className = 'zine-leaf-front';
				const frontPage = document.getElementById(leaf.front);
				if (frontPage) frontSide.appendChild(frontPage.cloneNode(true));

				const backSide = document.createElement('div');
				backSide.className = 'zine-leaf-back';
				const backPage = document.getElementById(leaf.back);
				if (backPage) backSide.appendChild(backPage.cloneNode(true));

				leafEl.appendChild(frontSide);
				leafEl.appendChild(backSide);
				book.appendChild(leafEl);
			});

			container.appendChild(book);
		}

		function animateFlip(fromSpread, toSpread, onComplete) {
			if (isAnimating) return;
			isAnimating = true;

			// Update book position synchronously with the flip animation
			updateBookPosition(toSpread, true);

			const direction = toSpread > fromSpread ? 'forward' : 'backward';
			const leaves = document.querySelectorAll('.zine-leaf');

			if (direction === 'forward') {
				const leafToFlip = leaves[fromSpread];
				if (leafToFlip) {
					leafToFlip.dataset.state = 'flipping';
					leafToFlip.style.zIndex = '100';
					const startTime = performance.now();
					const duration = 600;

					function animate(currentTime) {
						const elapsed = currentTime - startTime;
						const progress = Math.min(elapsed / duration, 1);
						const eased = easeInOutCubic(progress);
						const rotation = eased * -180;
						leafToFlip.style.transform = 'rotateY(' + rotation + 'deg)';

						if (progress < 1) {
							requestAnimationFrame(animate);
						} else {
							leafToFlip.dataset.state = 'open';
							leafToFlip.style.zIndex = String(fromSpread + 1);
							isAnimating = false;
							if (onComplete) onComplete();
						}
					}
					requestAnimationFrame(animate);
				}
			} else {
				const leafToFlip = leaves[toSpread];
				if (leafToFlip) {
					leafToFlip.dataset.state = 'flipping';
					leafToFlip.style.zIndex = '100';
					const startTime = performance.now();
					const duration = 600;

					function animate(currentTime) {
						const elapsed = currentTime - startTime;
						const progress = Math.min(elapsed / duration, 1);
						const eased = easeInOutCubic(progress);
						const rotation = -180 + (eased * 180);
						leafToFlip.style.transform = 'rotateY(' + rotation + 'deg)';

						if (progress < 1) {
							requestAnimationFrame(animate);
						} else {
							leafToFlip.dataset.state = 'closed';
							leafToFlip.style.zIndex = String(20 - toSpread);
							isAnimating = false;
							if (onComplete) onComplete();
						}
					}
					requestAnimationFrame(animate);
				}
			}
		}

		function showSpread(index, animated) {
			const spread = SPREADS[index];

			if (USE_FLIP_ANIMATION && animated && container.querySelector('.zine-book')) {
				animateFlip(currentSpread, index, () => {
					document.getElementById('zine-indicator').textContent = spread.label;
					document.getElementById('zine-prev').disabled = index === 0;
					document.getElementById('zine-next').disabled = index === SPREADS.length - 1;
				});
				return;
			}

			// Non-animated or initial setup
			const visible = [spread.left, spread.right].filter(Boolean);
			PAGE_IDS.forEach(id => {
				const page = document.getElementById(id);
				if (page) {
					page.style.display = 'none';
					document.body.appendChild(page);
				}
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
				const oldSpread = currentSpread;
				currentSpread = newIndex;
				showSpread(currentSpread, true);
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
				else if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'e')) {
					e.preventDefault();
					// Re-download this viewer file (clean version without dynamic elements)
					// Move pages back to body and remove dynamic elements temporarily
					PAGE_IDS.forEach(id => {
						const page = document.getElementById(id);
						if (page) {
							page.style.display = '';
							document.body.appendChild(page);
						}
					});
					const tempContainer = document.querySelector('.zine-spread-container');
					const tempNav = document.querySelector('.zine-nav');
					if (tempContainer) tempContainer.remove();
					if (tempNav) tempNav.remove();

					const html = '<!DOCTYPE html>' + document.documentElement.outerHTML;

					// Restore dynamic elements
					const newContainer = document.createElement('div');
					newContainer.className = 'zine-spread-container';
					document.body.appendChild(newContainer);
					container = newContainer;

					const newNav = document.createElement('div');
					newNav.className = 'zine-nav';
					newNav.innerHTML = '<button id="zine-prev" title="Previous spread">\\u2190</button><span id="zine-indicator"></span><button id="zine-next" title="Next spread">\\u2192</button>';
					document.body.appendChild(newNav);
					document.getElementById('zine-prev').addEventListener('click', () => navigate(-1));
					document.getElementById('zine-next').addEventListener('click', () => navigate(1));

					if (USE_FLIP_ANIMATION) {
						initFlipMode();
						const leaves = document.querySelectorAll('.zine-leaf');
						leaves.forEach((leaf, index) => {
							if (index < currentSpread) {
								leaf.dataset.state = 'open';
								leaf.style.transform = 'rotateY(-180deg)';
								leaf.style.zIndex = String(index + 1);
							}
						});
						scaleToFit();
						updateBookPosition(currentSpread, false);
					} else {
						showSpread(currentSpread, false);
					}

					const blob = new Blob([html], { type: 'text/html' });
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = 'my-zine.html';
					a.click();
					URL.revokeObjectURL(url);
				}
			});

			window.addEventListener('resize', function() {
				scaleToFit();
				if (USE_FLIP_ANIMATION) {
					updateBookPosition(currentSpread, false);
				}
			});

			// Initialize flip mode
			if (USE_FLIP_ANIMATION) {
				initFlipMode();
				document.getElementById('zine-indicator').textContent = SPREADS[0].label;
				document.getElementById('zine-prev').disabled = true;
				document.getElementById('zine-next').disabled = false;
				scaleToFit();
				updateBookPosition(0, false);
			} else {
				showSpread(0, false);
			}
		});
	`;

	return { css, js };
}
