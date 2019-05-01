const mongoose = require('mongoose')
const Users = require('../models/user')
const _ = require('underscore')
const argon2 = require('argon2')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator/check')

const userFileServices = require('../fileServices/userFileServices')()
const errors = require('../utils/errors')

/**
 * @param {Object} req Request data
 *                  - email
 *                  - password
 *                  - dealership
 *                  - logo
 * @param {Object} res Result data
 * @return {Object} Outcome of operations, could be
 *                  an error message or success message
 */
exports.register = async (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const dealership = req.body.dealership
  const validations = validationResult(req)

  // ensure validation is empty
  // delete temporary file from aws
  if (!validations.isEmpty()) {
    userFileServices.deleteFile(req.file)
    return res.status(400).json({
      isSuccessful: false,
      value: validations.array({ onlyFirstError: true })
    })
  }

  // check if a logo is included
  if (!req.file) {
    return res.status(400).json({
      isSuccessful: false,
      value: 'must include a logo'
    })
  }

  // check if email/dealership already exists
  // TODO: should be moved to validation file
  const user = await Users.find().or([{ 'email': email }, { 'dealership.name': dealership }])
  if (user.length > 0) {
    userFileServices.deleteFile(req.file)
    return res.status(500).json({
      isSuccessful: false,
      value: 'user already exists'
    })
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
      const logoLocation = userFileServices.createDirAndMoveFile(saved, req.file)
      await Users.findOneAndUpdate({ _id: saved._id }, { logo: logoLocation })

      res.status(200).json({
        isSuccessful: true,
        value: 'user created successfully'
      })
    } catch (e) {
      errors.createAndSaveErrorMessage(e)
      userFileServices.deleteOnFail(saved._id, req.file)
      return res.status(500).json({
        isSuccessful: false,
        value: 'failed to upload logo'
      })
    }
  } catch (e) {
    errors.createAndSaveErrorMessage(e)
    userFileServices.deleteFile(req.file)
    return res.status(500).json({
      isSuccessful: false,
      value: 'error registering'
    })
  }
}

/**
 * @param {Object} req Request data
 *                  - email
 *                  - password
 *                  - dealership
 *                  - logo
 * @param {Object} res Result data
 * @return {Object} Outcome of operations, could be
 *                  an error message or success message
 */
exports.updateUser = async (req, res) => {
  const validations = validationResult(req)
  const includesPhotos = !_.isEmpty(req.file)
  let updateUser = {
    dealership: {},
    date: {}
  }

  // ensure validations have passed
  if (!validations.isEmpty()) {
    userFileServices.deleteFile(req.file)
    return res.status(400).json({ 
      isSuccessful: true,
      value: validations.array({ onlyFirstError: true }) 
    })
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
        errors.createAndSaveErrorMessage(e)
        return res.status(500).json({
          isSuccessful: false,
          value: 'unable to update password'
        })
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
        userFileServices.deleteFile(req.file)
        return res.status(500).json({
          isSuccessful: false,
          value: 'unable to find user'
        })
      }

      // if user is updating their logo, then perform this step
      if (includesPhotos) {
        try {
          userFileServices.updateFile(user, req.file)
        } catch (e) {
          errors.createAndSaveErrorMessage(e)
          userFileServices.deleteFile(req.file)
          return res.status(500).json({
            isSuccessful: false,
            value: 'unable to update logo'
          })
        }
      }
      res.status(200).json({
        isSuccessful: true,
        value: 'successfully updated user'
      })
    } catch (e) {
      errors.createAndSaveErrorMessage(e)
      userFileServices.deleteFile(req.file)
      return res.status(500).json({
        isSuccessful: false,
        value: 'unable to update user'
      })
    }
  } catch (e) {
    errors.createAndSaveErrorMessage(e)
    userFileServices.deleteFile(req.file)
    return res.status(500).json({
      isSuccessful: false,
      value: 'unable to find user'
    })
  }
}

/**
 * @param {Object} req Request data
 *                  - username (email)
 *                  - password
 * @param {Object} res Result data
 * @return {Object} If user is authenticated
 */
exports.login = (req, res) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      errors.createAndSaveErrorMessage(err)
      errors.createAndSaveErrorMessage(user)
      return res.status(500).json({
        isSuccessful: false,
        value: 'error logging in'
      })
    }

    if (info !== undefined) {
      errors.createAndSaveErrorMessage(info)
      return res.status(500).json({
        isSuccessful: false,
        value: 'error logging in'
      })
    }

    // login user
    req.logIn(user, { session: false }, (err) => {
      if (err) {
        errors.createAndSaveErrorMessage(err)
        return res.status(500).json({
          isSuccessful: false,
          value: 'error logging in'
        })
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
      res.status(200).json({ 
        isSuccessful: true,
        value: token
      })
    })
  })(req, res)
}
