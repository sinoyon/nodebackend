'use strict';

mongoose.Promise = require('bluebird');
import mongoose, { Schema, Document } from 'mongoose';

var NotificationSchema = new Schema(
  {
      users:[ {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      type: {type: String, index: true},
      data: String,
      readBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }]
  },
  {
      collection: "notifications",
      timestamps: true
  }
)
export default mongoose.model('Notification', NotificationSchema);
