'use strict';

import { User } from '../user/user.model';
import { Campaign, Source, Company, Alias } from '../crawling/crawling.model';
import Wallet from './wallet.model';
import QueryModel from '../utils/query';


export async function get(req, res) {
    const { filter, sort, page, size, projects} = req.body;
    const query = new QueryModel(filter, sort, page, size);
    let campaignFilter = {}
    try {
        Object.keys(query.filter).forEach( key => {
            if (key.indexOf('campaign') >= 0) {
                campaignFilter[key] = query.filter[key];
                delete query.filter[key];
            } else {
            }
        })
    } catch (error) {
        
    }
    try {
        const pipelines = [
            {
                $match: query.filter
            },
            {
                $lookup:
                {
                    from: "campaigns",
                    localField: 'campaign',
                    foreignField: '_id',
                    as: 'campaign'
                }
            },
            { $unwind: { path: '$campaign', preserveNullAndEmptyArrays: false}},
            {
                $match: campaignFilter
            },
            {
                $facet: {
                    meta: [
                        {
                            $count: 'total'
                        }
                    ],
                    data:[
                        { $sort: query.sort },
                        { '$skip': (page - 1) * size },
                        { '$limit': size }
                    ]
                }
            }
        ];

        const aggregateResult = await Wallet.aggregate([
            ...pipelines,
        ])

        let items = aggregateResult.length ? aggregateResult[0].data: [];

        items = await Source.populate(items, {
            path: 'campaign.source', select: 'name link description logo note'
        });
        items = await Company.populate( items, {
            path: 'campaign.company', select: 'name tags',
            populate:[ { path: 'tags', select: 'names confirmed'}, { path: 'types', select: 'names confirmed'}]
        });
        items = await Alias.populate( items, {
            path: 'campaign.tags', select: 'names'
        });
        const totalCount = aggregateResult.length && aggregateResult[0].meta[0] ?aggregateResult[0].meta[0].total : 0;

        return res.send({
            items,
            totalCount
        });
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}
export async function getWalletCampaignsByUserId(req, res) {
    const { userId, typology } = req.body;
    
    try {

        let wallets = await Wallet.find({ user: userId}).populate('campaign', 'typology');
        wallets = wallets.filter( el => typology ? el.campaign && el.campaign.typology.indexOf(typology) >= 0 : el.campaign)
        .map( el => {
            return {
                _id: el._id,
                campaignId: el.campaign._id
            }
        });
        
        return res.send(wallets);
    } catch (error) {
        return res.status(422).json(error);
    }
}
export async function create(req, res) {

    const payload = req.body;
    const userId = req.user.id;
    try {
        
        const campaign = await Campaign.findById(payload.campaign);
        if (!campaign) {
            throw { wallet: 'NO CAMPAIGN'}
        }
        
        let wallet = await Wallet.findOne({ user: userId, campaign: payload.campaign})
        if (wallet) {
            throw { wallet: 'EXIST'}
        }

        const newWallet = new Wallet({
            user: userId,
            ...payload
        });
        wallet = await newWallet.save();

        return res.send(wallet);
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}


export async function update(req, res) {

    const payload = req.body;
    try {
        var wallet = await Wallet.findOne({_id: payload._id});
        if (!wallet) {
            throw {wallet: 'NOT_EXIST'};
        }
        wallet = await Wallet.findOneAndUpdate({ _id: payload._id}, payload);
        return res.send(wallet);
    } catch (error) {
        return res.status(422).json(error);
    }
}
export async function destroyByIds(req, res) {

    const payload = req.body;
    try {
        if (payload.ids && payload.ids.length > 0) {
            await Wallet.deleteMany({_id: { $in: payload.ids}});
            return res.send({
                success: true
            });
        }
    } catch (error) {
        console.log(error)
    }
    return res.status(422).json(error);
}

export async function init () {
    
}