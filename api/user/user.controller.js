'use strict';

const validator = require('validator');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const requestIp = require('request-ip');

import { User, Role, Permission } from './user.model';
import { Alias, Source, Campaign } from '../crawling/crawling.model';
import { Transaction } from '../utils/extras';
import QueryModel from '../utils/query';
import config from '../../config/environment';
import { createSocket } from '../../config/socketio';
import * as ses from '../../config/ses';
import * as s3Controller from '../utils/s3';
import * as socketController from '../../config/socketio';
import * as notificationController from '../notification/notification.controller';
import moment from 'moment';
import { difference, union } from 'lodash';
import axios from 'axios';
const querystring = require('querystring');
import * as objectPath from 'object-path';

import { Country } from '../utils/extras';
const jwksClient = require('jwks-rsa');
const jwks= jwksClient({ jwksUri: 'https://appleid.apple.com/auth/keys'});


export async function get(req, res) {
    const payload = req.body;
    const query = new QueryModel(payload.filter, payload.sort, payload.page, payload.size);
    try {
        var users = await User.find(query.filter, null , { skip: (query.page - 1) * query.size , limit: query.size, }).select('-password').sort(query.sort)
            .populate({ 
                path: 'roles'
             }).lean();

        var totalCount = await User.countDocuments(query.filter);
        users.forEach ( u => {
            const socket_iter = gbl_sockets.find( el => el.target == u._id.toString());
            u.connected = socket_iter && socket_iter.connected;
        })
        return res.send({
            items: users,
            totalCount
        });
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}



export async function getById(req, res) {
    
    const id = req.params.id;
    try {
        var user = await User.findOne({ _id: id}).select('-password')
            .populate({ 
                path: 'roles'
            })

        if (user) {
            return res.send(user);
        }
        throw {message: 'NOT_EXIST'};
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

export async function getUseId(req, res) {
    
    const { id } = req.body;

    try {
        var user = await User.findOne({ _id: id}).select('-password')
            .populate({ 
                path: 'roles'
            })

        if (user) {
            return res.send(user);
        }
        throw {message: 'NOT_EXIST'};
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

export async function verifyEmail(req, res) {
    
    const id = req.user.id;
    try {
        const user = await User.findOneAndUpdate({ _id: id}, {emailConfirmed: true}, { new: true});
        const tokenData = {
            user: {
                id: user._id
            }
        };
        jwt.sign(tokenData, config.secrets.session, {
            expiresIn: config.secrets.expiredIn
        }, (err, token) => {
            if (err) throw err;
            res.status(200).json({accessToken: token});
        })
        socketController.sendUserChangedMessage(id.toString());
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}
export async function sendVerifyEmail(req, res) {
   
    const { ids } = req.body;
    for (var i = 0 ; i < ids.length; i++) {
        try {
            const user = await User.findOne({ _id: ids[0]});
            if (user && user.email && !user.emailConfirmed) {
                const tokenData = {
                    user: {
                        id: user._id
                    }
                };
                jwt.sign(tokenData, config.secrets.session, {
                    expiresIn: 604800
                }, (err, token) => {
                    if (err) throw err;
                    ses.sendEmailForUserConfirm(user.firstName , user.email, token);
                })
            } else {
                throw {}
            }
            return res.send({ success: true});
        } catch (error) {
            console.log(error)
            return res.status(422).json(error);
        }
    }
}
export async function getByToken(req, res) {

    const id = req.user.id;
    try {
        var user = await User.findOne({ _id: id}).select('-password').populate({ 
            path: 'roles'
        }).lean()
        if (user) {
            const countries = await Country.find({});
            user.countries = countries.map( el => el.name).filter(el => el)
            return res.send(user);
        }
        throw {message: 'NOT_EXIST'};
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

export async function create(req, res) {

    const ipaddress = requestIp.getClientIp(req);
    const {_id, ...payload } = req.body;
    delete payload.roles;
    try {
        if (payload.email) {
            if (!validator.isEmail(payload.email)) throw { message: 'INVALID_EMAIL'};
        }
        if (payload.password) {
            if (!validator.isLength(payload.password, {min: 8})) throw { message: 'INVALID_PASSWORD'};
        }

        var user;
        if (payload.email) {
            user = await User.findOne({email: payload.email});
        }
        if (user) {
            throw {message: 'ALREADY_EXIST'};
        } else {
            user = await User.findOne({ipaddress: ipaddress});
            try {
                if (user) {
                    if (payload.email) {
                        if (!user.email) {
                            delete payload.password;
                            user = await User.findOneAndUpdate({_id: user._id}, payload, { new: true});
                        }else {
                            var newUser = new User(payload);
                            const salt = await bcrypt.genSalt(10);
                            if (payload.password) {
                                newUser.password = await bcrypt.hash(payload.password, salt);
                            }
                            user = await newUser.save();
                        }
                    }
                } else {
                    payload.ipaddress = ipaddress;
                    var newUser = new User(payload);
                    const salt = await bcrypt.genSalt(10);
                    if (payload.password) {
                        newUser.password = await bcrypt.hash(payload.password, salt);
                    }

                    user = await newUser.save();
                    
                }
            } catch (err) {
                
            }
            
    
            try {
                await createSocket(user._id.toString())
            } catch (error) {
                console.log(error)
            }
        }

        const tokenData = {
            user: {
                id: user._id
            }
        };

        try{
            await ses.sendEmailToAdminForNewUserRegistered(user.firstName, user.lastName, user.email,
                [user.platform, user.linkedin? 'linkedin': null, user.newsletter ? 'newsletter': null].filter( el => el).join('/'),
                config.server, payload.country);
        } catch (error) {
            console.log(error);
        }

        try {
            // const adminUser = await User.findOne({ email: 'perseus362434@outlook.com'});
            const adminUser = await User.findOne({ email: 'roberto@startupswallet.com'});
            const data = {
                env: config.server
            }
            await notificationController.createAppNotification(
                [adminUser._id],
                'IT-NEW-REGISTERED-USER',
                JSON.stringify(data)
            )
        } catch (error) {
            
        }

        jwt.sign(tokenData, config.secrets.session, {
            expiresIn: config.secrets.expiredIn
        }, (err, token) => {
            if (err) throw err;
            res.status(200).json({accessToken: token});

            if (user.email) {
                try {
                    jwt.sign(tokenData, config.secrets.session, {
                        expiresIn: 604800
                    }, (err1, token1) => {
                        if (err1) throw err1;
                        ses.sendEmailForUserConfirm(user.firstName ,user.email, token1);
                    }) 
                } catch (error) {
                    
                }
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}


export async function check(req, res) {

    const ipaddress = requestIp.getClientIp(req);
    const {_id, ...payload } = req.body;
    delete payload.roles;
    try {
        let user;
        if (payload.email) {
            user = await User.findOne({email: payload.email, isGuest: true});
        }
        
        if (!user) {
            user = await User.findOne({ipaddress: ipaddress, isGuest: true});
            try {
                if (!user) {
                    payload.ipaddress = ipaddress;
                    if ((!payload.firstName || payload.firstName.trim() == '')) {
                        payload.firstName = 'Guest';
                    }
                    payload.lastName = payload.lastName || '';
                    payload.isGuest = true;
                    const newUser = new User(payload);
                    user = await newUser.save();
                } else {
                    if ((!payload.firstName || payload.firstName.trim() == '')) {
                        payload.firstName = 'Guest';
                    }
                    payload.lastName = payload.lastName || '';
                    user = await User.findOneAndUpdate({_id: user._id}, payload, {new:true});
                }
            } catch (err) {
            }
            try {
                await createSocket(user._id.toString())
            } catch (error) {
                console.log(error)
            }
        }
       
        const tokenData = {
            user: {
                id: user._id
            }
        };

        jwt.sign(tokenData, config.secrets.session, {
            expiresIn: config.secrets.expiredIn
        }, (err, token) => {
            if (err) throw err;
            res.status(200).json({accessToken: token})
        })
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}
export async function update(req, res) {

    const payload = req.body;
    delete payload.email;
    delete payload.password;

    try {
        var user = await User.findOne({_id: payload._id});
        if (!user) {
            throw {message: 'NOT_EXIST'};
        }

        let permissionList = [];
        
        if ('hasRole' in payload) {
            if (payload.hasRole) {
                const roles = await Role.find({_id: { $in: payload.roles}});
                roles.forEach( role => {
                    role.permissions.forEach( pm => {
                        if (!permissionList.includes(pm.permission) && (pm.readable || pm.writable || pm.downloadable)) {
                            permissionList.push(pm.permission);
                        }
                    })
                });
                if (user.hasRole){
                    if (difference( payload.roles, user.roles.map( el => el.toString())).length == 0) {
                        permissionList = [];
                    } 
                }
            } else {
                payload.permissions.forEach( pm => {
                    if (!permissionList.includes(pm.permission) && (pm.readable || pm.writable || pm.downloadable)) {
                        permissionList.push(pm.permission);
                    }
                });
                const oldPermissionList = [];
                user.permissions.forEach( pm => {
                    if (!oldPermissionList.includes(pm.permission) && (pm.readable || pm.writable || pm.downloadable)) {
                        oldPermissionList.push(pm.permission);
                    }
                });
                if (!user.hasRole) {
                    if (difference( permissionList, oldPermissionList ).length == 0) {
                        permissionList = [];
                    } 
                }
            }
        }
        
        user = await User.findOneAndUpdate({ _id: payload._id}, payload, { new: true}).select('-password');

        if (permissionList.length) {
            ses.sendEmailForUserAssignPermission(user.firstName, user.lastName, user.email, permissionList.join(','));
        }

        return res.send(user);
    } catch (error) {
        return res.status(422).json(error);
    }
}

export async function destroy(req, res) {

    const id = req.params.id;
    try {
        var user = await User.findOne({ _id: id});
        if (!user) {
            throw {message: 'NOT_EXIST'};
        }
        await User.findOneAndRemove({ _id: id});
        return res.send({})
    } catch (error) {
        return res.status(422).json(error);
    }
}
export async function destroyByIds(req, res) {

    const payload = req.body;
    try {
        if (payload.ids && payload.ids.length > 0) {
            await User.deleteMany({_id: { $in: payload.ids}});
            return res.send({
                success: true
            });
        }
    } catch (error) {
        console.log(error)
    }
    return res.status(422).json(error);
}
export async function destroyRoleByIds(req, res) {

    const payload = req.body;
    try {
        if (payload.ids && payload.ids.length > 0) {
            await Role.deleteMany({_id: { $in: payload.ids}});
            return res.send({
                success: true
            });
        }
    } catch (error) {
        console.log(error)
    }
    return res.status(422).json(error);
}

export async function login(req, res) {
    const { email, password} = req.body;

    try {
        
        if (!validator.isEmail(email)) throw { message: 'INVALID_EMAIL'};

        let user = await User.findOne({ email });

        if (!user) throw { message: 'NO_EXIST'};

        if (user.deleted && user.deleted == 'yes') throw { message: 'NO_EXIST'};

        if (user.password == '' && user.roles.length == 0) {
        } else {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) throw { message: 'INVALID_PASSWORD'};
        }
        const tokenData = {
            user: {
                id: user._id
            }
        };

        jwt.sign(tokenData, config.secrets.session, {
            expiresIn: user.roles.length > 0 ? config.secrets.expiredIn : '365d'
        }, (err, token) => {
            if (err) throw err;

            res.status(200).json({accessToken: token})
        })

    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

export async function loginWithLinkedIn(req, res) {
    const { code, redirect_uri } = req.body;

    try {
        
        if (!code ) throw { message: 'INVALID_CODE'};

        let response = await axios.request({
            url: `https://www.linkedin.com/oauth/v2/accessToken`,
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: querystring.stringify({
                code,
                redirect_uri,
                client_id: config.linkedinClientId,
                client_secret: config.linkedinClientSecret,
                grant_type: 'authorization_code',
            })
        });

        if (response.status != 200) throw { mmessge: 'INVAILD_DATA'}
    
        const accessToken = response.data.access_token;

        response = await axios.request({
            url: `https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))`,
            method: 'get',
            headers: {
                'Authorization':'Bearer ' + accessToken
            }
        });

        if (response.status != 200) throw { mmessge: 'INVAILD_DATA'}

        const email = objectPath.get(response.data, 'elements.0.handle~.emailAddress');

        let user = await User.findOne({ email });

        if (!user) throw { message: 'NO_EXIST'};

        const tokenData = {
            user: {
                id: user._id
            }
        };

        jwt.sign(tokenData, config.secrets.session, {
            expiresIn: user.roles.length > 0 ? config.secrets.expiredIn : '365d'
        }, (err, token) => {
            if (err) throw err;

            res.status(200).json({accessToken: token})
        })

    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}
export async function loginWithApple(req, res) {
    const { identityToken, user, email } = req.body;

    try {

        const json = jwt.decode(identityToken, { complete: true});

        const kid = json.header.kid;

        const appleKey = (await jwks.getSigningKey(kid)).getPublicKey();

        const payload = jwt.verify(identityToken, appleKey);
        if (!payload) throw { message: 'INVALID_TOKEN'};

        if (payload.sub != user) throw { message: 'INVALID_USER'}
        
        // const email = payload.email;
        // if (!validator.isEmail(email)) throw { message: 'INVALID_EMAIL'};

        let existUser = await User.findOne({ apple_user: user });

        if (!existUser) throw { message: 'NO_EXIST'};

        const tokenData = {
            user: {
                id: existUser._id
            }
        };

        jwt.sign(tokenData, config.secrets.session, {
            expiresIn: existUser.roles.length > 0 ? config.secrets.expiredIn : '365d'
        }, (err, token) => {
            if (err) throw err;

            res.status(200).json({accessToken: token})
        })

    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}
export async function createWithLinkedIn(req, res) {
    const { code, redirect_uri, platform, newsletter, country } = req.body;

    try {
        
        if (!code ) throw { message: 'INVALID_CODE'};

        let response = await axios.request({
            url: `https://www.linkedin.com/oauth/v2/accessToken`,
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: querystring.stringify({
                code,
                redirect_uri,
                client_id: config.linkedinClientId,
                client_secret: config.linkedinClientSecret,
                grant_type: 'authorization_code',
            })
        });

        if (response.status != 200) throw { mmessge: 'INVAILD_DATA'}
    
        const accessToken = response.data.access_token;

        response = await axios.request({
            url: `https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))`,
            method: 'get',
            headers: {
                'Authorization':'Bearer ' + accessToken
            }
        });

        if (response.status != 200) throw { mmessge: 'INVAILD_DATA'}

        const email = objectPath.get(response.data, 'elements.0.handle~.emailAddress');

        response = await axios.request({
            url: `https://api.linkedin.com/v2/me?projection=(id, localizedFirstName, localizedLastName, firstName,lastName, organizations, vanityName, geoLocation ,profilePicture(displayImage~:playableStreams))`,
            method: 'get',
            headers: {
                'Authorization':'Bearer ' + accessToken
            }
        });

        if (response.status != 200) throw { mmessge: 'INVAILD_DATA'}

        const pic = objectPath.get(response.data, 'profilePicture.displayImage~.elements.0.identifiers.0.identifier');
        const firstName = objectPath.get(response.data, 'localizedFirstName');
        const lastName = objectPath.get(response.data, 'localizedLastName');

        if (!validator.isEmail(email)) throw { message: 'INVALID_EMAIL'};

        var user = await User.findOne({email: email});
        if (user) {
            throw {message: 'ALREADY_EXIST'};
        } else {
            try {
                var newUser = new User({
                    pic,
                    firstName,
                    email,
                    lastName,
                    emailConfirmed: true,
                    linkedin: true,
                    platform,
                    newsletter,
                    country,
                    linkedInProfileUrl: 'https://www.linkedin.com/in/'+ objectPath.get(response.data, 'vanityName')
                });
                const salt = await bcrypt.genSalt(10);
                newUser.password = await bcrypt.hash('NewUser2021!', salt);
                user = await newUser.save();
            } catch (err) {
            }
            try {
                await createSocket(user._id.toString())
            } catch (error) {
                console.log(error)
            }
        }

        const tokenData = {
            user: {
                id: user._id
            }
        };

        try{
            await ses.sendEmailToAdminForNewUserRegistered(user.firstName, user.lastName, user.email,
                [user.platform, user.linkedin? 'linkedin': null, user.newsletter ? 'newsletter': null].filter( el => el).join('/'),
                config.server, country);
        } catch (error) {
            console.log(error);
        }

        try {
             // const adminUser = await User.findOne({ email: 'perseus362434@outlook.com'});
             const adminUser = await User.findOne({ email: 'roberto@startupswallet.com'});
             const data = {
                 env: config.server
             }
             await notificationController.createAppNotification(
                 [adminUser._id],
                 'IT-NEW-REGISTERED-USER',
                 JSON.stringify(data)
             )
        } catch (error) {
            
        }

        jwt.sign(tokenData, config.secrets.session, {
            expiresIn: config.secrets.expiredIn
        }, (err, token) => {
            if (err) throw err;
            res.status(200).json({accessToken: token});
        })

    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

export async function createWithApple(req, res) {
    const { email, identityToken, user, firstName, lastName, newsletter, country } = req.body;

    try {

        const json = jwt.decode(identityToken, { complete: true});

        const kid = json.header.kid;

        const appleKey = (await jwks.getSigningKey(kid)).getPublicKey();

        const payload = jwt.verify(identityToken, appleKey);
        if (!payload) throw { message: 'INVALID_TOKEN'};

        if (payload.sub != user) throw { message: 'INVALID_USER'}

        // if (!firstName && !payload.family_name) throw { message: 'INVALID_USER'}

        // const email = payload.email;
        if (!validator.isEmail(email)) throw { message: 'INVALID_EMAIL'};

        let existUser = await User.findOne({apple_user: user});
        if (existUser) {
            throw {message: 'ALREADY_EXIST'};
        } else {
            try {
                var newUser = new User({
                    firstName: firstName || payload.family_name || '',
                    email,
                    lastName: lastName || payload.given_name || '',
                    emailConfirmed: true,
                    platform: 'apple',
                    newsletter,
                    country,
                    apple_user: user
                });
                const salt = await bcrypt.genSalt(10);
                newUser.password = await bcrypt.hash('NewUser2021!', salt);
                existUser = await newUser.save();
            } catch (err) {
            }
            try {
                await createSocket(existUser._id.toString());
            } catch (error) {
                console.log(error)
            }
        }

        const tokenData = {
            user: {
                id: existUser._id
            }
        };

        try{
            await ses.sendEmailToAdminForNewUserRegistered(existUser.firstName, existUser.lastName, existUser.email,
                [existUser.platform, existUser.linkedin? 'linkedin': null, existUser.newsletter ? 'newsletter': null].filter( el => el).join('/'),
                config.server, country);
        } catch (error) {
            console.log(error);
        }

        try {
             // const adminUser = await User.findOne({ email: 'perseus362434@outlook.com'});
             const adminUser = await User.findOne({ email: 'roberto@startupswallet.com'});
             const data = {
                 env: config.server
             }
             await notificationController.createAppNotification(
                 [adminUser._id],
                 'IT-NEW-REGISTERED-USER',
                 JSON.stringify(data)
             )
        } catch (error) {
            
        }

        jwt.sign(tokenData, config.secrets.session, {
            expiresIn: config.secrets.expiredIn
        }, (err, token) => {
            if (err) throw err;
            res.status(200).json({accessToken: token});
        })

    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}
export async function forgot(req, res) {
    const { email} = req.body;

    try {
        
        if (!validator.isEmail(email)) throw { message: 'INVALID_EMAIL'};

        let user = await User.findOne({ email });

        if (!user) throw { message: 'NO_EXIST'};

        const tokenData = {
            user: {
                id: user._id,
                emailConfirmed: user.emailConfirmed
            }
        };

        jwt.sign(tokenData, config.secrets.session, {
            expiresIn: 604800
        }, (err, token) => {
            if (err) throw err;
            ses.sendEmailForUserResetPassword(user.firstName ,user.email, token);
            res.status(200).json({success: true})
        })

    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}
export async function resetPassword(req, res) {
    
    const { password } = req.body
    const id = req.user.id;
    try {
        if (!password) {
            throw {}
        }
        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash(password, salt);
        const user = await User.findOneAndUpdate({ _id: id}, {password: newPassword, emailConfirmed: true});

        const tokenData = {
            user: {
                id
            }
        };

        jwt.sign(tokenData, config.secrets.session, {
            expiresIn: config.secrets.expiredIn
        }, (err, token) => {
            if (err) throw err;
            res.status(200).json({accessToken: token});
        })
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

export async function getAllRoles(req, res) {
    try {
        var roles = await Role.find({});
        return res.send(roles);
    } catch (error) {
        return res.status(422).json(error);
    }
}

export async function getAllPermissions(req, res) {
    try {
        var permissions = await Permission.find({})
        return res.send(permissions);
    } catch (error) {
        return res.status(422).json(error);
    }
}

export async function checkSocketByUserId(req, res) {

    const {userId} = req.body;
    try {
        const user = await User.findById(userId);
        if (user) {
            await createSocket(userId);
            res.send({success: true});
        } else {
            res.status(422).json({ message: 'NO_USER'})
        }
    } catch (error) {
        console.log(error)
        res.status(422).json(error)
    }
}
export async function refreshSockets( req, res) {

    try {
        
        const users = await User.find({});
        gbl_socket = [];

        for (var i = 0 ; i < users.length; i++) {
            await createSocket(users[i]._id.toString())
        }

        res.send({success: true})
    } catch (error) {
        res.status(422).json(error)
    }
    
}
export async function uploadPicture(req, res) {
    const userId = req.user.id;
    try {
        let result;
        if (req.files && req.files.pic) {
            result = await s3Controller.uploadSmallFileFromFileData(req.files.pic.data, `user/${userId}/${new Date().getTime()}_avatar.jpg`);
        }
        if (result) {
            var user = await User.findOneAndUpdate({ _id: userId}, { pic: result}, {new: true}).select('-password');
            res.send(user)
        } else {
            return res.status(422).json();
        }
    } catch (error) {
        console.log(error);
        return res.status(422).json();
    }
}

export async function getRoles(req, res) {
    const payload = req.body;
    const query = new QueryModel(payload.filter, payload.sort, payload.page, payload.size);
    try {
        var roles = await Role.find(query.filter, null , { skip: (query.page - 1) * query.size , limit: query.size, }).sort(query.sort).lean()
        var totalCount = await Role.countDocuments(query.filter);
        return res.send({
            items: roles,
            totalCount
        });
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

export async function createRole(req, res) {

    const {_id, ...payload } = req.body;
    try {

        const newRole = new Role(payload);
        const role = await newRole.save();

        return res.send(role);
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}
export async function updateRole(req, res) {

    const {_id, ...payload } = req.body;
    try {

        if (!_id) throw {};

        const role = await Role.findOneAndUpdate({_id: _id}, payload, {new: true})
        return res.send(role);
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}
export async function getRoleById(req, res) {
    
    const id = req.params.id;
    try {
        const role = await Role.findOne({ _id: id})
        if (role) {
            return res.send(role);
        }
        throw {message: 'NOT_EXIST'};
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

export async function getAnalyticsByPeriod(req, res) {
    const { filter, sort, page, size, startTime, endTime} = req.body;
    const query = new QueryModel(filter, sort, page, size);
    try {

        if (query.filter.followedCategories) {
            const aliases = await Alias.find({'names.value': new RegExp(query.filter.followedCategories, 'i')});
            query.filter._id =  { $in : aliases.reduce((carry, item) => {
                return union(item.follows, carry);
            }, [] )};
            delete query.filter.followedCategories;
        }

        const start = moment(startTime).toDate();
        const end = moment(endTime).toDate();
        const pipelines = [
            {
                $match: query.filter
            },
            { 
                $match: {
                    $and: [
                        {"createdAt": {$gte: start}},
                        {"createdAt": {$lt: end}}
                    ]
                }
            },
            {
                $lookup:
                {
                    from: "transactions",
                    let: { userId: "$_id"},
                    pipeline: [
                        { $match:
                            { $expr:
                                { $and:
                                    [
                                        { $eq: ["$$userId" ,"$ref"] },
                                        { $eq: ["$type" ,"user.connection"] },
                                        { $gte: [{ $arrayElemAt: ['$values.date', -1 ] }, start]},
                                        { $lt: [{ $arrayElemAt: ['$values.date', 0 ] }, end]}
                                    ]
                                }
                            }
                        },
                        {
                            $addFields: {
                                increased: {
                                    $let: {
                                        vars: {
                                            start: {
                                                $reduce: {
                                                    input: '$values',
                                                    initialValue: 0,
                                                    in: {
                                                        $cond: {
                                                            if: {$lt: ['$$this.date', start]},
                                                            then: '$$this.value',
                                                            else: '$$value'
                                                        }
                                                    }
                                                }
                                            },
                                            end: {
                                                $reduce: {
                                                    input: '$values',
                                                    initialValue: 0,
                                                    in: {
                                                        $cond: {
                                                            if: {$lte: ['$$this.date', end]},
                                                            then: '$$this.value',
                                                            else: '$$value'
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        in: { 
                                            $cond: {
                                                if: {$lt: [{ $arrayElemAt: ['$values.date', 0 ] }, start]},
                                                then: { $subtract: ['$$end', '$$start']},
                                                else: '$$end'
                                            }
                                        }
                                    }
                                },
                            }
                        },
                        { $project: { _id: 1, increased: 1 } }
                    ],
                    as: "connectedCount"
                }
            },
            {
                $lookup:
                {
                    from: "aliases",
                    let: { userId: "$_id"},
                    pipeline: [
                        { $match:
                            { $expr:
                                { $and:
                                    [
                                        { $in: ["$$userId" ,"$follows"] }
                                    ]
                                }
                            }
                        },
                        { $project: { _id: 1 } }
                    ],
                    as: "followedCategories"
                }
            },
            {
                $lookup:
                {
                    from: "campaigns",
                    let: { userId: "$_id"},
                    pipeline: [
                        { $match:
                            { $expr:
                                { $and:
                                    [
                                        { $in: ["$$userId" ,"$follows"] }
                                    ]
                                }
                            }
                        },
                        { $project: { _id: 1} }
                    ],
                    as: "followedCampaignsCount"
                }
            },
            {
                $lookup:
                {
                    from: "wallets",
                    let: { userId: "$_id"},
                    pipeline: [
                        { $match:
                            { $expr:
                                { $and:
                                    [
                                        { $eq: ["$$userId" ,"$user"] }
                                    ]
                                }
                            }
                        },
                        { $project: { _id: 1 } }
                    ],
                    as: "walletCount"
                }
            },
            {
                $addFields: {
                    'connectedCount': { $sum: '$connectedCount.increased'},
                    'followedCategoriesCount': { $size: '$followedCategories'},
                    'followedCampaignsCount': { $size: '$followedCampaignsCount'},
                    'followedCampaigns': '$followedCampaignsCount',
                    'walletCount': { $size: '$walletCount'}
                }
            },
            {
                $facet: {
                    meta: [
                        {
                            $count: 'total'
                        }
                    ],
                    data:[
                        { $sort: query.sort },
                        { '$skip': (page - 1) * size },
                        { '$limit': size }
                    ]
                }
            }
        ];

        const aggregateResult = await User.aggregate([
            ...pipelines,
        ])

        let items = aggregateResult.length ? aggregateResult[0].data: [];
        items.forEach( item => {
            item.followedCategories = item.followedCategories.map( el => el._id);

            const socket_iter = gbl_sockets.find( el => el.target == item._id.toString());
            item.connected = socket_iter && socket_iter.connected;
        });
        items.forEach( item => {
            item.followedCampaigns = item.followedCampaigns.map( el => el._id)
        });

        items = await Alias.populate( items, {
            path: 'followedCategories', select: 'names confirmed'
        });

        items = await Campaign.populate( items, {
            path: 'followedCampaigns', select: 'name link logo description status typology source systemTitle'
        });

        items = await Source.populate( items, {
            path: 'followedCampaigns.source', select: 'name link dxDay'
        });

        const totalCount = aggregateResult.length && aggregateResult[0].meta[0] ? aggregateResult[0].meta[0].total : 0;

        const registeredUsers = totalCount; // await User.countDocuments({ $and: [{createdAt: {$gte: start}}, { createdAt: {$lt: end}}]});


        const totalPipelines = [
            {
                $match: query.filter
            },
            { 
                $match: {
                    $and: [
                        {"createdAt": {$gte: start}},
                        {"createdAt": {$lt: end}}
                    ]
                }
            },
            {
                $lookup:
                {
                    from: "transactions",
                    let: { userId: "$_id"},
                    pipeline: [
                        { $match:
                            { $expr:
                                { $and:
                                    [
                                        { $eq: ["$$userId" ,"$ref"] },
                                        { $eq: ["$type" ,"user.connection"] },
                                        { $gte: [{ $arrayElemAt: ['$values.date', -1 ] }, start]},
                                        { $lt: [{ $arrayElemAt: ['$values.date', 0 ] }, end]}
                                    ]
                                }
                            }
                        },
                        {
                            $addFields: {
                                increased: {
                                    $let: {
                                        vars: {
                                            start: {
                                                $reduce: {
                                                    input: '$values',
                                                    initialValue: 0,
                                                    in: {
                                                        $cond: {
                                                            if: {$lt: ['$$this.date', start]},
                                                            then: '$$this.value',
                                                            else: '$$value'
                                                        }
                                                    }
                                                }
                                            },
                                            end: {
                                                $reduce: {
                                                    input: '$values',
                                                    initialValue: 0,
                                                    in: {
                                                        $cond: {
                                                            if: {$lte: ['$$this.date', end]},
                                                            then: '$$this.value',
                                                            else: '$$value'
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        in: { 
                                            $cond: {
                                                if: {$lt: [{ $arrayElemAt: ['$values.date', 0 ] }, start]},
                                                then: { $subtract: ['$$end', '$$start']},
                                                else: '$$end'
                                            }
                                        }
                                    }
                                },
                            }
                        },
                        { $project: { _id: 1, increased: 1 } }
                    ],
                    as: "connectedCount"
                }
            },
            {
                $lookup:
                {
                    from: "aliases",
                    let: { userId: "$_id"},
                    pipeline: [
                        { $match:
                            { $expr:
                                { $and:
                                    [
                                        { $in: ["$$userId" ,"$follows"] }
                                    ]
                                }
                            }
                        },
                        { $project: { _id: 1 } }
                    ],
                    as: "followedCategories"
                }
            },
            {
                $lookup:
                {
                    from: "campaigns",
                    let: { userId: "$_id"},
                    pipeline: [
                        { $match:
                            { $expr:
                                { $and:
                                    [
                                        { $in: ["$$userId" ,"$follows"] }
                                    ]
                                }
                            }
                        },
                        { $project: { _id: 1} }
                    ],
                    as: "followedCampaignsCount"
                }
            },
            {
                $lookup:
                {
                    from: "wallets",
                    let: { userId: "$_id"},
                    pipeline: [
                        { $match:
                            { $expr:
                                { $and:
                                    [
                                        { $eq: ["$$userId" ,"$user"] }
                                    ]
                                }
                            }
                        },
                        { $project: { _id: 1 } }
                    ],
                    as: "walletCount"
                }
            },
            {
                $addFields: {
                    'connectedCount': { $sum: '$connectedCount.increased'},
                    'followedCategoriesCount': { $size: '$followedCategories'},
                    'followedCampaignsCount': { $size: '$followedCampaignsCount'},
                    'followedCampaigns': '$followedCampaignsCount',
                    'walletCount': { $size: '$walletCount'}
                }
            },
            {
                $facet: {
                    meta: [
                        {
                            $count: 'total'
                        }
                    ],
                    data:[
                        { $sort: query.sort }
                    ]
                }
            }
        ];

        const totalAggregateResult = await User.aggregate([
            ...totalPipelines,
        ]);
        let totalItems = totalAggregateResult.length ? totalAggregateResult[0].data: [];

        const androidCount = totalItems.filter(ele => ele.platform == 'android').length;
        const iosCount = totalItems.filter(ele => ele.platform == 'ios').length;
        const webCount = totalItems.filter(ele => ele.platform == 'web').length;
        const newsletterCount = totalItems.filter(ele => ele.newsletter).length;
        const appleCount = totalItems.filter(ele => ele.platform == 'apple').length;
        const androidBrowserCount = totalItems.filter(ele => ele.platform == 'android browser').length;
        const iosBrowserCount = totalItems.filter(ele => ele.platform == 'ios browser').length;

        return res.send({
            items,
            totalCount,
            registeredUsers,
            androidCount,
            iosCount,
            webCount,
            newsletterCount,
            appleCount,
            androidBrowserCount,
            iosBrowserCount
        });
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}
export async function getCountByState(req, res) {
    try {
        const result = {
            all: 0,
            valid: 0,
            bad: 0,
            no_confirmed: 0,
            deleted: 0
        }

        result.all = await User.countDocuments({inValid: { $ne: true}});
        result.valid = await User.countDocuments({inValid: { $ne: true}, emailConfirmed: true, deleted: {$ne: 'yes'}});
        result.bad =  await User.countDocuments({ inValid: true});
        result.no_confirmed = await User.countDocuments({emailConfirmed: {$ne: true}, deleted: {$ne: 'yes'}});
        result.deleted =  await User.countDocuments({ deleted: 'yes'});
        
        return res.send(result);
    } catch (error) {
        console.log(error)
        return res.status(422).json(error);
    }
}

export async function init(){
    try {
    
        var user = await User.findOne({ email: 'roberto@startupswallet.com'});
        if (!user) {
            const newUser = new User({
                firstName: 'Roberto',
                lastName: 'Caiazzo',
                isAdmin: true,
                email: 'roberto@startupswallet.com',
                pic: './assets/media/users/admin.png',
            });
            const salt = await bcrypt.genSalt(10);
            newUser.password = await bcrypt.hash('Roby1987!', salt);

            await newUser.save();
        } else {
            await User.findOneAndUpdate({_id: user._id}, { isAdmin: true})
        }
        user = await User.findOne({ email: 'perseus362434@outlook.com'});
        if (!user) {
            const newUser = new User({
                firstName: 'Zhijia',
                lastName: 'Lee',
                email: 'perseus362434@outlook.com',
                isAdmin: true
            });

            const salt = await bcrypt.genSalt(10);
            newUser.password = await bcrypt.hash('Zhijia2020!', salt);

            user = await newUser.save();

            await newUser.save();
        } else {
            await User.findOneAndUpdate({_id: user._id}, { isAdmin: true})
        }
        
        const users = await User.find({});
        for (let i = 0 ; i< users.length; i++) {
            user = users[i];
            if (user.from == 'newsletter') {
                user.newsletter = true;
            }
            if (user.from == 'linkedin') {
                user.linkedin = true;
            }
            if (user.from == 'web') {
                user.platform = 'web'
            }
            if (user.from == 'apple') {
                user.platform = 'apple';
            }
            await User.findOneAndUpdate({_id: user._id}, { newsletter: user.newsletter, platform: user.platform || 'web', linkedin: user.linkedin}, {timestamps: false});
        }

    } catch (error) {
        console.log(error)
    }
}