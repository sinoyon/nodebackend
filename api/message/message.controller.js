'use strict';

import { User } from '../user/user.model';
import Message from './message.model';
import QueryModel from '../utils/query';
import { Room } from '../chat/chat.model';
import { union } from 'lodash';
import moment from 'moment';
import * as ses from '../../config/ses';

export async function get(req, res) {
    const payload = req.body;
    const query = new QueryModel(payload.filter, payload.sort, payload.page, payload.size);
    try {
        var messages = await Message.find(query.filter, null, { skip: (query.page - 1) * query.size , limit: query.size, }).sort(query.sort)
            .populate({ 
                path: 'from'
            })
            .populate({ 
                path: 'room'
            })
        var totalCount = await Message.countDocuments(query.filter);
        return res.send({
            items: messages,
            totalCount
        });
    } catch (error) {
        return res.status(422).json(error);
    }
}
export async function create(req, res) {

    const payload = req.body;
    try {
        const user = await User.findOne({ _id: payload.from});
        if (!user) {
            throw { message: 'NO USER'}
        }

        let room = await Room.findOne({ _id: payload.room}).populate({ path: 'users'});

        if (!room) {
            throw { message: 'NO ROOM'}
        }
        
        const newMessage = new Message({
            message: payload.message,
            type: payload.type,
            room: room._id,
            from: user._id
        });
        const message = await newMessage.save();

        room = await Room.findOneAndUpdate({ _id: room._id}, { updatedAt: moment().toDate()});

        for (var i = 0 ; i < room.users.length; i++) {
            const toUser = room.users[i];
            
            if (toUser && toUser._id.toString() != user._id.toString()) {
                await sendMessage(user._id, toUser._id, message.type, message)
            }
        }

        try {
            if (room.type == 'private' && room.users.find( el => el.email == 'roberto@startupswallet.com') && user.email != 'roberto@startupswallet.com') {
                const message = await Message.countDocuments({ room: room._id, from: user._id});
                if (message == 1) {
                    try{
                        await ses.sendEmailToAdminForUserNewMessage(user.firstName, user.lastName, user.email || '', payload.message);
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }

        

        return res.send(message);
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}


export async function update(req, res) {

    const payload = req.body;
    try {
        var message = await Message.findOne({_id: payload._id});
        if (!room) {
            throw {message: 'NOT_EXIST'};
        }
        message = await Message.findOneAndUpdate({ _id: payload._id}, { message: payload.message});
        return res.send(message);
    } catch (error) {
        return res.status(422).json(error);
    }
}
export async function destroyByIds(req, res) {

    const payload = req.body;
    try {
        if (payload.ids && payload.ids.length > 0) {
            await Message.deleteMany({_id: { $in: payload.ids}});
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
        const user = await User.findById(userId);
        if (!user) {
            throw {
                message: 'NOT_USER'
            }
        }
        const messages = await Message.find({ readBy: {$nin: ids}, room: {$in: ids}});
        for (var i = 0 ; i < messages.length; i++) {
            await Message.findOneAndUpdate({ _id: messages[i]._id}, { readBy: union(messages[i].readBy.map( el => el.toString()), [userId])});
        }

        res.send({ success: true});
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

export async function sendMessage(from, to, type, data) {

    const socket_iter = gbl_sockets.find( el => el.target.toString() === to.toString());
    if (socket_iter) {
        socket_iter.nsp.emit(type, data);
    }
}

export async function init() {
    
}