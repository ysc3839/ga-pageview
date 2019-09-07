const express = require('express');
const api = require('ga-pageview');
const config = require('./config.json');

module.exports = express().use(api(config));
