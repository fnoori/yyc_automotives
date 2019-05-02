const express = require('express')
const router = express.Router()
const Controller = require('../controllers/vehicle')
const passport = require('passport')
const validation = require('../validations/vehicleValidation')
const mongoose = require('mongoose')
const multer = require('multer')
const utils = require('../utils/utils')

let upload

// filter to only allow images
// file must be PNG/jpeg
let fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpeg') {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

// local development environment, files uploaded locally
if (process.env.NODE_ENV === 'development-local') {

  let storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads/tmp')
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`)
    }
  })

  upload = multer({
    storage: storage,
    fileFilter: fileFilter
  })

// aws development environment
} else if (process.env.NODE_ENV === 'development-aws') {

  let aws = require('aws-sdk')
  let multerS3 = require('multer-s3')

  // configure aws with keys
  let s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })

  // configure s3 multer, to upload directly to aws
  upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_BUCKET_NAME,
      acl: 'public-read',
      cacheControl: 'no-cache',
      key: function (req, file, cb) {
        // create cryptographically secure random filename
        cb(null, `development/uploads/${mongoose.Types.ObjectId()}.${utils.getFileExtensionFromMimeType(file.mimetype)}`)
      }
    }),
    fileFilter: fileFilter
  })

// production environment
} else if (process.env.NODE_ENV === 'production') {

  let aws = require('aws-sdk')
  let multerS3 = require('multer-s3')

  // configure aws with keys
  let s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })

  // filter to only allow images
  fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png') {
      cb(null, true)
    } else {
      cb(null, false)
    }
  }

  // configure s3 multer, to upload directly to aws
  upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_BUCKET_NAME,
      acl: 'public-read',
      cacheControl: 'no-cache',
      key: function (req, file, cb) {
        // create cryptographically secure random filename
        cb(null, `production/uploads/${mongoose.Types.ObjectId()}.${utils.getFileExtensionFromMimeType(file.mimetype)}`)
      }
    }),
    fileFilter: fileFilter
  })

}

// get routes with various parameters
//  parameters are passed as query.parameters
router.get('/get-regular-vehicles/:skip/:limit', Controller.getRegularVehicles)
router.get('/get-vehicle-by-id/:vehicle_id', Controller.getVehicleById)
router.get('/get-vehicles-by-dealership-id/:dealership_id', Controller.getVehiclesByDealershipId)
router.get('/get-premium-vehicles/:skip/:limit', Controller.getPremiumVehicles)

// create new vehicle route
// arguments: { *see vehicle model for full argument list* }
// protected route
router.post('/new-vehicle',
  passport.authenticate('jwt', { session: false }),
  upload.array('images', 10),
  validation.validate('addNewVehicle'),
  Controller.addNewVehicle)

// update vehicle router
// arguments: { *see vehicle model for full argument list* }
// protected route
router.patch('/update-vehicle/:vehicle_id',
  passport.authenticate('jwt', { session: false }),
  upload.array('images', 10),
  validation.validate('updateVehicle'),
  Controller.updateVehicle)

// delete vehicle
// arguments: { vehicle_id }
// protected route
router.delete('/delete-vehicle/:vehicle_id',
  passport.authenticate('jwt', { session: false }),
  Controller.deleteVehicle)

// delete vehicle photos
// arguments: { vehicle_id, images[] }
// protected route
router.delete('/delete-photos/:vehicle_id',
  passport.authenticate('jwt', { session: false }),
  Controller.deletePhotos)

module.exports = router
