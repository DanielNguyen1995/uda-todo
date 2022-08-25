import * as AWS from 'aws-sdk'
import { env } from 'process'
const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
const bucketName = env.ATTACHMENT_S3_BUCKET
const URLExpiration = env.S3_URL_EXPIRATION
const imageBucket = new XAWS.S3({
    signatureVersion: "v4",
})

export const getS3PresignUrl = async (imageId: string) => {
    const signedURL = await imageBucket.getSignedUrl("putObject", {
        Bucket: bucketName,
        Key: imageId,
        Expires: URLExpiration,
    });
    return signedURL;
}