import { STORAGE_KEY, ZINE_BOILERPLATE } from './constants.js';

export function saveToStorage(content) {
	try {
		localStorage.setItem(STORAGE_KEY, content);
	} catch (e) {
		console.warn('Could not save to localStorage:', e);
	}
}

export async function loadContent() {
	let content = ZINE_BOILERPLATE;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved && saved.trim()) {
			content = saved;
		}
	} catch (e) {
		console.warn('Could not load from localStorage:', e);
	}
	return { content, isBoilerplate: content === ZINE_BOILERPLATE };
}

export function loadEditorSettings() {
	try {
		const showLineNumbers = localStorage.getItem('zine-editor-line-numbers') === 'true';
		const enableLineWrapping = localStorage.getItem('zine-editor-line-wrapping') !== 'false';
		return { showLineNumbers, enableLineWrapping };
	} catch (e) {
		return { showLineNumbers: false, enableLineWrapping: true };
	}
}

export function saveEditorSetting(key, value) {
	try {
		localStorage.setItem(key, value.toString());
	} catch (e) {}
}
