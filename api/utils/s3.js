'use strict';

import config from '../../config/environment';
import axios from 'axios';

const AWS = require('aws-sdk');
const sharp = require('sharp');
const got = require("got");

const s3 = new AWS.S3({
    accessKeyId: config.aws.accessKey,
    secretAccessKey: config.aws.secretKey
});

export async function uploadBigFile(inpath, outpath) {

    return new Promise( async (resolve, reject) => {

        if (!inpath || !outpath) {
            return resolve(null)
        }
        try {
            const response = await axios({
                method: 'get',
                url: inpath,
                responseType: 'arraybuffer'
            })
    
            if (response.status != 200) {
                return resolve(null)
            }
            
            const sharpStream = sharp(response.data);

            sharpStream
            .clone()
            .resize({ height: 465})
            .jpeg()
            .toBuffer()
            .then( data => { 
                const params = {
                    Bucket: config.aws.s3.bucket,
                    Key: outpath,
                    Body: data,
                    ACL:'public-read',
                    ContentType: 'image/jpg'
                };
                
                s3.upload(params, function(err, data) {
                    if (err) {
                        resolve(null)
                    } else {
                        resolve(data.Location);
                    }
                });
            })
            .catch( err => { 
                resolve(null)
            });   
        } catch (error) {
            resolve(null)
        }


    });
    
}

export async function uploadSmallFile(inpath, outpath) {

    return new Promise( async (resolve, reject) => {
        
        if (!inpath || !outpath) {
            return resolve(null)
        }
        try {
            const response = await axios({
                method: 'get',
                url: inpath,
                responseType: 'arraybuffer'
            })
    
            if (response.status != 200) {
                return resolve(null)
            }  
            
            const sharpStream = sharp(response.data);

            sharpStream
            .clone()
            .resize({ height: 200})
            .jpeg()
            .toBuffer()
            .then( data => { 
                const params = {
                    Bucket: config.aws.s3.bucket,
                    Key: outpath,
                    Body: data,
                    ACL:'public-read',
                    ContentType: 'image/jpg'
                };
                
                s3.upload(params, (err, data) => {
                    if (err) {
                        resolve(null);
                    } else {
                        resolve(data.Location);
                    }
                });
            })
            .catch( err => { 
                resolve(null)
            });
        } catch (error) {
            console.log(error, inpath )
            resolve(null)
        }
    });
    
}
export async function uploadSmallFileFromFileData(data, outpath) {

    return new Promise( async (resolve, reject) => {
        
        if (!data || !outpath) {
            return resolve(null)
        }
        try {
            const sharpStream = sharp(data);

            sharpStream
            .clone()
            .resize({ height: 100})
            .jpeg()
            .toBuffer()
            .then( data => { 
                const params = {
                    Bucket: config.aws.s3.bucket,
                    Key: outpath,
                    Body: data,
                    ACL:'public-read',
                    ContentType: 'image/jpg'
                };
                
                s3.upload(params, (err, data) => {
                    if (err) {
                        console.log(err)
                        resolve(null);
                    } else {
                        resolve(data.Location);
                    }
                });
            })
            .catch( err => { 
                console.log(err)
                resolve(null)
            });
        } catch (error) {
            console.log(error, inpath )
            resolve(null)
        }
    });
    
}