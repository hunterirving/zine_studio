let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

// Mobile keyboard detection
export function isMobileDevice() {
	return window.matchMedia("(pointer: coarse), (pointer: none)").matches;
}

export function exitMobileKeyboardMode(editorView, updatePreviewCallback) {
	const editorPane = document.querySelector('.editor-pane');
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
		updatePreviewCallback();
	}));
}

function updateViewportVariables() {
	const vv = window.visualViewport;
	if (vv) {
		document.documentElement.style.setProperty('--visual-viewport-height', `${vv.height}px`);
		document.documentElement.style.setProperty('--visual-viewport-offset-top', `${vv.offsetTop}px`);
	}
}

function handleViewportChange(isEditorFocused, exitCallback) {
	if (!isMobileDevice()) return;

	const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
	const heightDifference = initialViewportHeight - currentHeight;
	const isKeyboardOpen = heightDifference > 150;

	updateViewportVariables();

	if (isKeyboardOpen && isEditorFocused) {
		document.body.classList.add('mobile-keyboard-open');
	} else if (!isKeyboardOpen) {
		exitCallback();
	}
}

export function initializeMobileKeyboard(getIsEditorFocused, exitCallback) {
	const handleChange = () => handleViewportChange(getIsEditorFocused(), exitCallback);

	if (window.visualViewport) {
		window.visualViewport.addEventListener('resize', handleChange);
		window.visualViewport.addEventListener('scroll', updateViewportVariables);
	} else {
		window.addEventListener('resize', handleChange);
	}
}
