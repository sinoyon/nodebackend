import moment from 'moment';
import { each } from 'lodash';
import mongoose from 'mongoose';

class QueryModel{
    constructor (_filterModel =  {}, _sortModel = {},_pageNumber = 1, _pageSize = 10) {
        this.page = _pageNumber;
        this.size = _pageSize;
        this.sort = {};
        this.filter = {};

        each(_sortModel, (value, key) => {
            if (key == 'leftDays') {
                this.sort['hasLeftDays'] = -1;
            }
            if (value == 'asc') this.sort[key] = 1;
            else if (value == 'desc') this.sort[key] = -1;
            else this.sort[key] = 1;
        });

        if (Object.keys(this.sort).length == 0) {
            this.sort = { name: 1};
        }

        this.filter = this.generateFilter(_filterModel);
    }

    generateFilter( param ) {
        const originFilter = {};
        param.filter( el => !el.or && el.key).forEach( el => {
            const key = el.key;
            if (el.isObject) {
                if (el.value) {
                    el.value = mongoose.Types.ObjectId(el.value);
                }
                if (el.values && el.values.length) {
                    el.values = el.values.map (e => mongoose.Types.ObjectId(e))
                }
            }
            if (el.isDate) {
                if (el.value) {
                    el.value = new Date(el.value);
                }
            }
            try {
                switch (el.filterType) {
                    case 'text':
                        originFilter[key] = new RegExp(el.filter, 'i');
                        break;
                    case 'date':
                        {
                            var m = moment(el.dateFrom);
                            originFilter[key]= { $gte : m.toDate(), $lt: m.hour(23).minute(59).second(59).toDate()}
                        }
                        break;
                    case 'set':
                        if (el.values.length) {
                            originFilter[key]= { $in : el.values }
                        } else {
                            originFilter[key]= { $in : [/.+/, null] }
                        }
                        break;
                    case 'set_r':
                        originFilter[key]= { $nin : el.values }
                        break;
                    case 'eq':
                        originFilter[key] = { $eq: el.value} ;
                        break;
                    case 'ne':
                        originFilter[key] = { $ne: el.value} ;
                        break;
                    case 'lt':
                        originFilter[key] = { $lt: el.value} ;
                        break;
                    case 'lte':
                        originFilter[key] = { $lte: el.value} ;
                        break;
                    case 'gt':
                        originFilter[key] = { $gt: el.value} ;
                        break;
                    case 'gte':
                        originFilter[key] = { $gte: el.value} ;
                        break;
                    case 'all':
                        originFilter[key] = { $all: el.values} ;
                        break;
                    case 'all_r':
                        originFilter[key]= { $not: { $all : el.values } }
                        break;
                    case 'size_gt':
                        originFilter[key + '.' + el.value] =  { $exists: true}
                        break;
                    case 'size':
                        originFilter[key]= { $size: el.value }
                        break;
                    case 'exists':
                        originFilter[key]= { $exists: el.value }
                        break;
                    default: 
                        break;
                }
            } catch (error) {
            }
            
        });
        if (param.filter( el => el.or).length > 0) {
            
            const rootFilter = [];
            try {
                param.filter( el => el.or).forEach( el => {
                    rootFilter.push({ $or: el.filter.map( e => {
                        return this.generateFilter(e)
                    })})
                });
            } catch (error) {
            }
            return {
                $and: [
                    ...rootFilter,
                    originFilter
                ]
            }
        } else {
            return originFilter
        }
    }
}

export default QueryModel;