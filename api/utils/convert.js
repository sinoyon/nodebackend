import moment from 'moment';

const MONTH_ALIAS = {
    'January': ['Gennaio'],
    'February': ['Febbraio'],
    'March': ['Marzo'],
    'April': ['Aprile'],
    'May': ['Maggio'],
    'June': ['Giugno'],
    'July': ['Luglio'],
    'August': ['Agosto'],
    'September': ['Settembre'],
    'October': ['Ottobre'],
    'November': ['Novembre'],
    'December': ['Dicembre']
}

class ConvertModel {

    number(param, delimiter = null) {
        try {
            if (typeof param === 'number') {
                return param;
            }
            if (typeof param === 'string') {
                var regex, result;
                if (delimiter) {
                    regex = new RegExp(`[^${delimiter}-\\d]`, 'g');
                } else {
                    regex = new RegExp(`[^\\d]`, 'g');
                }
                result = param.replace(regex, '');
                if (delimiter) {
                    result = result.replace(delimiter, '.');
                }
                if (delimiter) {
                    result = parseFloat(result);
                } else {
                    result = parseInt(result);
                }
                if (!isNaN(result)){
                    return result;
                }
            }

        } catch (error) {
            console.log(error);
        }
        return null;
    }
    date( param, format = null) {
        try {
            let m;
            if (param) {
                try {
                    Object.keys(MONTH_ALIAS).forEach( key => {
                        MONTH_ALIAS[key].forEach( a => {
                            if (param.indexOf(a) >= 0) {
                                param = param.replace(a, key);
                                throw { 'end': 'end'};
                            }
                        })
                    })
                } catch (e) {
                }
            }
            if (format == null) {
                m = moment(param);
            } else if (format == 'number') {
                const now = moment().startOf('day');
                const d = this.number(param);
                if (d != null) {
                    if (param.indexOf('ore') >= 0) {
                        m = now.add(d, 'hours');
                    } else {
                        m = now.add(d, 'days');
                    }
                    
                }
            } else {
                m = moment(param, format);
            }
            if (m.isValid()) {
                return m.toDate();
            }
        } catch (error) {
            console.log(error);
        }
        return null;
    }
}

export default ConvertModel;