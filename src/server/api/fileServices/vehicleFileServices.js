const _ = require('underscore')
const AWS = require('aws-sdk')
const fs = require('fs')
const errors = require('../utils/errors')
const Vehicles = require('../models/vehicle')
const utils = require('../utils/utils')

// configuring the AWS environment
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

let s3 = new AWS.S3()

module.exports = () => ({

  /**
   * @param {Object} files Files information
   * @returns {boolean} Result of deleting file
   */
  deleteFiles: async (files) => {
    if (!_.isUndefined(files)) {

      if (process.env.NODE_ENV === 'development-local') {

        try {
          for (const file of files) {
            fs.unlinkSync(file.path)
          }

          return true
        } catch (e) {
          errors.createAndSaveErrorMessage(e)
          return false
        }

      } else if (process.env.NODE_ENV === 'development-aws') {

        try {
          let awsDelete = {}

          for (const file of files) {
            awsDelete = {
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
          let awsDelete = {}

          for (const file of files) {
            awsDelete = {
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

    } else {
      return true
    }
  },

  /**
   * @param {Object} user User information
   * @param {files} files File information
   * @returns {Object} Files upload paths
   */
  createDirAndMoveFile: async (vehicle, files) => {
    if (process.env.NODE_ENV === 'development-local') {
    
      try {
        let fileLocations = []

        fs.mkdirSync(`public/uploads/users/${vehicle.dealership}/${vehicle._id}`, { recursive: true })

        for (const file of files) {
          fs.renameSync(file.path, `public/uploads/users/${vehicle.dealership}/${vehicle._id}/${file.filename}`)
          fileLocations.push({
            url: `public/uploads/users/${vehicle.dealership}/${vehicle._id}/${file.filename}`
          })
        }

        return fileLocations
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        this.deleteFiles(files)
        return false
      }

    } else if (process.env.NODE_ENV === 'development-aws') {

      try {
        let awsCopy = {}
        let awsDelete = {}
        let fileLocations = []
  
        // step through vehicle images and move from
        //  temporary directory to vehicle's directory
        for (const file of files) {
          awsCopy = {
            Bucket: `${process.env.AWS_BUCKET_NAME}/development/users/${vehicle.dealership}/${vehicle._id}`,
            CopySource: file.location,
            Key: file.key.split('/')[2]
          }
          awsDelete = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.key
          }
  
          // add links to the vehicle data in db
          fileLocations.push({
            Bucket: `${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${vehicle.dealership}/${vehicle._id}`,
            Key: file.key.split('/')[2],
            url: `${process.env.AWS_BASE_URL}/${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${vehicle.dealership}/${vehicle._id}/${file.key.split('/')[2]}`
          })
  
          // perform aws operations
          await s3.copyObject(awsCopy).promise()
          await s3.deleteObject(awsDelete).promise()
        }
  
        return fileLocations 
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        this.deleteFiles(files)
        return false        
      }
 
    } else if (process.env.NODE_ENV === 'production') {

      try {
        let awsCopy = {}
        let awsDelete = {}
        let fileLocations = []
  
        // step through vehicle images and move from
        //  temporary directory to vehicle's directory
        for (const file of files) {
          awsCopy = {
            Bucket: `${process.env.AWS_BUCKET_NAME}/production/users/${vehicle.dealership}/${vehicle._id}`,
            CopySource: file.location,
            Key: file.key.split('/')[2]
          }
          awsDelete = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.key
          }
  
          // add links to the vehicle data in db
          fileLocations.push({
            Bucket: `${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${vehicle.dealership}/${vehicle._id}`,
            Key: file.key.split('/')[2],
            url: `${process.env.AWS_BASE_URL}/${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${vehicle.dealership}/${vehicle._id}/${file.key.split('/')[2]}`
          })
  
          // perform aws operations
          await s3.copyObject(awsCopy).promise()
          await s3.deleteObject(awsDelete).promise()
        }
  
        return fileLocations 
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        this.deleteFiles(files)
        return false        
      }      

    }
  },

  /**
   * @param {string} id Vehicle id
   * @param {file} file Files information
   * @returns {boolean} Result of deleting files
   */
  deleteOnFail: async (id, files) => {

    if (!_.isUndefined(files)) {

      if (process.env.NODE_ENV === 'development-local') {

        try {
          await Vehicles.findOneAndDelete({ _id: id })

          for (const file of files) {
            fs.unlinkSync(file.path)
          }

          return true
        } catch (e) {
          errors.createAndSaveErrorMessage(e)
          return false
        }
  
      } else if (process.env.NODE_ENV === 'development-aws') {
  
        try {
          await Vehicles.findOneAndRemove({ _id: id })
          
          let awsDelete = {}
          for (const file of files) {
            awsDelete = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: file.key
            }
    
            await s3.deleteObject(awsDelete).promise()            
          }

          return true
      
        } catch (e) {
          console.log(e)
          return false
        }
  
      } else if (process.env.NODE_ENV === 'production') {
  
        try {
          await Vehicles.findOneAndRemove({ _id: id })
          
          let awsDelete = {}
          for (const file of files) {
            awsDelete = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: file.key
            }

            await s3.deleteObject(awsDelete).promise()            
          }

          return true
        } catch (e) {
          console.log(e)
          return false
        } 

      }

    } else {
      return true
    }

  },

  /**
   * @param {string} id Vehicle id
   * @param {file} file Files information
   * @returns {boolean} Result of updating files
   */
  updateFiles: async (vehicle, files) => {
    if (process.env.NODE_ENV === 'development-local') {

      try {
        let fileLocations = []
        for (const file of files) {
          fs.renameSync(file.path, `public/uploads/users/${vehicle.dealership}/${vehicle._id}/${file.filename}`)

          fileLocations.push({
            url: `public/uploads/users/${vehicle.dealership}/${vehicle._id}/${file.filename}`
          })
        }

        return fileLocations
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        this.deleteFiles(files)
        return false
      }

    } else if (process.env.NODE_ENV === 'development-aws') {

      try {
        let awsCopy = {}
        let awsDelete = {}
        let fileLocations = []

        // need for-loop here, user could upload 1 photo, or 7 photos
        //  this loop catches all conditions
        for (const file of files) {

          awsCopy = {
            Bucket: `${process.env.AWS_BUCKET_NAME}/development/users/${vehicle.dealership}/${vehicle._id}`,
            CopySource: file.location,
            Key: file.key.split('/')[2]
          }
          awsDelete = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.key
          }

          // update photos list in vehicle data
          fileLocations.push({
            Bucket: `${process.env.AWS_BUCKET_NAME}/development/users/${vehicle.dealership}/${vehicle._id}`,
            Key: file.key.split('/')[2],
            url: `${process.env.AWS_BASE_URL}/${process.env.AWS_BUCKET_NAME}/development/users/${vehicle.dealership}/${vehicle._id}/${file.key.split('/')[2]}`
          })

          // perform aws operations
          await s3.copyObject(awsCopy).promise()
          await s3.deleteObject(awsDelete).promise()
        }

        return fileLocations

      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        return false
      }

    } else if (process.env.NODE_ENV === 'production') {

      try {
        let awsCopy = {}
        let awsDelete = {}
        let fileLocations = []

        // need for-loop here, user could upload 1 photo, or 7 photos
        //  this loop catches all conditions
        for (const file of files) {

          awsCopy = {
            Bucket: `${process.env.AWS_BUCKET_NAME}/production/users/${vehicle.dealership}/${vehicle._id}`,
            CopySource: file.location,
            Key: file.key.split('/')[2]
          }
          awsDelete = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.key
          }

          // update photos list in vehicle data
          fileLocations.push({
            Bucket: `${process.env.AWS_BUCKET_NAME}/production/users/${vehicle.dealership}/${vehicle._id}`,
            Key: file.key.split('/')[2],
            url: `${process.env.AWS_BASE_URL}/${process.env.AWS_BUCKET_NAME}/production/users/${vehicle.dealership}/${vehicle._id}/${file.key.split('/')[2]}`
          })

          // perform aws operations
          await s3.copyObject(awsCopy).promise()
          await s3.deleteObject(awsDelete).promise()
        }

        return fileLocations

      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        return false
      }

    }
  },

  /**
   * @param {string} id Vehicle id
   * @param {array} list of files to delete
   * @returns {[array, boolean]} A list of images deleted
   */
  deleteVehiclePhotos: async (vehicle, files) => {
    let matchingImagesUrl = []
    
    if (process.env.NODE_ENV === 'development-local') {

      try {

        for (const file of files) {
          vehicle.images.find(photo => {
            if (photo.url === file) {
              matchingImagesUrl.push(photo.url)
              fs.unlinkSync(photo.url)
            }
          })
        }

        return matchingImagesUrl
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        return false
      }

    } else if (process.env.NODE_ENV === 'development-aws') {

      try {
        // look through the vehicle in db for matching images to verify they exist
        let matchingImages = []
        for (const file of files) {
          vehicle.images.find(photo => {
            if (photo.url === file) {
              matchingImagesUrl.push(photo.url)
              matchingImages.push(photo)
            }
          })
        }

        // loop through files to delete
        // TODO: this could be moved to the above for-loop
        let awsDelete = {}
        for (const image of matchingImages) {
          awsDelete = {
            Bucket: image.Bucket,
            Key: image.Key
          }

          await s3.deleteObject(awsDelete).promise()
        } 

        return matchingImagesUrl
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        return false
      }

    // TODO: this could be merged with the development-aws
    } else if (process.env.NODE_ENV === 'production') {

      try {
        // look through the vehicle in db for matching images to verify they exist
        let matchingImages = []
        for (const file of files) {
          vehicle.images.find(photo => {
            if (photo.url === file) {
              matchingImagesUrl.push(photo.url)
              matchingImages.push(photo)
            }
          })
        }

        // loop through files to delete
        // TODO: this could be moved to the above for-loop
        let awsDelete = {}
        for (const image of matchingImages) {
          awsDelete = {
            Bucket: image.Bucket,
            Key: image.Key
          }

          await s3.deleteObject(awsDelete).promise()
        } 

        return matchingImagesUrl
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        return false
      }

    }
  },

  /**
   * @param {array} files All files to delete
   * @returns {boolean} Result of deleting files
   */
  deleteFilesAndDirectoryOfDeletedVehicle: async (files) => {
    if (process.env.NODE_ENV === 'development-local') {

      try {
        const dirToDelete = utils.getEmptyVehicleDirectoryToDelete(files[0])

        for (const file of files) {
          fs.unlinkSync(file.url)
        }

        fs.rmdirSync(dirToDelete)

        return true
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        return false
      }

    }
  }
})
