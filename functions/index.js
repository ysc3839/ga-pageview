const functions = require('firebase-functions');
const api = require('ga-pageview');
const config = require('./config.json');

exports.ga_pageview = functions.https.onRequest(api(config));
