/*
  using express-validator to validate incoming vehicle data
*/

const { check } = require('express-validator/check')
const globalVars = require('../utils/globalVars')
const _ = require('underscore')
const Users = require('../models/user')

// switch conditions for all possible condition
exports.validate = (method) => {
  switch (method) {

    // on registration, all the fields are required
    case 'registration': {
      return [
        check('email')
          .exists()
          .isLength({ max: globalVars.EMAIL_MAX_LENGTH }),
        check('password')
          .exists(),
        check('dealership')
          .exists()
          .isLength({ max: globalVars.DEALERSHIP_NAME_MAX_LENGTH })
      ]
    }

    // on update, all the fields are optional
    //  only required fields are the confirm email/password fields
    case 'updateUser': {
      return [
        check('email')
          .optional()
          .isLength({ max: globalVars.EMAIL_MAX_LENGTH }),
        check('confirmation_email')
          .optional()
          .custom(async (confirmation_email, { req }) => {
            if (
              (
                (!_.isUndefined(confirmation_email) && !_.isUndefined(req.body.email)) &&
                (confirmation_email !== req.body.email)
              ) ||
              (!_.isUndefined(confirmation_email) && _.isUndefined(req.body.email))
            ) {
              throw new Error('email confirmation does not match')
            } else {
              const user = await Users.findOne({ email: req.body.confirmation_email })
              if (user) {
                throw new Error('email is already taken')
              }
              return true
            }
          }),
        check('password')
          .optional(),
        check('password_confirmation')
          .optional()
          .custom((password_confirmation, { req }) => {
            if (
              (
                (!_.isUndefined(password_confirmation) && !_.isUndefined(req.body.password)) &&
                (password_confirmation !== req.body.password)
              ) ||
              (!_.isUndefined(password_confirmation) && _.isUndefined(req.body.password))
            ) {
              throw new Error('password confirmation does not match')
            } else {
              return true
            }
          }),
        check('dealership')
          .optional()
          .isLength({ max: globalVars.DEALERSHIP_NAME_MAX_LENGTH }),
        check('dealership_confirmation')
          .optional()
          .custom(async (dealership_confirmation, { req }) => {
            if (
              (
                (!_.isUndefined(dealership_confirmation) && !_.isUndefined(req.body.dealership)) &&
                (dealership_confirmation !== req.body.dealership)
              ) ||
              (!_.isUndefined(dealership_confirmation) && _.isUndefined(req.body.dealership))
            ) {
              throw new Error('dealership confirmation does not match')
            } else {
              const user = await Users.findOne({ dealership: { name: req.body.dealership_confirmation } })
              if (user) {
                throw new Error('dealership name is already taken')
              }

              return true
            }
          })
      ]
    }

    default: {
      return []
    }
  }
}
