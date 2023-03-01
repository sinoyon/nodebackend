/**
 * Main application file
 */

"use strict";

import express from 'express';
import mongoose from 'mongoose';

mongoose.Promise = require('bluebird');

import config from './config/environment';
import http from 'http';
import expressConfig from './config/express';
import registerRoutes from './routes';
import { initSocket } from './config/socketio';

import * as crawlingController from './api/crawling/crawling.controller';

express.application.prefix = express.Router.prefix = function (path, configure) {
    var router = express.Router();
    this.use(path, router);
    configure(router);
    return router;
};

global.gbl_sockets = [];

mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on( 'error',  err => {
    console.error(`MongoDB connection message: ${err}`);
    process.exit(-1);
});

if (config.seedDB) {
    require('./config/seed');
}


var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server, {
    path: '/api/socket.io',
    cors: true
});

global.gbl_io = io;

expressConfig(app);
registerRoutes(app);
initSocket();



(function () {
    app.serverHandle = server.listen(config.port, config.ip, () => {
        console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
        crawlingController.generateSitemap();
        // crawlingController.generateNoIndexSitemap();
    });
})();

exports = module.exports = app;
