/**
 * Socket.io configuration
 */
'use strict';

import { User } from '../api/user/user.model';
import { Room } from '../api/chat/chat.model';
import { union } from 'lodash';

import { Transaction } from '../api/utils/extras';
import moment from 'moment';

export async function initSocket() {
  try {
    var users = await User.find({});
    for (var i = 0 ; i < users.length; i++) {
      if (users[i].email == 'roberto@startupswallet.com') {
        global.gbl_admin = users[i]._id.toString();
      }
      await createSocket(users[i]._id.toString(), users[i].isAdmin);
    }
  } catch (error) {
    console.log(error)
  }
}

export async function createSocket(userId, isAdmin = false) {
  try {
    const nsp = gbl_io.of('/user/' + userId);
    let socket_iter = gbl_sockets.find( el => el.target == userId);
    if (!socket_iter) {
      gbl_sockets.push({
        nsp: nsp,
        target: userId,
        connected: false,
        isAdmin
      });
      socket_iter = gbl_sockets.find( el => el.target == userId);
      if (socket_iter) {
        socket_iter.nsp.on('connection', async socket => {
          socket.address = `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`;
  
          socket.connectedAt = new Date();
          await User.findOneAndUpdate({ _id: socket_iter.target}, {connectedAt: new Date()})
      
          socket.log = function(...data) {
            console.log(`SocketIO ${socket.nsp.name} [${socket.address}]`, ...data);
          };
  
          socket_iter.connected = true;
          await sendConnectionMessageToUsers(socket_iter.target);

          try {

            let transaction = await Transaction.findOne({ type: 'user.connection', ref: socket_iter.target});
            if (!transaction) {
              transaction = await new Transaction({ type: 'user.connection', ref: socket_iter.target}).save();
            }

            let values = transaction.values || [];
            values = values.filter( el => el.value != null && el.date);
            if (values.length > 0) {
                const dt = values[values.length - 1].date;
                const v = values[values.length - 1].value;
                if (moment().startOf('day').diff(moment(dt).startOf('day'), 'days') > 0) {
                    values.push({
                        value: v + 1,
                        date: new Date()
                    })
                } else {
                    values[values.length - 1].value++;
                }
            } else {
                values = [{
                    value: 1,
                    date: new Date()
                }]
            }
            transaction.values = values;

            transaction = await Transaction.findOneAndUpdate({_id: transaction._id}, transaction, {new: true});      
            
            await User.findOneAndUpdate({ _id: socket_iter.target}, {$inc:{ connectedCount: 1}})
           
          } catch (error) {
            console.log(error)
          }
          socket.log('CONNECTED');
  
          socket.on('disconnect', async () => {
            socket_iter.connected = false;
            await sendConnectionMessageToUsers(socket_iter.target, false);
            socket.log('DISCONNECTED');
          });
        });
      }
    }
    
  } catch (error) {

  }
}

async function sendConnectionMessageToUsers(userId, isConnected = true) {
  try {
    const rooms = await Room.find({ users: { $in: [userId]}});
    const userIds = rooms.reduce( ( re, cur) => {
      re = union( re, cur.users.map( el => el.toString()));
      return re;
    }, []);
    for (var i = 0 ; i < userIds.length; i++) {
      const user_socket_iter = gbl_sockets.find( el => el.target == userIds[i]);
      if (user_socket_iter) {
        user_socket_iter.nsp.emit('USER_CONNECTION', {
          userId: userId,
          connected: isConnected
        });
      }
    }
  } catch (error) {
    console.log(error)
  }
}
export async function sendUserChangedMessage(userId) {
  try {
      const user_socket_iter = gbl_sockets.find( el => el.target == userId);
      if (user_socket_iter) {
        user_socket_iter.nsp.emit('USER_CHANGED', {});
      }
  } catch (error) {
    console.log(error)
  }
}

export async function sendNotificationMessage(param) {
  const { type, userIds, data, isAdmin} = param;
  try {

    if (isAdmin) {
      gbl_sockets.filter( el => el.isAdmin ).forEach( el => {
        el.nsp.emit(type, data);
      });
      
    } else {
      if (!userIds) throw {}
      for (var i = 0 ; i < userIds.length; i++) {
        const user_socket_iter = gbl_sockets.find( el => el.target == userIds[i]);
        if (user_socket_iter) {
          user_socket_iter.nsp.emit(type, data);
        }
      }
    }
  } catch (error) {
    console.log(error)
  }
}


export async function sendMessage(req, res) {
  const { type, userIds, data, isAdmin} = req.body;
  try {

    if (isAdmin) {
      gbl_sockets.filter( el => el.isAdmin ).forEach( el => {
        el.nsp.emit(type, data);
      });
      
    } else {
      if (!userIds) throw {}
      for (var i = 0 ; i < userIds.length; i++) {
        const user_socket_iter = gbl_sockets.find( el => el.target == userIds[i]);
        if (user_socket_iter) {
          user_socket_iter.nsp.emit(type, data);
        }
      }
    }
    return res.send({success: true})
  } catch (error) {
    console.log(error)
    return res.status(422).json(error);
  }
}
