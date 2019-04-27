/*
 * mongoose model for user
 * specifies all the fields requirements and performs limited validation
 */

const mongoose = require('mongoose')

const errorSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  error: { type: String, required: true },
  date: { type: Date, required: true }
})

module.exports = mongoose.model('Error', errorSchema)
