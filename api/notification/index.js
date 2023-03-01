'use strict';

import { Router } from 'express';
import * as controller from './notification.controller';

var router = new Router();

router.post('/', controller.create);
router.post('/me', controller.get);
router.post('/deleteByIds', controller.destroyByIds);
router.post('/markAsRead', controller.markAsRead);
router.post('/unread', controller.getUnread);

module.exports = router;