const _ = require('underscore')
const AWS = require('aws-sdk')
const fs = require('fs')
const errors = require('../utils/errors')
const Users = require('../models/user')
const utils = require('../utils/utils')

// configuring the AWS environment
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

let s3 = new AWS.S3()

module.exports = () => ({

  /**
   * @param {Object} file File information
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
  },

  /**
   * @param {string} id File information
   * @param {file} file File information
   * @returns {boolean} Result of saving file
   */
  deleteOnFail: async (id, file) => {
    if (process.env.NODE_ENV === 'development-local') {

      try {
        await Users.findOneAndDelete({ _id: id })

        // even if no file is passed, this check makes sure
        if (!_.isUndefined(file)) {
          try {
            fs.unlinkSync(file.path)

            return true
          } catch (e) {
            errors.createAndSaveErrorMessage(e)
            return false
          }
        }

        return true
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        return false
      }

    } else if (process.env.NODE_ENV === 'development-aws') {

      try {
        await Users.findOneAndDelete({ _id: id })

        // even if no file is passed, this check makes sure
        if (file.length > 0) {
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
        await Users.findOneAndDelete({ _id: id })

        // even if no file is passed, this check makes sure
        if (file.length > 0) {
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
  },

  /**
   * @param {Object} user User information
   * @param {file} file File information
   * @returns {Object} Logo upload data (including path)
   */
  createDirAndMoveFile: async (user, file) => {
    if (process.env.NODE_ENV === 'development-local') {

      try {
        // make new dir and move logo
        fs.mkdirSync(`public/uploads/users/${user._id}`, { recursive: true })
        fs.renameSync(file.path, `public/uploads/users/${user._id}/logo.${utils.getFileExtensionFromMimeType(file.mimetype)}`)

        return {
          url: `public/uploads/users/${user._id}/logo.${utils.getFileExtensionFromMimeType(file.mimetype)}`
        }
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        this.deleteFile(file)
        return false
      }

    } else if (process.env.NODE_ENV === 'development-aws') {

      try {
        // copy logo from temporary location to user directory
        const awsCopy = {
          Bucket: `${process.env.AWS_BUCKET_NAME}/development/users/${user._id}`,
          CopySource: file.location,
          Key: `logo.${utils.getFileExtensionFromMimeType(file.mimetype)}`
        }
        // since aws does not offer a 'move' api, must delete after copy
        const awsDelete = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `${file.key}`
        }

        // perform operations
        await s3.copyObject(awsCopy).promise()
        await s3.deleteObject(awsDelete).promise()

        return {
          Bucket: `${process.env.AWS_BUCKET_NAME}/development/users/${user._id}`,
          Key: `logo.${utils.getFileExtensionFromMimeType(file.mimetype)}`,
          url: `${process.env.AWS_BASE_URL}/development/users/${user._id}/logo.${utils.getFileExtensionFromMimeType(file.mimetype)}`
        }
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        this.deleteFile(file)
        return false
      }

    } else if (process.env.NODE_ENV === 'production') {

      try {
        // copy logo from temporary location to user directory
        const awsCopy = {
          Bucket: `${process.env.AWS_BUCKET_NAME}/production/users/${user._id}`,
          CopySource: file.location,
          Key: `logo.${utils.getFileExtensionFromMimeType(file.mimetype)}`
        }
        // since aws does not offer a 'move' api, must delete after copy
        const awsDelete = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `${file.key}`
        }

        // perform operations
        await s3.copyObject(awsCopy).promise()
        await s3.deleteObject(awsDelete).promise()

        return {
          Bucket: `${process.env.AWS_BUCKET_NAME}/production/users/${user._id}`,
          Key: `logo.${utils.getFileExtensionFromMimeType(file.mimetype)}`,
          url: `${process.env.AWS_BASE_URL}/${process.env.AWS_BUCKET_NAME}/production/users/${user._id}/logo.${utils.getFileExtensionFromMimeType(file.mimetype)}`
        }
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        this.deleteFile(file)
        return false
      }

    }
  },

  /**
   * @param {Object} user User information
   * @param {file} file File information
   * @returns {Object} Logo upload data (including path)
   */
  updateFile: async (user, file) => {
    if (process.env.NODE_ENV === 'development-local') {

      try {
        // replace logo
        fs.renameSync(file.path, `public/uploads/users/${user._id}/logo.${utils.getFileExtensionFromMimeType(file.mimetype)}`)

        return true
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        this.deleteFile(file)
        return false
      }

    } else if (process.env.NODE_ENV === 'development-aws') {

      try {
        const awsCopy = {
          Bucket: `${process.env.AWS_BUCKET_NAME}/development/users/${user._id}`,
          CopySource: file.location,
          Key: `logo.${utils.getFileExtensionFromMimeType(file.mimetype)}`
        }
        const awsDelete = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: file.key
        }

        await s3.copyObject(awsCopy).promise()
        await s3.deleteObject(awsDelete).promise()

        return true
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        this.deleteFile(file)
        return false
      }

    } else if (process.env.NODE_ENV === 'production') {

      try {
        const awsCopy = {
          Bucket: `${process.env.AWS_BUCKET_NAME}/production/users/${user._id}`,
          CopySource: file.location,
          Key: `logo.${utils.getFileExtensionFromMimeType(file.mimetype)}`
        }
        const awsDelete = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: file.key
        }

        await s3.copyObject(awsCopy).promise()
        await s3.deleteObject(awsDelete).promise()

        return true
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        this.deleteFile(file)
        return false
      }
    }
  }
})
