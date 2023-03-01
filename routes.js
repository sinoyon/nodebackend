/**
 * Main application routes
 */

"use strict";

import path from 'path';
import { auth } from './config/auth';
import * as socketController from './config/socketio';
import * as emailController from './config/ses';

import * as seeder from './config/seed';

export default (app) => {

    app.prefix('/api',  route => {
        route.use('/crawling', require('./api/crawling'));
        route.use('/users', require('./api/user'));
        route.use('/chat', auth(), require('./api/chat'));
        route.use('/messages', auth(), require('./api/message'));
        route.use('/notifications', auth(), require('./api/notification'));
        route.use('/wallets', auth(), require('./api/wallet'));
        route.post('/send-msg', socketController.sendMessage);
        route.post('/send-email', emailController.sendEmail);
        route.post('/seed', seeder.start);
        route.get('/sitemap.xml', (req, res) => {
            res.sendFile(path.resolve(`${__dirname + "/sitemap.xml"}`));
        });
        // route.get('/noindex-sitemap.xml', (req, res) => {
        //     res.sendFile(path.resolve(`${__dirname + "/noindex-sitemap.xml"}`));
        // })

    })
}