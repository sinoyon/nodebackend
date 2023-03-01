'use strict';

import { Router } from 'express';
import * as controller from './message.controller';

var router = new Router();

router.post('/', controller.create);
router.post('/me', controller.get);
router.put('/', controller.update);
router.post('/deleteByIds', controller.destroyByIds);
router.post('/markAsRead', controller.markAsRead);

module.exports = router;