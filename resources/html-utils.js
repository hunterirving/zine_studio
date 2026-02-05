// Insert content right after <head> tag in HTML string
export function insertAfterHead(html, content) {
	const headMatch = html.match(/<head[^>]*>/i);
	if (headMatch) {
		const insertPos = html.indexOf(headMatch[0]) + headMatch[0].length;
		return html.slice(0, insertPos) + content + html.slice(insertPos);
	}
	return html;
}

// Extract title and favicon from user's HTML
export function extractTitleAndFavicon(htmlCode) {
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

export function updateMainPageTitleAndFavicon(title, favicon) {
	if (title) {
		document.title = title;
	} else {
		document.title = 'zine workshop';
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

// Create an empty placeholder div for single-page spreads
export function createEmptyPlaceholder(doc) {
	const empty = doc.createElement('div');
	empty.className = 'zine-empty';
	return empty;
}
