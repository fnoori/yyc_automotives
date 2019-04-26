const _ = require('underscore')
const AWS = require('aws-sdk')

// configuring the AWS environment
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

s3 = new AWS.S3()

export default {
  deleteFile: (file) => {
    if (process.env.NODE_ENV === 'development-local') {

    } else if (process.env.NODE_ENV === 'development-aws') {

    } else if (process.env.NODE_ENV === 'production') {

    }
  }
}