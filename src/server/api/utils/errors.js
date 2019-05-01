const Errors = require('../models/error')
const mongoose = require('mongoose')

/**
 * @param {JSON} errorDetails Error information
 * @return {JSON} JSON of error details with an accompanying Date
 */
exports.createErrorMessage = (errorDetails) => {
  return {
    message: errorDetails,
    date: new Date()
  }
}

/**
 * @param {JSON} errorDetails Error information
 * @returns {boolean} Result of save error to db
 */
exports.createAndSaveErrorMessage = (errorDetails) => {
  const newError = new Errors({
    '_id': new mongoose.Types.ObjectId(),
    'error': errorDetails,
    'date': new Date()
  })

  newError.save()
    .then(saveRes => {
      return true
    }).catch(errorSaveErr => {
      console.log(errorSaveErr)
      return false
    })
}

/**
 * @param {boolean} isSuccessful 
 * @param {Object} value Error information
 * @returns {boolean} Result of save error to db
 */
exports.returnError = (isSuccessful, value) => {
  return {
    isSuccessful: isSuccessful,
    value: value
  }
}
