'use strict';

import { Router } from 'express';
import * as controller from './crawling.controller';

var router = new Router();

router.post('/generateSitemap', controller.generateSitemap);

module.exports = router;