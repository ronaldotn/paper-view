const { DEBUG, PDF_SETTINGS } = require('./constants');
global.DEBUG = DEBUG;
global.PDF_SETTINGS = PDF_SETTINGS;
console.log('setupGlobals loaded, DEBUG =', DEBUG);
