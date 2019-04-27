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

  /**
   * @param {JSON} file File information
   * @returns {boolean} Result of deleting file
   */
  deleteFile: async (file) => {
    if (!_.isUndefined(file)) {
      if (process.env.NODE_ENV === 'development-local') {

        try {
          fs.unlinkSync(file.path)

          return true
        } catch (e) {
          errors.createAndSaveErrorMessage(e)
          return false
        }

      } else if (process.env.NODE_ENV === 'development-aws') {

        // TODO: possibly join this else-if with the production else-if
        try {
          if (!_.isUndefined(file)) {
            let awsDelete = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: file.key
            }
            await s3.deleteObject(awsDelete).promise()
          }

          return true
        } catch (e) {
          errors.createAndSaveErrorMessage(e)
          return false
        }

      } else if (process.env.NODE_ENV === 'production') {

        try {
          if (!_.isUndefined(file)) {
            let awsDelete = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: file.key
            }
            await s3.deleteObject(awsDelete).promise()
          }

          return true
        } catch (e) {
          errors.createAndSaveErrorMessage(e)
          return false
        }

      }
    }
  }
})
