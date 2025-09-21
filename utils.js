/**
 * Clamps a value between a minimum and maximum value.
 * @param {number} v The value to clamp.
 * @param {number} a The minimum value.
 * @param {number} b The maximum value.
 * @returns {number} The clamped value.
 */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * Safely parses JSON from a string, returning a fallback on error.
 * @param {string} str The JSON string to parse.
 * @param {*} [fallback=null] The fallback value to return on error.
 * @returns {*} The parsed object or the fallback value.
 */
export const safeParseJSON = (str, fallback = null) => {
	try {
		return JSON.parse(str);
	} catch (e) {
		return fallback;
	}
};

/**
 * Simple HTML escape to reduce XSS risk when inserting user content via innerHTML.
 * @param {string} s The string to escape.
 * @returns {string} The escaped string.
 */
export const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
}[c]));

/**
 * Create an icon element safely.
 * @param {string} icon The icon to create.
 * @returns {HTMLElement} The icon element.
 */
export const createIconElement = (icon) => {
	const span = document.createElement('span');
	span.className = 'icon';
	// Icons in constants are small emoji strings; insert as textContent to avoid HTML parsing
	span.textContent = icon == null ? '' : String(icon);
	return span;
};