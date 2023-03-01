'use strict';

import * as userController from '../api/user/user.controller';
import * as messageController from '../api/message/message.controller';
import * as chatController from '../api/chat/chat.controller';
import * as notificationController from '../api/notification/notification.controller';
import * as walletController from '../api/wallet/wallet.controller';





export async function start(req, res) {
    const { user, chat, message, notification, wallet, all} = req.body;

    try {
        if (all || user) {
            await userController.init();
        }
        if (all || chat) {
            await chatController.init();
        }
        if (all || message) {
            await messageController.init();
        }
        if (all || notification) {
            await notificationController.init();
        }
        if (all || wallet) {
            await walletController.init();
        }
    } catch (error) {
        
    }

    return res.send({ success: true})
   
}
