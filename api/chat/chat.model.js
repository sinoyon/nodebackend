'use strict';

mongoose.Promise = require('bluebird');
import mongoose, { Schema, Document } from 'mongoose';

var RoomSchema = new Schema(
    {
        name: {type: String, index: true},
        type: {type: String, index: true},
        lastContacted: Date,
        favorite: Boolean,
        users: [{
          type: Schema.Types.ObjectId,
          ref: 'User'
        }]
    },
    {
        collection: "chat_rooms",
        timestamps: true
    }
)
const Room =  mongoose.model('Room', RoomSchema);

module.exports = {
    Room: Room
}