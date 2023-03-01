'use strict';

mongoose.Promise = require('bluebird');
import mongoose, { Schema, Document } from 'mongoose';

var TransactionSchema = new Schema(
    {
        type: { type: String, index: true},
        ref: {
            type: Schema.ObjectId || String,
            index: true
        },
        values: {
            type: [
                {
                    value: Number,
                    date: Date
                }
            ]
        },
        converted: Boolean
    },
    {
        collection: "transactions",
        timestamps: true,
        versionKey: false
    }
)

const Transaction =  mongoose.model('Transaction', TransactionSchema);

var CountrySchema = new Schema(
    {
        name: { type: String, trim: true},
        flag: String,
        code: String
    },
    {
        collection: "countries",
        timestamps: true,
        versionKey: false
    }
)

const Country =  mongoose.model('Country', CountrySchema);


module.exports = {
    Transaction: Transaction,
    Country: Country
}