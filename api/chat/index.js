'use strict';

import { Router } from 'express';
import * as controller from './chat.controller';

var router = new Router();

router.get('/rooms/:id', controller.getRoomById);
router.post('/rooms', controller.createRoom);
router.post('/rooms/me', controller.getRooms);
router.put('/rooms', controller.updateRoom);
router.post('/rooms/deleteByIds', controller.destroyRoomByIds);
router.post('/rooms/unread', controller.getUnreadRooms);
router.post('/rooms/createWithAdmin', controller.createRoomWithAdmin)

module.exports = router;