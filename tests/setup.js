// Mock browser APIs not provided by jsdom
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

if (typeof window === 'undefined') {
	global.window = global;
}
