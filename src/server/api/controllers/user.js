const mongoose = require('mongoose')
const Users = require('../models/user')
const _ = require('underscore')
const argon2 = require('argon2')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const AWS = require('aws-sdk')
const { validationResult } = require('express-validator/check')
let s3

// configuring the AWS environment
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

s3 = new AWS.S3()

// register function
// arguments: { email, password, dealership, (image)logo }
exports.register = async (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const dealership = req.body.dealership
  const validations = validationResult(req)

  // ensure validation is empty
  // delete temporary file from aws
  if (!validations.isEmpty()) {
    this.deleteFile(req.file)
    return res.status(422).json({ validations: validations.array({ onlyFirstError: true }) })
  }

  // check if a logo is included
  if (!req.file) {
    return res.status(500).send('must include a logo')
  }

  // check if email/dealership already exists
  // TODO: should be moved to validation file
  const user = await Users.find().or([{ 'email': email }, { 'dealership.name': dealership }])
  if (user.length > 0) {
    this.deleteFile(req.file)
    return res.status(500).send('user already exists')
  }

  // hash password, create new user and save
  try {
    const hash = await argon2.hash(password)

    // create new user
    // created, modified initialized to current date
    const newUser = new Users({
      '_id': new mongoose.Types.ObjectId(),
      'email': email,
      'password': hash,
      'name': dealership,
      'date': {
        'created': new Date(),
        'modified': new Date()
      }
    })

    const saved = await newUser.save()
    try {
      // copy logo from temporary location to user directory
      const awsCopy = {
        Bucket: `${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${saved._id}`,
        CopySource: req['file']['location'],
        Key: `logo.${req['file']['mimetype'].split('/')[1]}`
      }
      // since aws does not offer a 'move' api, must delete after copy
      const awsDelete = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${req['file']['key']}`
      }

      const logoLocation = {
        Bucket: `${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${saved._id}`,
        Key: `logo.${req['file']['mimetype'].split('/')[1]}`,
        url: `${process.env.AWS_BASE_URL}/${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${saved._id}/logo.${req['file']['mimetype'].split('/')[1]}`
      }

      // perform operations
      await s3.copyObject(awsCopy).promise()
      await s3.deleteObject(awsDelete).promise()

      // update the images of vehicle
      // TODO: this could be joined with the save operation
      await Users.findOneAndUpdate({ _id: saved._id }, { logo: logoLocation })

      res.status(200).send('user created successfully')
    } catch (e) {
      console.log(e)
      this.deleteOnFail(saved._id, req.file)
      return res.status(500).send('failed to upload logo')
    }
  } catch (e) {
    console.log(e)
    this.deleteFile(req.file)
    return res.status(500).send('error registering')
  }
}

// update function
// arguments (optional): { email, password, dealership, (image)logo }
exports.updateUser = async (req, res) => {
  const validations = validationResult(req)
  const includesPhotos = !_.isEmpty(req.file)
  let updateUser = {
    dealership: {},
    date: {}
  }

  // ensure validations have passed
  if (!validations.isEmpty()) {
    this.deleteFile(req.file)
    return res.status(422).json({ validations: validations.array({ onlyFirstError: true }) })
  }

  try {
    // find user via the provided token
    const user = await Users.findOne({
      _id: req['user']['_id'],
      email: req['user']['email']
    })

    // extract the information being updated
    if (req.body.confirmation_email) updateUser['email'] = req.body.confirmation_email
    if (req.body.dealership_confirmation) updateUser['dealership']['name'] = req.body.dealership_confirmation
    if (req.body.password_confirmation) {
      try {
        // if password is being updated, hash it then store it
        updateUser['password'] = await argon2.hash(req.body.password)
      } catch (e) {
        console.log(e)
        return res.status(500).send('unable to update password')
      }
    }

    // update modified date
    updateUser['date']['modified'] = new Date()

    // since dealership name is a nested value, if
    //  dealership name is not being updated, the parent value 'dealership' must be
    //  deleted, this is needed for mongoose to work correctly
    if (_.isEmpty(updateUser.dealership)) delete updateUser.dealership

    try {
      // check again if the provided info in the token is correct on update
      const updated = await Users.update({
        _id: req['user']['_id'],
        email: req['user']['email']
      }, updateUser)

      // check if update has failed,
      //  on fail, delete temporary file
      if (updated.n === 0) {
        this.deleteFile(req.file)
        return res.status(500).send('unable to find user')
      }

      // if user is updating their logo, then perform this step
      if (includesPhotos) {
        try {
          const awsCopy = {
            Bucket: `${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${user._id}`,
            CopySource: req['file']['location'],
            Key: `logo.${req['file']['mimetype'].split('/')[1]}`
          }
          const awsDelete = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${req['file']['key']}`
          }

          await s3.copyObject(awsCopy).promise()
          await s3.deleteObject(awsDelete).promise()
        } catch (e) {
          // if aws operation fails, always delete temporary file
          console.log(e)
          this.deleteFile(req.file)
          return res.status(500).send('unable to update logo')
        }
      }
      res.status(200).send('successfully updated user')
    } catch (e) {
      console.log(e)
      return res.status(500).send('unable to update user')
    }
  } catch (e) {
    console.log(e)
    return res.status(500).send('unable to find user')
  }
}

// login function
// arguments: { username, password }
// **NOTE** this is using the PassportJS middleware to authenticate
exports.login = (req, res) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      console.log(err)
      console.log(user)
      return res.status(500).send('error logging in')
    }

    if (info !== undefined) {
      console.log(info)
      return res.status(500).send('error logging in')
    }

    // login user
    req.logIn(user, { session: false }, (err) => {
      if (err) {
        console.log(err)
        return res.status(500).send('error logging in')
      }

      // create token body
      const jwtBody = {
        '_id': user[0]._id,
        'email': user[0].email,
        'dealership': user[0]['dealership'],
        'date': user[0].date
      }

      // token options
      const options = {
        'issuer': process.env.ISSUER,
        'subject': process.env.SUBJECT,
        'audience': process.env.AUDIENCE,
        'expiresIn': process.env.EXPIRES_IN,
        'algorithm': process.env.ALGORITHM
      }

      // create and sign token with the private_key
      const token = jwt.sign({ 'user': jwtBody }, process.env.PRIVATE_KEY, options)

      // return token to user, to store on client side
      res.status(200).json({ 'token': token })
    })
  })(req, res)
}

// TODO: These functions could possibly be moved into a separate file
// delete in case of failed create operations
//  deletes the newly created user from db
//  deletes the file from temporary storage
this.deleteOnFail = async (id, file) => {
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
    console.log(e)
    return false
  }
}

// helper file to delete temporary file, can be called anywhere
// also checks if a file needs to be deleted
this.deleteFile = async (file) => {
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
    console.log(e)
    return false
  }
}
