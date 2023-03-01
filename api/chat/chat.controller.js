'use strict';

import { User } from '../user/user.model';
import { Room } from './chat.model';
import Message from '../message/message.model'
import QueryModel from '../utils/query';
import { union, sortBy, initial } from 'lodash';

export async function getRooms(req, res) {
    const payload = req.body;

    const query = new QueryModel(payload.filter, payload.sort, payload.page, payload.size);
    try {
        
        var rooms = await Room.find(query.filter, null, { skip: (query.page - 1) * query.size , limit: query.size, }).sort(query.sort)
            .populate({ 
                path: 'users'
             }).lean();

             
        rooms = rooms.filter( room => {
            try {
                if (room.users.filter( u => u && u._id).length > 1) return true
            } catch (error) {
                
            }
            return false;
        });

        // rooms.forEach(async (room) => {
        //     var temp = room;
        //     var messages = await Message.find({type: {$eq: 'CHAT_MESSAGE'}, room: {$eq: room._id}}, null, { limit: 2 }).sort({createdAt: 'desc'});
        //     if (messages && messages.length) {
        //         temp['last_msg'] = messages[0];
        //     } else {
        //         temp['last_msg'] = {};
        //     }
        //     data.push(temp);
        // });

        var totalCount = await Room.countDocuments(query.filter);

        return res.send({
            items: rooms,
            totalCount
        });
        
    } catch (error) {
        return res.status(422).json(error);
    }
}
export async function getUnreadRooms(req, res) {
    const { userId } = req.body;
    try {
        const messages = await Message.find({ from: {$nin: [userId]}, readBy: { $nin: [userId]}});
        const roomIds = union(messages.map( el => el.room.toString()));
        var rooms = await Room.find({ _id: {$in: roomIds}, users: { $in: [userId]}})
            .populate({ 
                path: 'users'
             }).lean();
        rooms.forEach( el => {
            el.unreadMessageCount = messages.filter( m => m.room.toString() == el._id.toString()).length,
            el.lastMessage = messages.find( m => m.room && m.room.toString() == el._id.toString())
        })
        return res.send(rooms);
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}


export async function getRoomById(req, res) {
    
    const id = req.params.id;
    try {
        var room = await Room.findOne({ _id: id}).populate({ path: 'users'}).lean();
        if (room) {
            room.users.forEach ( user => {
                const socket_iter = gbl_sockets.find( el => el.target == user._id.toString());
                user.connected = socket_iter && socket_iter.connected;
            })
            return res.send(room);
        }
        throw {message: 'NOT_EXIST'};
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}
export async function createRoom(req, res) {

    const {_id, ...payload } = req.body;
    try {
        const users = await User.find({_id: { $in: payload.users}});
        if (users.length == 0) {
            throw { message: 'NO USERS'}
        }
        const newRoom = new Room({
            ...payload,
            users: users.map( el => el._id),
        });
        const room = await newRoom.save();
        return res.send(room);
    } catch (error) {
        return res.status(422).json(error);
    }
}

export async function createRoomWithAdmin(req, res) {
    const { userId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw { message: 'NO USERS'}
        }
        const admin = await User.findOne({ email: 'roberto@startupswallet.com'});
        // const admin = await User.findOne({ email: 'perseus362434@outlook.com'});
        if (!admin) {
            throw { message: 'NO_ADMIN'}
        }

        const rooms = await Room.find({ users: { $in: [user._id]}, type: 'private'});
        if (rooms.length > 0) {
            const adminRoom = rooms.find( el => el.users.map( u => u.toString()).includes(admin._id.toString()));
            if (adminRoom) {
                return res.send(adminRoom);
            }
        } 
        const newRoom = new Room({
            name: admin.fullName + ' ' + user.fullName,
            type: 'private',
            users: [admin._id, user._id],
        });
        const room = await newRoom.save();
        return res.send(room);
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

export async function updateRoom(req, res) {

    const payload = req.body;
    try {
        var room = await Room.findOne({_id: payload._id});
        if (!room) {
            throw {message: 'NOT_EXIST'};
        }
        const users = await User.find({_id: { $in: payload.users}})
        if (users.length == 0) {
            throw { message: 'NO USERS'}
        }
        room = await Room.findOneAndUpdate({ _id: payload._id}, { ...payload, users: users.map( el => el._id)});
        return res.send(room);
    } catch (error) {
        return res.status(422).json(error);
    }
}
export async function destroyRoomByIds(req, res) {

    const payload = req.body;
    try {
        if (payload.ids && payload.ids.length > 0) {
            await Room.deleteMany({_id: { $in: payload.ids}});
            return res.send({
                success: true
            });
        }
    } catch (error) {
        console.log(error)
    }
    return res.status(422).json(error);
}

export async function init() {
    try {
        const rooms = await Room.find({})
        .populate({ 
            path: 'users'
        }).lean();

        for (let i = 0 ; i < rooms.length; i++) {
            const room = rooms[i];
            try {
                if (room.users.filter( u => u && u._id).length > 1) throw {};
                
                await Room.deleteOne({_id: room._id});

            } catch (error) {
                
            }
        }
    } catch (error) {
        
    }
}
