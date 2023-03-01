'use strict';

import path from 'path';
import _ from 'lodash';

var all = {
    env: process.env.NODE_ENV,
    root: path.normalize(`${__dirname}/../..`),
    port: process.env.PORT || 8081,
    ip: process.env.IP || '0.0.0.0',
    seedDB: false,
    secrets: {
        session: 'STARTUPSWALLETSECURITY2020429',
        expiredIn: 60 * 60 * 5 * 500
    },
    mongo: {
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        }
    },
    mail: {
        host: "in-v3.mailjet.com",
        port: 465,
        secure: true,
        auth: {
          user: "ea8af7fe09940ce1ec41ff75217cd913",
          pass: "cd3b655b6bc20796332e99d96f09dd8e"
        }
    },
    aws: {
        region: 'eu-central-1',
        accessKey: 'AKIA6N6TXY6BYWTY4RMZ',
        secretKey: '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',
        s3: {
            bucket: 'startupswallet-dev'
        }
    }
}

module.exports = _.merge(
    all,
    require('./shared').default,
    require(`./${process.env.NODE_ENV}.js`) || {}
);