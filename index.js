'use strict';

var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

require('babel-register');

exports = module.exports = require('./app');