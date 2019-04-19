const express = require('express')
const router = express.Router()
const validation = require('../validations/userValidation')
const mongoose = require('mongoose')
const passport = require('passport')

const Controller = require('../controllers/user')

// imports for aws
let aws = require('aws-sdk')
let multer = require('multer')
let multerS3 = require('multer-s3')
let fileFilter
let upload

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
      cb(null, `${process.env.NODE_ENV}/uploads/${mongoose.Types.ObjectId()}.${file.mimetype.split('/')[1]}`)
    }
  }),
  fileFilter: fileFilter
})

// register route, not guarded
// arguments: { email, password, dealership, (image)logo }
router.post('/register', upload.single('logo'),
  validation.validate('registration'),
  Controller.register)
router.post('/login', Controller.login)

// update user
// arguments (optional): { email, password, dealership, (image)logo }
router.patch('/update-user/:user_id',
  passport.authenticate('jwt', { session: false }),
  upload.single('logo'),
  validation.validate('updateUser'),
  Controller.updateUser)

module.exports = router
