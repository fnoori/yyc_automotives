const mongoose = require('mongoose')
const Vehicles = require('../models/vehicle')
const _ = require('underscore')
const dot = require('dot-object')
const { validationResult } = require('express-validator/check')
const errors = require('../utils/errors')
const vehicleFileServices = require('../fileServices/vehicleFileServices')()

/**
 * Returns only the regular ad vehicles
 * @param {Object} req Request data
 *                  - limit
 *                  - skip
 * @param {Object} res Result data
 * @return {Object} Regular vehicles
 */
exports.getRegularVehicles = (req, res) => {
  const limit = parseInt(req.params.limit)
  const skip = parseInt(req.params.skip)

  Vehicles.find().where('premium_ad.end').lt(new Date())
    .skip(skip).limit(limit)
    .then(vehicles => {
      res.status(200).json({
        isSuccessful: true,
        value: vehicles
      })
    }).catch(findErr => {
      res.status(500).json({
        isSuccessful: false,
        value: 'could not retrieve vehicles'
      })
    })
}


/**
 * @param {Object} req Request data
 *                  - vehicle_id
 * @param {Object} res Result data
 * @return {Object} Data of vehicle with associated id
 */
exports.getVehicleById = (req, res) => {
  const vehicleId = req.params.vehicle_id

  Vehicles.findOne({ _id: vehicleId })
    .populate('dealership')
    .then(vehicle => {
      // update view count of vehicle data
      Vehicles.update({ _id: vehicleId }, { $inc: { 'views': 1 } })
        .then(updated => {
          res.status(200).json({
            isSuccessful: true,
            value: vehicle
          })
        }).catch(updateViewCountErr => {
          errors.createAndSaveErrorMessage(updateViewCountErr)
          return res.status(500).json({
            isSuccessful: false,
            value: 'failed to update view count'
          })
        })
    }).catch(findOne => {
      errors.createAndSaveErrorMessage(findOne)
      return res.status(500).json({
        isSuccessful: false,
        value: 'error finding vehicle'
      })
    })
}

/**
 * TODO: this could be joined with getVehicles function
 * Returns only the premium vehicles
 * @param {Object} req Request data
 *                  - skip
 *                  - limit
 * @param {Object} res Result data
 * @return {Object} Premium vehicles
 */
exports.getPremiumVehicles = (req, res) => {
  const limit = parseInt(req.params.limit)
  const skip = parseInt(req.params.skip)

  Vehicles.find()
    .where('premium_ad.end').gt(new Date())
    .populate('dealership')
    .skip(skip).limit(limit)
    .then(premiumVehicles => {
      res.send(premiumVehicles)
    }).catch(findErr => {
      errors.createAndSaveErrorMessage(findErr)
      return res.status(500).json({
        isSuccessful: false,
        value: 'unexpected error when retrieving premium vehicles'
      })
    })
}


/**
 * Returns only the specified dealership's vehicles
 * @param {Object} req Request data
 *                  - dealership_id
 *                  - skip
 *                  - limit
 * @param {Object} res Result data
 * @return {Object} All of dealership's vehicles
 */
exports.getVehiclesByDealershipId = (req, res) => {
  const dealershipId = req.params.dealership_id
  const skip = req.params.skip
  const limit = req.params.limit

  Vehicles.find({ dealership: dealershipId })
    .skip(skip).limit(limit)
    .then(vehicles => {
      res.status(200).json({
        isSuccessful: true,
        value: vehicles
      })
    }).catch(findErr => {
      errors.createAndSaveErrorMessage(findErr)
      return res.status(500).json({
        isSuccessful: false,
        value: 'error finding the dealership\'s vehicles'
      })
    })
}

/**
 * Adds new vehicle to the database
 * @param {Object} req Request data
 *                  - vehicle details (see vehicle model for complete list)
 * @param {Object} res Result data
 * @return {Object} Result of adding vehicle
 */
exports.addNewVehicle = async (req, res) => {
  let validations = validationResult(req)

  // ensure validations pass
  if (!validations.isEmpty()) {
    vehicleFileServices.deleteFiles(req.files)
    return res.status(422).json({ validations: validations.array({ onlyFirstError: true }) })
  }

  // since all data is already validated, add to newVehicle
  let newVehicle = new Vehicles({
    '_id': new mongoose.Types.ObjectId(),
    'basic_info': {
      'make': req.body.make,
      'model': req.body.model,
      'trim': req.body.trim,
      'year': req.body.year,
      'type': req.body.type,
      'price': req.body.price,
      'exterior_colour': req.body.exterior_colour,
      'interior_colour': req.body.interior_colour,
      'kilometres': req.body.kilometres,
      'fuel_type': req.body.fuel_type,
      'doors': req.body.doors,
      'seats': req.body.seats,
      'description': req.body.description
    },
    'mechanical_info': {
      'car_proof': req.body.car_proof,
      'transmission': req.body.transmission,
      'engine_size': req.body.engine_size,
      'cylinders': req.body.cylinders,
      'horsepower': req.body.horsepower,
      'torque': req.body.torque,
      'recommended_fuel': req.body.recommended_fuel
    },
    'fuel_economy': {
      'city': req.body.city,
      'highway': req.body.highway,
      'combined': req.body.combined
    },
    'dealership': req['user']['_id'],
    'date': {
      'created': new Date(),
      'modified': new Date()
    },
    'premium_ad': {
      'start': new Date('1969-12-19T00:58:02+0000').toISOString(),
      'end': new Date('1969-12-19T00:58:02+0000').toISOString()
    },
    'views': 0
  })

  try {
    const saved = await newVehicle.save()

    try {
      const fileLocations = await vehicleFileServices.createDirAndMoveFile(saved, req.files)
      await Vehicles.findOneAndUpdate({ _id: saved._id }, { images: fileLocations })

      res.status(200).json({
        isSuccessful: true,
        value: 'vehicle created successfully'
      })
    } catch (e) {
      errors.createAndSaveErrorMessage(e)
      vehicleFileServices.deleteOnFail(saved._id, req.files)
      return res.status(500).json({
        isSuccessful: false,
        value: 'failed to upload images'
      })
    }
  } catch (e) {
    errors.createAndSaveErrorMessage(e)
    vehicleFileServices.deleteFiles(req.files)
    return res.status(500).json({
      isSuccessful: false,
      value: 'failed to save vehicle'
    })
  }
}

/**
 * @param {Object} req Request data
 *                  - vehicle details (see vehicle model for complete list)
 * @param {Object} res Result data
 * @return {Object} Result of adding vehicle
 */
exports.updateVehicle = async (req, res) => {
  const validations = validationResult(req)
  let includesPhotos = false
  let updateVehicle = {
    basic_info: {},
    mechanical_info: {},
    fuel_economy: {},
    date: {}
  }
  let vehicleId = req.params.vehicle_id

  // ensure validations pass
  if (!validations.isEmpty()) {
    vehicleFileServices.deleteFiles(req.files)
    return res.status(422).json({ validations: validations.array({ onlyFirstError: true }) })
  }

  // check if new photos are being uploaded
  if (!_.isEmpty(req.files)) {
    includesPhotos = true
  }

  // only update those values that need to be updated
  if (req.body.make) updateVehicle['basic_info']['make'] = req.body.make
  if (req.body.model) updateVehicle['basic_info']['model'] = req.body.model
  if (req.body.trim) updateVehicle['basic_info']['trim'] = req.body.trim
  if (req.body.type) updateVehicle['basic_info']['type'] = req.body.type
  if (req.body.exterior_colour) updateVehicle['basic_info']['exterior_colour'] = req.body.exterior_colour
  if (req.body.interior_colour) updateVehicle['basic_info']['interior_colour'] = req.body.interior_colour
  if (req.body.kilometres) updateVehicle['basic_info']['kilometres'] = req.body.kilometres
  if (req.body.fuel_type) updateVehicle['basic_info']['fuel_type'] = req.body.fuel_type
  if (req.body.doors) updateVehicle['basic_info']['doors'] = req.body.doors
  if (req.body.seats) updateVehicle['basic_info']['seats'] = req.body.seats
  if (req.body.description) updateVehicle['basic_info']['description'] = req.body.description
  if (req.body.year) updateVehicle['basic_info']['year'] = req.body.year
  if (req.body.price) updateVehicle['basic_info']['price'] = req.body.price
  if (req.body.car_proof) updateVehicle['mechanical_info']['car_proof'] = req.body.car_proof
  if (req.body.transmission) updateVehicle['mechanical_info']['transmission'] = req.body.transmission
  if (req.body.engine_size) updateVehicle['mechanical_info']['engine_size'] = req.body.engine_size
  if (req.body.cylinders) updateVehicle['mechanical_info']['cylinders'] = req.body.cylinders
  if (req.body.horsepower) updateVehicle['mechanical_info']['horsepower'] = req.body.horsepower
  if (req.body.torque) updateVehicle['mechanical_info']['torque'] = req.body.torque
  if (req.body.recommended_fuel) updateVehicle['mechanical_info']['recommended_fuel'] = req.body.recommended_fuel
  if (req.body.city) updateVehicle['fuel_economy']['city'] = req.body.city
  if (req.body.highway) updateVehicle['fuel_economy']['highway'] = req.body.highway
  if (req.body.combined) updateVehicle['fuel_economy']['combined'] = req.body.combined

  // update modified date/time
  updateVehicle['date']['modified'] = new Date()

  // check if any of the nested documents is empty, if it is, delete it
  if (_.isEmpty(updateVehicle.basic_info)) delete updateVehicle.basic_info
  if (_.isEmpty(updateVehicle.mechanical_info)) delete updateVehicle.mechanical_info
  if (_.isEmpty(updateVehicle.fuel_economy)) delete updateVehicle.fuel_economy

  // need to convert JSON to 'dot' notation
  //  mongoose requires this format for correct update
  const updateVehicleDotNotation = dot.dot(updateVehicle)

  try {
    // attempt to find the vehicle
    // on update, check token data is correct
    let vehicle = await Vehicles.findById(vehicleId)
    let updated = await Vehicles.update({
      _id: vehicleId,
      dealership: req['user']['_id']
    }, updateVehicleDotNotation)

    // if update fails, delete temporary files
    if (updated.n === 0) {
      vehicleFileServices.deleteFiles(req.files)
      return res.status(500).json({
        isSuccessful: false,
        value: 'could not find anything associated with that id'
      })
    }

    // if new photos, are being uploaded, perform this
    if (includesPhotos) {
      try {
        const fileLocations = await vehicleFileServices.updateFiles(vehicle, req.files)
        await Vehicles.findOneAndUpdate({ _id: vehicleId }, { $push: { 'images': fileLocations } })
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        vehicleFileServices.deleteFiles(req.files)
        return res.status(500).json({
          isSuccessful: false,
          value: 'failed to upload photos'
        })
      }
    }

    res.status(200).json({
      isSuccessful: true,
      value: 'vehicle successfully updated'
    })
  } catch (e) {
    errors.createAndSaveErrorMessage(e)
    vehicleFileServices.deleteFiles(req.files)
    return res.status(500).json({
      isSuccessful: false,
      value: 'failed to update vehicle'
    })
  }
}

/**
 * @param {Object} req Request data
 *                  - array of image url's
 * @param {Object} res Result data
 * @return {Object} Result of deleting image's
 */
exports.deletePhotos = async (req, res) => {
  const toDelete = Array.isArray(req.body.images) ? req.body.images : Array(req.body.images)

  try {
    // ensure the user deleting is allowed to, via the token
    const vehicle = await Vehicles
      .findOne({
        _id: req.params.vehicle_id,
        dealership: req['user']['_id']
      })

    const deletedImages = await vehicleFileServices.deleteVehiclePhotos(vehicle, toDelete)

    await Vehicles
      .update({
        _id: req.params.vehicle_id, dealership: req['user']['_id']
      },
      {
        $pull: { images: { url: { $in: deletedImages } } }
      })

    return res.status(200).json({
      isSuccessful: true,
      value: deletedImages
    })
  } catch (e) {
    errors.createAndSaveErrorMessage(e)
    return res.status(500).json({
      isSuccessful: false,
      value: 'unable to delete photos'
    })
  }
}

/**
 * @param {Object} req Request data
 *                  - vehicle_id
 * @param {Object} res Result data
 * @return {Object} Result of deleting vehicle
 */
exports.deleteVehicle = async (req, res) => {
  // find vehicle and check with token that user is allowed to delete
  const vehicle = await Vehicles
    .findOne({
      _id: req.params.vehicle_id,
      dealership: req['user']['_id']
    })

  try {
    await vehicleFileServices.deleteFilesAndDirectoryOfDeletedVehicle(vehicle.images)

    try {
      // delete vehicle
      // again check with the token that user is allowed to delete
      const deleted = await Vehicles.findOneAndDelete({
        _id: req.params.vehicle_id,
        dealership: req['user']['_id']
      })

      if (deleted) {
        res.status(200).json({
          isSuccessful: true,
          value: `successfully delete vehicle ${deleted._id}`
        })
      }
    } catch (e) {
      errors.createAndSaveErrorMessage(e)
      return res.status(500).json({
        isSuccessful: false,
        value: 'successfully delete images, but failed to delete vehicle'
      })
    }
  } catch (e) {
    errors.createAndSaveErrorMessage(e)
    return res.status(500).json({
      isSuccessful: false,
      value: 'failed to delete images'
    })
  }
}
