// Shared utility helpers for the app
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Safely parse JSON from a string, returning a fallback on error
export const safeParseJSON = (str, fallback = null) => {
	try {
		return JSON.parse(str);
	} catch (e) {
		return fallback;
	}
};

// Simple HTML escape to reduce XSS risk when inserting user content via innerHTML
export const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
}[c]));
// Create an icon element safely
export const createIconElement = (icon) => {
	const span = document.createElement('span');
	span.className = 'icon';
	// Icons in constants are small emoji strings; insert as textContent to avoid HTML parsing
	span.textContent = icon == null ? '' : String(icon);
	return span;
};
