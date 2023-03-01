'use strict';

import { Router } from 'express';
import * as controller from './user.controller';
import { auth } from '../../config/auth';

var router = new Router();

router.get('/:id', auth(), controller.getById);
router.post('/', controller.create);
router.post('/me', auth(), controller.get);
router.put('/', auth(), controller.update);
router.delete('/:id', auth(), controller.destroy);

router.post('/getByToken', auth(), controller.getByToken);
router.post('/verifyEmail', auth(), controller.verifyEmail);
router.post('/resetPassword', auth(), controller.resetPassword);
router.post('/sendVerifyEmail', auth(), controller.sendVerifyEmail);
router.post('/deleteByIds', auth(), controller.destroyByIds);
router.post('/uploadPicture', auth(),controller.uploadPicture);
router.post('/login', controller.login);
router.post('/loginWithLinkedIn', controller.loginWithLinkedIn);
router.post('/createWithLinkedIn' ,controller.createWithLinkedIn);
router.post('/loginWithApple', controller.loginWithApple);
router.post('/createWithApple' ,controller.createWithApple);
router.post('/forgot', controller.forgot);

router.post('/checkSocketByUserId', controller.checkSocketByUserId);
router.post('/refreshSockets', controller.refreshSockets);
router.post('/check', controller.check);
router.post('/getAnalyticsByPeriod', controller.getAnalyticsByPeriod);

router.post('/roles/me', auth(),controller.getRoles);
router.post('/roles/deleteByIds', auth(), controller.destroyRoleByIds);
router.get('/roles/:id', auth(), controller.getRoleById);
router.post('/roles', controller.createRole);
router.post('/roles/me', auth(), controller.getRoles);
router.put('/roles', auth(), controller.updateRole);
router.post('/getCountByState', controller.getCountByState);

router.post('/getById', controller.getUseId);

module.exports = router;