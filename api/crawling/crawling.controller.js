const fs = require('fs');

import { Campaign } from './crawling.model';
import axios from 'axios';
import _ from 'lodash';

const FilesService = {
    createXml(items) {
        let str = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
        items.forEach((item) => {
            str = str + `
            <url>
                <loc>${item.href}</loc>
                <changefreq>${item.freq}</changefreq>
                <lastmod>${formatDate()}</lastmod>
            </url>
            `;
        });

        str = str + '</urlset>';
        fs.writeFileSync(`sitemap.xml`, str, 'utf-8');
    },
    createNoIndexXml(items) {
        let str = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
        items.forEach((item) => {
            str = str + `
            <url>
                <loc>${item.href}</loc>
                <changefreq>${item.freq}</changefreq>
                <lastmod>${formatDate()}</lastmod>
            </url>
            `;
        });

        str = str + '</urlset>';
        fs.writeFileSync(`noindex-sitemap.xml`, str, 'utf-8');
    }
}

function formatDate() {
    var d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

export async function generateSitemap(req = null, res = null) {
    try {
        var campaigns = await Campaign.find({ deleted: { $ne : true }, disabled: { $ne : true } });

        const items = campaigns.filter( campaign => campaign.systemTitle ).map( campaign => {
            try {
                return {
                    href: `https://startupswallet.com/crowdfunding/${campaign.systemTitle}`,
                    freq: campaign.status == '1_ongoing' || campaign.status == '2_comingsoon' ? 'hourly' : 'monthly' 
                }
            } catch (error) {
                console.log(error)
                return null;
            }
        });
        items.push(
            {
                href: `https://startupswallet.com/crowdfunding`,
                freq: 'hourly'
            }
        )

        // FilesService.createXml([ {href: 'https://startupswallet.com/campaigns', freq: 'hourly'}, ...items]);

        FilesService.createXml(items);
        if (res) {
            res.send({success: true});
        }

    } catch (error) {
        console.log(error);
        if (res) {
            return res.status(422).json(error);
        }
    }
}
export async function generateNoIndexSitemap(req = null, res = null) {
    try {
        var campaigns = await Campaign.find({});

        campaigns.forEach( async campaign => {
            try {
                const removeUrlRequst = `https://indexing.googleapis.com/v3/urlNotifications:publish`;
                let response = await axios.post(removeUrlRequst, {
                    "url": `https://startupswallet.com/crowdfunding/${campaign._id}`,
                    "type": "URL_DELETED"
                  });
                if (response.status == 200) {
                    console.log(campaign.name)
                }
                
            } catch (error) {
                console.log(error.response.status)
            }
        });
        if (res) {
            res.send({success: true});
        }
    } catch (error) {
        console.log(error);
        if (res) {
            return res.status(422).json(error);
        }
    }
}
