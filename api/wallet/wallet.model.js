'use strict';

mongoose.Promise = require('bluebird');
import mongoose, { Schema, Document } from 'mongoose';

var WalletSchema = new Schema(
  {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
      },
      campaign: {
        type: Schema.Types.ObjectId,
        ref: 'Campaign',
        index: true
      },
      amountInvested: Number,
      equityOwned: Number,
      investedDate: Date,
      refundedExpectedDate: Date,
      type: String
  },
  {
      collection: "wallets",
      timestamps: true
  }
)
export default mongoose.model('Wallet', WalletSchema);
