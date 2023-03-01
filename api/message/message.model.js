'use strict';

mongoose.Promise = require('bluebird');
import mongoose, { Schema, Document } from 'mongoose';

var MessageSchema = new Schema(
  {
      from: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
      },
      message: {type: String, trim: true},
      room: {
        type: Schema.Types.ObjectId,
        ref: 'Room',
        index: true
      },
      type: {type: String, index: true},
      readBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }]
  },
  {
      collection: "messages",
      timestamps: true
  }
)
export default mongoose.model('Message', MessageSchema);
