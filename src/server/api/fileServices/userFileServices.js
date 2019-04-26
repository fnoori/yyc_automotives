const _ = require('underscore')
const AWS = require('aws-sdk')
const fs = require('fs')
const errors = require('../utils/errors')

// configuring the AWS environment
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

let s3 = new AWS.S3()

module.exports = () => ({
  deleteFile: async (file) => {
    if (!_.isUndefined(file)) {
      if (process.env.NODE_ENV === 'development-local') {
        try {
          fs.unlinkSync(file.path)

          return true
        } catch (e) {
          console.log(errors.createErrorMessage(e))
          return false
        }
      } else if (process.env.NODE_ENV === 'development-aws') {
      } else if (process.env.NODE_ENV === 'production') {
      }
    }
  }
})