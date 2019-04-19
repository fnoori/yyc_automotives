/*
  mongoose model for user
  specifies all the fields requirements and performs limited validation
*/

const mongoose = require('mongoose')
const globalVars = require('../utils/globalVars')

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  email: {
    type: String,
    required: true,
    maxLength: globalVars.EMAIL_MAX_LENGTH,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'invalid email address']
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    maxLength: globalVars.DEALERSHIP_NAME_MAX_LENGTH,
    required: true
  },
  hours: {
    monday: { from: { type: String, max: 4, min: 4 }, to: { type: String, max: 4, min: 4 } },
    tuesday: { from: { type: String, max: 4, min: 4 }, to: { type: String, max: 4, min: 4 } },
    wednesday: { from: { type: String, max: 4, min: 4 }, to: { type: String, max: 4, min: 4 } },
    thursday: { from: { type: String, max: 4, min: 4 }, to: { type: String, max: 4, min: 4 } },
    friday: { from: { type: String, max: 4, min: 4 }, to: { type: String, max: 4, min: 4 } },
    saturday: { from: { type: String, max: 4, min: 4 }, to: { type: String, max: 4, min: 4 } },
    sunday: { from: { type: String, max: 4, min: 4 }, to: { type: String, max: 4, min: 4 } }
  },
  logo: { type: Object },
  date: {
    created: {
      type: Date,
      required: true
    },
    modified: {
      type: Date,
      required: true
    }
  }
})

module.exports = mongoose.model('User', userSchema)
