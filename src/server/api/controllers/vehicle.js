const mongoose = require('mongoose')
const Vehicles = require('../models/vehicle')
const _ = require('underscore')
const dot = require('dot-object')
const { validationResult } = require('express-validator/check')
const errors = require('../utils/errors')
const vehicleFileServices = require('../fileServices/vehicleFileServices')()

// get all vehicles functions
// arguments: { how much to skip, and limit of how much to retrieve }
exports.getRegularVehicles = (req, res) => {
  const limit = parseInt(req.params.limit)
  const skip = parseInt(req.params.skip)

  Vehicles.find().where('premium_ad.end').lt(new Date())
    .skip(skip).limit(limit)
    .then(vehicles => {
      res.status(200).send(vehicles)
    }).catch(findErr => {
      res.status(500).send('could not retrieve vehicles')
    })
}

// get vehicle by provided id
// arguments: { vehicle_id }
exports.getVehicleById = (req, res) => {
  const vehicleId = req.params.vehicle_id

  Vehicles.findOne({ _id: vehicleId })
    .populate('dealership')
    .then(vehicle => {
      // update view count of vehicle data
      Vehicles.update({ _id: vehicleId }, { $inc: { 'views': 1 } })
        .then(updated => {
          res.status(200).send(vehicle)
        }).catch(updateViewCountErr => {
          console.log(updateViewCountErr)
          return res.status(500).send('failed to update view count')
        })
    }).catch(findOne => {
      console.log(findOne)
      return res.status(500).send('error finding vehicle')
    })
}

// get premium ad vehicles
// arguments: { how much to skip, and limit of how much to retrieve }
// TODO: this could be joined with getVehicles function
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
      console.log(findErr)
      return res.status(500).send('unexpected error when retrieving premium vehicles')
    })
}

// get dealerships vehicles
// arguments: { how much to skip, and limit of how much to retrieve, user_id }
exports.getVehiclesByDealershipId = (req, res) => {
  const dealershipId = req.params.dealership_id
  const skip = req.params.skip
  const limit = req.params.limit

  Vehicles.find({ dealership: dealershipId })
    .skip(skip).limit(limit)
    .then(vehicles => {
      res.status(200).send(vehicles)
    }).catch(findErr => {
      console.log(findErr)
      return res.status(500).send('error finding the dealership\'s vehicles')
    })
}

// add new vehicle to user
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

      res.status(200).send('vehicle created successfully')
    } catch (e) {
      errors.createAndSaveErrorMessage(e)
      vehicleFileServices.deleteOnFail(saved._id, req.files)
      return res.status(500).send('failed to upload images')
    }
  } catch (e) {
    errors.createAndSaveErrorMessage(e)
    vehicleFileServices.deleteFiles(req.files)
    return res.status(500).send('failed to save vehicle')
  }
}

// update user's vehicle
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
      return res.status(500).send('could not find anything associated with that id')
    }

    // if new photos, are being uploaded, perform this
    if (includesPhotos) {
      try {
        const fileLocations = await vehicleFileServices.updateFiles(vehicle, req.files)
        await Vehicles.findOneAndUpdate({ _id: vehicleId }, { $push: { 'images': fileLocations } })
      } catch (e) {
        errors.createAndSaveErrorMessage(e)
        vehicleFileServices.deleteFiles(req.files)
        return res.status(500).send('failed to upload photos')
      }
    }

    res.status(200).send('vehicle successfully updated')
  } catch (e) {
    errors.createAndSaveErrorMessage(e)
    vehicleFileServices.deleteFiles(req.files)
    return res.status(500).send('failed to update vehicle')
  }
}

// function to delete vehicle photo(s)
// this function is ONLY called when photos are being
//  deleted
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
      'deleted': deletedImages
    })
  } catch (e) {
    errors.createAndSaveErrorMessage(e)
    return res.status(500).send('unable to delete photos')
  }
}

// function to delete vehicle
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
        res.status(200).send(`successfully delete vehicle ${deleted._id}`)
      }
    } catch (e) {
      errors.createAndSaveErrorMessage(e)
      return res.status(500).send('successfully delete images, but failed to delete vehicle')
    }
  } catch (e) {
    errors.createAndSaveErrorMessage(e)
    return res.status(500).send('failed to delete images')
  }
}
