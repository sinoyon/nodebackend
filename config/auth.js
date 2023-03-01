const jwt = require("jsonwebtoken");

import config from '../config/environment';
import { User } from '../api/user/user.model';

export function auth(roles = []) {
    return async (req, res, next) => {
        const authorizationHeader = req.headers['authorization'];
        if (!authorizationHeader) return res.status(401).json({ message: 'NO_AUTHORIZATION_HEADER'});
        if (authorizationHeader.split(' ')[0] != 'Bearer') return res.status(401).json({ message: 'INVALID_AUTHORIZATION_HEADER'});
        const token = authorizationHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'INVALID_TOKEN'});

        try {
            const decoded = jwt.verify(token, config.secrets.session);

            req.user = decoded.user;

            const filter = {
                _id: req.user.id
            };
            if (roles.length > 0) {
                filter.roles = {
                    $in: roles
                }
            }
            const user = await User.findOne(filter).select('-password')
            if (!user) throw { message: 'NO_USER'}
            
            req.user = user;
            
            next();
        } catch (error) {
            console.log(error);
            res.status(500).send({ message: 'INVALID_TOKEN' });
        }
    }
}
