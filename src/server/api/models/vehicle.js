/*
  mongoose model for vehicle
  specifies all field requirements
*/

const mongoose = require('mongoose')
const globalVars = require('../utils/globalVars')

const vehicleSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  basic_info: {
    make: { type: String, required: true, maxlength: globalVars.MAKE_MAX_LENGTH },
    model: { type: String, required: true, maxlength: globalVars.MODEL_MAX_LENGTH },
    trim: { type: String, required: true, maxlength: globalVars.TRIM_MAX_LENGTH },
    type: { type: String, required: true, maxlength: globalVars.TYPE },
    year: { type: Number, required: true, maxlength: globalVars.YEAR_MAX_LENGTH },
    price: { type: Number, required: true, maxlength: globalVars.PRICE_MAX_LENGTH },
    exterior_colour: { type: String, required: true, maxlength: globalVars.EXTERIOR_COLOUR },
    interior_colour: { type: String, required: false, maxlength: globalVars.INTERIOR_COLOUR },
    kilometres: { type: Number, required: true, maxlength: globalVars.KILOMETRES },
    fuel_type: { type: String, required: true, maxlength: globalVars.FUEL_TYPE },
    doors: { type: Number, required: false, maxlength: globalVars.DOORS },
    seats: { type: Number, required: false, maxlength: globalVars.SEATS },
    description: { type: String, required: false, maxlength: globalVars.DESCRIPTION }
  },
  mechanical_info: {
    car_proof: { type: Boolean, require: false },
    transmission: { type: String, required: true, maxlength: globalVars.TRANSMISSION_MAX_LENGTH },
    engine_size: { type: String, required: false, maxlength: globalVars.ENGINE_SIZE_MAX_LENGTH },
    cylinders: { type: String, required: false, maxlength: globalVars.CYLINDERS_MAX_LENGTH },
    horsepower: { type: String, required: false, maxlength: globalVars.HORSEPOWER_MAX_LENGTH },
    torque: { type: String, required: false, maxlength: globalVars.TORQUE_MAX_LENGTH },
    recommended_fuel: { type: String, required: true, maxlength: globalVars.RECOMMENDED_FUEL_MAX_LENGTH }
  },
  fuel_economy: {
    city: { type: Number, required: false, maxlength: globalVars.FUEL_ECONOMY_CITY },
    highway: { type: Number, required: false, maxlength: globalVars.FUEL_ECONOMY_HIGHWAY },
    combined: { type: Number, required: false, maxlength: globalVars.FUEL_ECONOMY_COMBINED }
  },
  premium_ad: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  dealership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  images: { type: Array, required: false },
  date: {
    created: { type: Date, required: true },
    modified: { type: Date, required: true }
  },
  views: { type: Number, required: true }
})

module.exports = mongoose.model('Vehicle', vehicleSchema)
