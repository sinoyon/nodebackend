const AWS = require('aws-sdk');

import { User } from '../api/user/user.model';
import { cloneDeep, union} from 'lodash';

import config from '../config/environment';
import * as notificationController from '../api/notification/notification.controller';

AWS.config.update({
  region: config.aws.region,
  accessKeyId: config.aws.accessKey,
  secretAccessKey: config.aws.secretKey
});

export async function sendEmailForUserConfirm(userName, email, token) {
    const fromAddress = 'noreply@startupswallet.com';
    const toAddress = email;
    const template = 'IT-CONFRIM_EMAIL';
    const templateData = {
        confirmEmail: `${config.baseFEUrl}/auth/verifyEmail?token=${token}`,
        nome: userName
    }

    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}
export async function sendEmailForUserResetPassword(userName, email, token) {
    const fromAddress = 'noreply@startupswallet.com';
    const toAddress = email;
    const template = 'IT-RESET_PASSWORD';
    const templateData = {
        resetPassword: `${config.baseFEUrl}/auth/reset-password?token=${token}`,
        nome: userName
    }

    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}

export async function sendEmailToAdminForUserNewMessage(firstName, lastName, email, message) {
    const fromAddress = 'noreply@startupswallet.com';
    const toAddress = 'roberto@startupswallet.com';
    const template = 'IT-NEW-MESSAGE';
    const templateData = {
        page: `${config.baseFEUrl}`,
        name: firstName,
        surname: lastName,
        email,
        message
    }
    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}

export async function sendEmailToAdminForNewUserRegistered(firstName, lastName, email, channel, env, country = 'italy') {
    const fromAddress = 'noreply@startupswallet.com';
    // const toAddress = 'perseus362434@outlook.com';
    const toAddress = 'roberto@startupswallet.com';
    const template = 'IT-NEW-REGISTERED-USER';
    const templateData = {
        page: `${config.baseFEUrl}`,
        name: firstName,
        surname: lastName,
        email,
        channel,
        env,
        country
    }

    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}

export async function sendEmailForUserAssignPermission(firstName, lastName, email, permissionList ) {
    const fromAddress = 'noreply@startupswallet.com';
    const toAddress = email;
    const template = 'IT-ASSIGN_PERMISSIONS';
    const templateData = {
        username: (firstName || '') + ' ' + (lastName || ''),
        permissionList,
        startupswallet: `${config.baseFEUrl}`
    }

    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}

// user notification


export async function sendEmailForNewCampaignForCategory(param) {
    const {firstName, lastName, email, categoryName, campaignName, detailPage, unsubscribe, status, typology } = param;
    let template;
    if (status == '1_ongoing') {
        template = 'IT-NEW_CAMPAIGN_FOR_CATEGORY_ONGOING';
    } else if (status == '2_comingsoon') {
        template = 'IT-NEW_CAMPAIGN_FOR_CATEGORY_COMINGSOON';
    } else {
        console.log('Invalid status');
        return false;
    }
    const fromAddress = 'noreply@startupswallet.com';
    const toAddress = email;
    const templateData = {
        username: (firstName || '') + ' ' + (lastName || ''),
        categoryName: categoryName || '',
        campaignName: campaignName || '',
        detailPage: detailPage || '',
        unsubscribe: unsubscribe || '',
        crowdTipology: typology || ''
    }
    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}

export async function sendEmailForCampaignMaximumGoalAlmostReached( param ) { 
    const {firstName, lastName, email, campaignName, detailPage, unsubscribe } = param;
    const fromAddress = 'noreply@startupswallet.com';
    const toAddress = email;
    const template = 'IT-CAMPAIGN_MAX_GOAL_ALMOST_REACHED';
    const templateData = {
        username: (firstName || '') + ' ' + (lastName || ''),
        campaignName: campaignName || '',
        detailPage: detailPage || '',
        unsubscribe: unsubscribe || ''
    }

    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}


export async function sendEmailForCampaignMinimumGoalReached( param ) {
    const {firstName, lastName, email, campaignName, detailPage, unsubscribe } = param;
    const fromAddress = 'noreply@startupswallet.com';
    const toAddress = email;
    const template = 'IT-CAMPAIGN_MIN_GOAL_REACHED';
    const templateData = {
        username: (firstName || '') + ' ' + (lastName || ''),
        campaignName: campaignName || '',
        detailPage: detailPage || '',
        unsubscribe: unsubscribe || ''
    }

    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}

export async function sendEmailForCampaignWillCloseIn( param ) {
    const {firstName, lastName, email, campaignName, detailPage, time, unsubscribe} = param;
    const fromAddress = 'noreply@startupswallet.com';
    const toAddress = email;
    const template = 'IT-CAMPAIGN_WILL_CLOSE_IN';
    const templateData = {
        username: (firstName || '') + ' ' + (lastName || ''),
        campaignName: campaignName || '',
        detailPage: detailPage || '',
        unsubscribe: unsubscribe || '',
        time: time || 0
    }

    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}

export async function sendEmailForCampaignAvailableIn( param ) {
    const {firstName, lastName, email, campaignName, detailPage, time, unsubscribe} = param;
    const fromAddress = 'noreply@startupswallet.com';
    const toAddress = email;
    const template = 'IT-CAMPAIGN_AVAILABLE_FROM';
    const templateData = {
        username: (firstName || '') + ' ' + (lastName || ''),
        campaignName: campaignName || '',
        detailPage: detailPage || '',
        unsubscribe: unsubscribe || '',
        time: time || 0
    }

    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}

export async function sendEmailForCampaignAvailable(param ) {
    const {firstName, lastName, email, campaignName, detailPage, unsubscribe} = param;
    const fromAddress = 'noreply@startupswallet.com';
    const toAddress = email;
    const template = 'IT-CAMPAIGN_AVAILABLE';
    const templateData = {
        username: (firstName || '') + ' ' + (lastName || ''),
        campaignName: campaignName || '',
        detailPage: detailPage || '',
        unsubscribe: unsubscribe || ''
    }

    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}

export async function sendEmailForCampaignClosedFunded(param) {
    const {firstName, lastName, email, campaignName, detailPage, unsubscribe } = param
    const fromAddress = 'noreply@startupswallet.com';
    const toAddress = email;
    const template = 'IT-CAMPAIGN_NOW_CLOSED_FUNDED';
    const templateData = {
        username: (firstName || '') + ' ' + (lastName || ''),
        campaignName: campaignName || '',
        detailPage: detailPage || '',
        unsubscribe: unsubscribe || ''
    }

    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}

export async function sendEmailForCampaignClosedNotFunded(param) {
    const {firstName, lastName, email, campaignName, detailPage, unsubscribe } = param
    const fromAddress = 'noreply@startupswallet.com';
    const toAddress = email;
    const template = 'IT-CAMPAIGN_NOW_CLOSED__NOT_FUNDED';
    const templateData = {
        username: (firstName || '') + ' ' + (lastName || ''),
        campaignName: campaignName || '',
        detailPage: detailPage || '',
        unsubscribe: unsubscribe || ''
    }

    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}

export async function sendEmailForCampaignNewInterview( param ) {
    const { firstName, lastName, email, campaignName, detailBlogPage, unsubscribe} = param;
    const fromAddress = 'noreply@startupswallet.com';
    const toAddress = email;
    const template = 'IT-CAMPAIGN_NEW_INTERVIEW';
    const templateData = {
        username: (firstName || '') + ' ' + (lastName || ''),
        campaignName: campaignName || '',
        detailBlogPage: detailBlogPage || '',
        unsubscribe: unsubscribe || '',
    }

    try {
        await _sendTemplateEmail(toAddress, fromAddress, template, templateData);
    } catch (error) {
        console.log(error)
    }
    
    return true;
}

async function _sendTemplateEmail(toAddress, fromAddress , template, templateData) {
    var params = {
        Source: fromAddress,
        Destination: { 
          ToAddresses: [
            toAddress
          ]
        },
        Template: template,
        TemplateData: JSON.stringify(templateData),
        ReplyToAddresses: [
           'noreply@startupswallet.com'
        ],
    };
      
    var sendPromise = new AWS.SES({apiVersion: '2012-10-17'}).sendTemplatedEmail(params).promise();

    try {
        const res = await sendPromise;
        console.log(res.MessageId);
    } catch (error) {
        console.error(error, error.stack);
    }
}

export async function sendEmail(req, res) {
    const {data, type, userIds} = req.body;
    try {

        if (!data || !userIds || userIds.length == 0) throw {};

        let appNotificationUserIds = [];
        
        for (let i = 0 ; i < userIds.length; i++) {
            try {

                const user = await User.findById(userIds[i]);
                if (!user) throw userIds[i];
                let payload = cloneDeep(data);
                payload.email = user.email;
                payload.firstName = user.firstName;
                payload.lastName = user.lastName;
                payload.unsubscribe = payload.unsubscribe + '&uid=' + user._id;
                switch(type) {
                    case 'sendEmailForNewCampaignForCategory':
                        if (payload.typology && payload.typology.indexOf('equity') >= 0) {
                            payload.typology = 'Equity crowdfunding'
                            if (user.notification.category.newEquityCampaign) {
                                await sendEmailForNewCampaignForCategory(payload);
                            }
                        } else if (payload.typology && payload.typology.indexOf('lending') >= 0) {
                            payload.typology = 'Lending crowdfunding';
                            if (user.notification.category.newLendingCampaign) {
                                await sendEmailForNewCampaignForCategory(payload);
                            }
                        }
                        break;
                    case 'sendEmailForCampaignMaximumGoalAlmostReached':
                        if (user.notification.campaign.maximumGoalAlmostReached) {
                            await sendEmailForCampaignMaximumGoalAlmostReached(payload);
                        }
                        break;
                    case 'sendEmailForCampaignMinimumGoalReached':
                        if (user.notification.campaign.minimumGoalReached) {
                            await sendEmailForCampaignMinimumGoalReached(payload);
                        }
                        break;
                    case 'sendEmailForCampaignWillCloseIn':
                        if (user.notification.campaign.willCloseIn) {
                            await sendEmailForCampaignWillCloseIn(payload);
                        }
                        break;
                    case 'sendEmailForCampaignAvailableIn':
                        if (user.notification.campaign.availableIn) {
                            await sendEmailForCampaignAvailableIn(payload);
                        }
                        break;
                    case 'sendEmailForCampaignAvailable':
                        if (user.notification.campaign.available) {
                            await sendEmailForCampaignAvailable(payload);
                        }
                        break;
                    case 'sendEmailForCampaignClosedFunded':
                        if (user.notification.campaign.closedFunded) {
                            await sendEmailForCampaignClosedFunded(payload);
                        }
                        break;
                    case 'sendEmailForCampaignClosedNotFunded':
                        if (user.notification.campaign.closedNotFunded) {
                            await sendEmailForCampaignClosedNotFunded(payload);
                        }
                        break;
                    case 'sendEmailForCampaignNewInterview':
                        if (user.notification.interview.newInterview) {
                            await sendEmailForCampaignNewInterview(payload);
                        }
                        break;
                }
                try {
                    switch(type) {
                        case 'sendEmailForNewCampaignForCategory':
                            if (data.typology && data.typology.indexOf('equity') >= 0) {
                                if (!user.notificationApp.category.newEquityCampaign) throw '';
                            } else if (data.typology && data.typology.indexOf('lending') >= 0) {
                                if (!user.notificationApp.category.newLendingCampaign) throw '';
                            } else {
                                throw '';
                            }
                            break;
                        case 'sendEmailForCampaignMaximumGoalAlmostReached':
                            if (!user.notificationApp.campaign.maximumGoalAlmostReached) throw '';
                            break;
                        case 'sendEmailForCampaignMinimumGoalReached':
                            if (user.notificationApp.campaign.minimumGoalReached) throw '';
                            break;
                        case 'sendEmailForCampaignWillCloseIn':
                            if (!user.notificationApp.campaign.willCloseIn) throw '';
                            break;
                        case 'sendEmailForCampaignAvailableIn':
                            if (!user.notificationApp.campaign.availableIn) throw '';
                            break;
                        case 'sendEmailForCampaignAvailable':
                            if (!user.notificationApp.campaign.available) throw '';
                            break;
                        case 'sendEmailForCampaignClosedFunded':
                            if (!user.notificationApp.campaign.closedFunded) throw '';
                            break;
                        case 'sendEmailForCampaignClosedNotFunded':
                            if (!user.notificationApp.campaign.closedNotFunded) throw '';
                            break;
                        case 'sendEmailForCampaignNewInterview':
                            if (!user.notificationApp.interview.newInterview) throw '';
                            break;
                        default: 
                            throw '';
                    }

                    appNotificationUserIds = union(appNotificationUserIds, [userIds[i]]);
                } catch (error) {
                    console.log(error)
                }
                
            } catch (error) {
                console.log(error)
            }
        }


        try {

            let notificationType;
            switch(type) {
                case 'sendEmailForNewCampaignForCategory':
                    notificationType = 'NEW_CAMPAIGN_FOR_CATEGORY';
                    break;
                case 'sendEmailForCampaignMaximumGoalAlmostReached':
                    notificationType = 'CAMPAIGN_MAX_GOAL_ALMOST_REACHED'
                    break;
                case 'sendEmailForCampaignMinimumGoalReached':
                    notificationType = 'CAMPAIGN_MIN_GOAL_REACHED';
                    break;
                case 'sendEmailForCampaignWillCloseIn':
                    notificationType = 'CAMPAIGN_WILL_CLOSE_IN';
                    break;
                case 'sendEmailForCampaignAvailableIn':
                    notificationType = 'CAMPAIGN_AVAILABLE_FROM'
                    break;
                case 'sendEmailForCampaignAvailable':
                    notificationType = 'CAMPAIGN_AVAILABLE';
                    break;
                case 'sendEmailForCampaignClosedFunded':
                    notificationType = 'CAMPAIGN_NOW_CLOSED_FUNDED';
                    break;
                case 'sendEmailForCampaignClosedNotFunded':
                    notificationType = 'CAMPAIGN_NOW_CLOSED__NOT_FUNDED';
                    break;
                case 'sendEmailForCampaignNewInterview':
                    notificationType = 'CAMPAIGN_NEW_INTERVIEW';
                    break;
            }

            if (!notificationType) throw '';
            await notificationController.createNotification(
                userIds,
                notificationType,
                JSON.stringify(data)
            )
        } catch (error) {
            console.log(error);
        }

        try {

            if (appNotificationUserIds.length == 0) throw '';
            let notificationType;
            switch(type) {
                case 'sendEmailForNewCampaignForCategory':
                    notificationType = 'NEW_CAMPAIGN_FOR_CATEGORY';
                    break;
                case 'sendEmailForCampaignMaximumGoalAlmostReached':
                    notificationType = 'CAMPAIGN_MAX_GOAL_ALMOST_REACHED'
                    break;
                case 'sendEmailForCampaignMinimumGoalReached':
                    notificationType = 'CAMPAIGN_MIN_GOAL_REACHED';
                    break;
                case 'sendEmailForCampaignWillCloseIn':
                    notificationType = 'CAMPAIGN_WILL_CLOSE_IN';
                    break;
                case 'sendEmailForCampaignAvailableIn':
                    notificationType = 'CAMPAIGN_AVAILABLE_FROM'
                    break;
                case 'sendEmailForCampaignAvailable':
                    notificationType = 'CAMPAIGN_AVAILABLE';
                    break;
                case 'sendEmailForCampaignClosedFunded':
                    notificationType = 'CAMPAIGN_NOW_CLOSED_FUNDED';
                    break;
                case 'sendEmailForCampaignClosedNotFunded':
                    notificationType = 'CAMPAIGN_NOW_CLOSED__NOT_FUNDED';
                    break;
                case 'sendEmailForCampaignNewInterview':
                    notificationType = 'CAMPAIGN_NEW_INTERVIEW';
                    break;
            }

            if (!notificationType) throw '';
            await notificationController.createAppNotification(
                appNotificationUserIds,
                notificationType,
                JSON.stringify(data)
            )
        } catch (error) {
            console.log(error);
        }

        return res.send({success: true})
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}
  
