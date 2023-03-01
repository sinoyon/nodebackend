'use strict';

mongoose.Promise = require('bluebird');
import mongoose, { Schema, Document } from 'mongoose';

var _NamesSchema = mongoose.Schema({
    country: { type: String, trim: true, lowercase: true},
    value: { type: String, trim: true}
},{ _id : false }); 
var _SynonymsSchema = mongoose.Schema({
    country: { type: String, trim: true, lowercase: true},
    value: { type: String, trim: true, lowercase: true}
},{ _id : false }); 

var AliasSchema = new Schema(
    {
        name: { type: String, trim: true},
        type: { type: String, required: true, trim: true, lowercase: true},
        names: [_NamesSchema],
        synonyms: [_SynonymsSchema],
        ignore: {type: Boolean, default: false},
        confirmed: {type: Boolean, default: false},
        follows: [{
            type: Schema.ObjectId
        }],
        followsCount: Number,
        pic: String,
        converted: Boolean
    },
    {
        collection: "aliases",
        timestamps: true,
        versionKey: false
    }
)

const Alias =  mongoose.model('Alias', AliasSchema);

var CompanySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        fiscalCode: {
            type: String,
            trim: true,
            index: true
        },
        physicalLocation: String,
        foundedDate: Date,
        previousType: String,
        contactEmail: String,
        webPageLink: String,
        virtualLocation: String,
        type: {
            type: Schema.ObjectId,
            ref: 'Alias'
        },
        originalType: String,
        fromDate: Date,
        updatedDate: Date,
        tags: [{
            type: Schema.ObjectId,
            ref: 'Alias'
        }],
        originalTags: [String],
        deletedTags: [{
            type: Schema.ObjectId,
            ref: 'Alias'
        }],
        socials: [String],
        campaigns: [{
            type: Schema.ObjectId,
            ref: 'Campaign'
        }],
        macroSector: [],
        numberOfEmployeesRange: String,
        subscribedCapitalRange: String,
        rating: String,
        geographicalMarket: [String],
        article: String,
        articleTitle: String,
        articleDescription: String,
        articleDate: Date,
        articleImageUrl: String,
        country: String,
        comment: [{
            userId: {
                type: Schema.ObjectId,
                ref: 'User'
            },
            description: String
        }],
        feedback: [
            {
                date: Date,
                humor: String,
                comment: String
            }
        ],
        confirmed: Boolean,
        from: String,
        contactDate: Date,
        note: String,
        follows: [{
            type: Schema.ObjectId
        }],
        converted: Boolean
    },
    {
        collection: "companies",
        timestamps: true,
        versionKey: false
    }
)

const Company =  mongoose.model('Company', CompanySchema);

var CampaignSchema = new Schema(
    {
        status: { type: String, required: true, index: true},
        preStatus: String,
        source: {
            type: Schema.ObjectId,
            ref: 'Source',
            required: true,
            index: true
        },
        company: {
            type: Schema.ObjectId,
            ref: 'Company'
        },
        companyConfirmed: Boolean,
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        systemTitle: {
            type: String
        },

        link: {
            type: String,
            trim: true
        },

        logo: String,
        background: String,
        backgroundSM: String,
        backgroundLG: String,
        logoSM: String,
        description: {type: String, trim: true},
        videoUrl: String,
        
        startDate: Date,
        endDate: Date,
        previousEndDates: {
            type: [
                {
                    value: Date,
                    date: Date
                }
            ]
        }, 
        raisedDaily: {
            type: [
                {
                    value: Number,
                    date: Date
                }
            ]
        },
        raised: Number,
        minimumGoal: Number,
        maximumGoalDaily: {
            type: [
                {
                    value: Number,
                    date: Date
                }
            ]
        },
        previousMaximumGoal: {
            type: [
                {
                    value: Number,
                    date: Date
                }
            ]
        },
        maximumGoal: Number,
        preMoneyEvaluation: Number,
        minimumInvestment: Number,
        investorCountDaily: {
            type: [
                {
                    value: Number,
                    date: Date
                }
            ]
        },
        investorCount: Number,
        typology: String,
        equity: Number,
        equityMax: Number,
        webPage: String,
        socials: [String],
        tags: [{
            type: Schema.ObjectId,
            ref: 'Alias'
        }],
        originalTags: [String],
        deletedTags: [String],
        comingSoonPeriod: {
            type: {
                startDate: Date,
                endDate: Date
            }
        },
        roi: Number,
        roiAnnual: Number,
        holdingTime: Number,
        pictures: [String],
        totalSurface: Number,

        address: String,
        city: String,

        fullAddress: String,
        fullCity: String,
        province: String,
        region: String,
        lat: Number,
        lng: Number,
       
        companyName: String,
        companyFiscalCode: String,
        companyWebPageLink: String,
        companyPhysicalLocation: String,
        companyType: String,
        companyContactEmail: String,

        country: String,

        disabled: Boolean,
        deleted: Boolean, 
        createdManually: Boolean,
        updatedManually: Boolean,

        follows: [{
            type: Schema.ObjectId
        }],
        
        followsCount: Number,
        clickVideo: Number,
        clickDetail: Number,
        clickExternal: Number,

        converted: Boolean
    },
    {
        collection: "campaigns",
        timestamps: true,
        versionKey: false,
        getters: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

const Campaign =  mongoose.model('Campaign', CampaignSchema);

var SourceSchema = new Schema(
    {
        name: String,
        disabled: Boolean,
        involvedCampaignStatuses: [String],
        involvedCampaignTypologies: [String],
        link: String,
        background: String,
        logo: String,
        description: String,
        note: String,
        from: {
            type: String,
            enum: ['html', 'api']
        },
        type: String,
        rootSource: {
            type: Schema.ObjectId,
            ref: 'Source'
        },
        dxDay: { type: Number, default: 1}
    },
    {
        collection: "sources",
        timestamps: true,
        versionKey: false
    }
)

const Source =  mongoose.model('Source', SourceSchema);

module.exports = {
    Campaign: Campaign,
    Source: Source,
    Company: Company,
    Alias: Alias
}