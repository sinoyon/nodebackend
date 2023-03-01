'use strict';

import { User } from '../user/user.model';
import Notification from './notification.model';
import QueryModel from '../utils/query';

import config from '../../config/environment';
import { each } from 'lodash';
const OneSignal = require('onesignal-node');
var onesignalClient = new OneSignal.Client(config.onesignalAppId, config.onesignalAppKey);


export async function get(req, res) {
    const payload = req.body;
    const query = new QueryModel(payload.filter, payload.sort, payload.page, payload.size);
    try {
        var notifications = await Notification.find(query.filter, null, { skip: (query.page - 1) * query.size , limit: query.size, }).sort(query.sort)
        var totalCount = await Notification.countDocuments(query.filter);
        return res.send({
            items: notifications,
            totalCount
        });
    } catch (error) {
        return res.status(422).json(error);
    }
}
export async function create(req, res) {

    const {userIds, type, data} = req.body;
    try {
        
        const notification = await createNotification(userIds, type, data);

        return res.send(notification);
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

export async function destroyByIds(req, res) {

    const payload = req.body;
    try {
        if (payload.ids && payload.ids.length > 0) {
            await Notification.deleteMany({_id: { $in: payload.ids}});
            return res.send({
                success: true
            });
        }
    } catch (error) {
        console.log(error)
    }
    return res.status(422).json(error);
}

export async function markAsRead(req, res) {

    const { ids } = req.body;
    const userId = req.user.id;
    try {

        if (!ids || ids.length == 0) throw '';

        await Notification.updateMany({readBy: {$nin: [userId]}, _id: { $in: ids}}, { $push: { readBy: userId }});

        res.send({ success: true});
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

export async function sendNotification(to, data) {

    const socket_iter = gbl_sockets.find( el => el.target.toString() === to.toString());
    if (socket_iter) {
        socket_iter.nsp.emit('NOTIFICATION', data);
    }
}

export async function createNotification(userIds, type, data) {

    try {
        const newNotification = new Notification({
            data: data,
            type: type,
            users: userIds
        });
        const notification = await newNotification.save();

        for (var i = 0 ; i < userIds.length; i++) {
            try {
                await sendNotification(userIds[i],
                    {
                        _id: notification._id,
                        type: type,
                        data: data,
                        createdAt: new Date()
                    }
                );
            } catch (error) {
            }
        }
        return notification;
    } catch (error) {
        console.log(error)
    }
}

export async function createAppNotification(userIds, type, data) {

    try {
        const deviceIds = (await User.find({_id: { $in: userIds}}, 'deviceId').lean()).map( el => el.deviceId).filter( el => el);
        const n_data = generateAppNotificationData(type, data);
        const notificationParam = {
            contents: {
                it: n_data.content,
                en: n_data.content
            },
            data: n_data,
            small_icon: 'ic_stat_onesignal_default',
            large_icon: n_data.pic,
            include_player_ids: deviceIds
        };
        await onesignalClient.createNotification(notificationParam);
    } catch (error) {
        console.log(error)
    }
   
}

export async function getUnread(req, res) {
    const userId = req.user._id
    try {
        const notifications = await Notification.find({ readBy: { $nin: [userId]}, users: { $in: [userId]}});
        return res.send(notifications);
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

function generateAppNotificationData(type, param) {

    let tmpl = '';

    switch(type) {
        case 'NEW_CAMPAIGN_FOR_CATEGORY':
            tmpl = 
                `"{categoryName}": è disponibile un NUOVO INVESTIMENTO`;
            break;
        case 'CAMPAIGN_MAX_GOAL_ALMOST_REACHED':
            tmpl = 
                `"{campaignName}" ha quasi raggiunto l'OBIETTIVO MASSIMO`;
            break;
        case 'CAMPAIGN_MIN_GOAL_REACHED':
            tmpl = 
                `"{campaignName}" ha raggiunto l'OBIETTIVO MINIMO`;
            break;
        case 'CAMPAIGN_WILL_CLOSE_IN':
            tmpl = 
                `"{campaignName}" TERMINA a breve`;
            break;
        case 'CAMPAIGN_AVAILABLE_FROM':
            tmpl = 
                `"{campaignName}" disponibile a breve`;
            break;
        case 'CAMPAIGN_AVAILABLE':
            tmpl = 
                `"{campaignName}" è ora DISPONIBILE`;
            break;
        case 'CAMPAIGN_NOW_CLOSED_FUNDED':
            tmpl = 
                `"{campaignName}": è ora CHISUA`;
            break;
        case 'CAMPAIGN_NOW_CLOSED__NOT_FUNDED':
            tmpl = 
                `"{campaignName}": non è stata finanziata`;
            break;
        case 'CAMPAIGN_NEW_INTERVIEW':
            tmpl = 
                `"{campaignName}" nuova INTERVISTA disponibile`;
            break;
        case 'IT-NEW-REGISTERED-USER':
            tmpl = 
                `NUOVO UTENTE REGISTRATO {env}`;
            break;
    }

    const data = JSON.parse(param);
    try {
        each(data, (value, key) => {
            tmpl = tmpl.replace(`{${key}}`, value);
        })
    } catch (error) {
    }

    let url = '/';
    try {
        const link = new URL(data['detailPage'] || data['detailBlogPage']);
        url = link.href;
    } catch (error) {
    }
    
    return {
        content: tmpl,
        url: url,
        pic: data['pic']
    }
}
export async function init() {
    
}