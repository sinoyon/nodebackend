'use strict';

mongoose.Promise = require('bluebird');
import mongoose, { Schema, Document } from 'mongoose';
import mongooseLeanDefaults from 'mongoose-lean-defaults';

var _PermissionSchema = mongoose.Schema({
    permission: String,
    country: [String],
    typology: [String],
    readable: Boolean,
    writable: Boolean,
    downloadable: Boolean
},{ _id : false }); 


var _NotificationSchema = mongoose.Schema({
    category: {
        newEquityCampaign: Boolean,
        newLendingCampaign: Boolean
    },
    campaign: {
        maximumGoalAlmostReached: Boolean,
        minimumGoalReached: Boolean,
        willCloseIn: Boolean,
        availableIn: Boolean,
        available: Boolean,
        closedFunded: Boolean,
        closedNotFunded: Boolean,
    },
    interview: {
        newInterview: Boolean
    }
},{ _id : false }); 

var RoleSchema = new Schema(
    {
       description: String,
       permissions: [_PermissionSchema]
    },
    {
        collection: "user_roles",
        timestamps: true,
        versionKey: false
    }
)

const Role =  mongoose.model('Role', RoleSchema);

var UserSchema = new Schema(
    {
        email: {
            type: String,
            lowercase: true,
            trim: true,
            index: true
        },
        password: String,
        pic: String,
        firstName: String,
        lastName: String,
        phone: String,
        roles: [{
            type: Schema.Types.ObjectId,
            ref: 'Role',
        }],
        hasRole: Boolean,
        permissions: [_PermissionSchema],
        isAdmin: Boolean,
        isGuest: Boolean,
        notification: {
            type: _NotificationSchema,
            default: {
                category: {
                    newEquityCampaign: true,
                    newLendingCampaign: true
                },
                campaign: {
                    maximumGoalAlmostReached: true,
                    minimumGoalReached: true,
                    willCloseIn: true,
                    availableIn: true,
                    available: true,
                    closedFunded: true,
                    closedNotFunded: true,
                },
                interview: {
                    newInterview: true
                }
            }
        },
        notificationApp: {
            type: _NotificationSchema,
            default: {
                category: {
                    newEquityCampaign: true,
                    newLendingCampaign: true
                },
                campaign: {
                    maximumGoalAlmostReached: true,
                    minimumGoalReached: true,
                    willCloseIn: true,
                    availableIn: true,
                    available: true,
                    closedFunded: true,
                    closedNotFunded: true,
                },
                interview: {
                    newInterview: true
                }
            }
        },
        ipaddress: String,
        deviceId: String,
        emailConfirmed: Boolean,
        newsletter: Boolean,
        linkedin: Boolean,
        platform: String,
        followedCampaignsCount: Number,
        followedCategoriesCount: Number,
        connectedCount: Number,
        connectedAt: Date,
        linkedInProfileUrl: String,
        jobTitle: String,
        city: String,
        actualCompany: String,
        from: String,
        inValid: {
            type: Boolean
        },
        comments: [{
            user: {
                type: Schema.ObjectId,
                ref: 'User'
            },
            content: String
        }],
        deleted: String,
        country: String,
        apple_user: String
    },
    {
        collection: "users",
        timestamps: true,
        versionKey: false
    }
);

UserSchema.plugin(mongooseLeanDefaults);

const User =  mongoose.model('User', UserSchema);

module.exports = {
    Role: Role,
    User: User
}