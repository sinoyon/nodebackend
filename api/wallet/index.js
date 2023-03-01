'use strict';

import { Router } from 'express';
import * as controller from './wallet.controller';

var router = new Router();

router.post('/', controller.create);
router.post('/me', controller.get);
router.put('/', controller.update);
router.post('/deleteByIds', controller.destroyByIds);
router.post('/getWalletCampaignsByUserId', controller.getWalletCampaignsByUserId);

module.exports = router;