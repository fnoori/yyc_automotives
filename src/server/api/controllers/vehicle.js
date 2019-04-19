const mongoose = require('mongoose')
const Vehicles = require('../models/vehicle')
const _ = require('underscore')
const dot = require('dot-object')
const { validationResult } = require('express-validator/check')
const AWS = require('aws-sdk')
let s3

// configuring the AWS environment
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

s3 = new AWS.S3()

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
    this.deleteFiles(req.files)
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
      'end' : new Date('1969-12-19T00:58:02+0000').toISOString()
    },
    'views': 0
  })

  try {
    const saved = await newVehicle.save()

    try {
      let awsCopy = {}
      let awsDelete = {}
      const filesToCopy = req.files
      let fileLocations = []

      // step through vehicle images and move from
      //  temporary directory to vehicle's directory
      for (const file of filesToCopy) {
        awsCopy = {
          Bucket: `${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${saved.dealership}/${saved._id}`,
          CopySource: file.location,
          Key: file.key.split('/')[2]
        }
        awsDelete = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: file.key
        }

        // add links to the vehicle data in db
        fileLocations.push({
          Bucket: `${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${saved.dealership}/${saved._id}`,
          Key: file.key.split('/')[2],
          url: `${process.env.AWS_BASE_URL}/${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${saved.dealership}/${saved._id}/${file.key.split('/')[2]}`
        })

        // perform aws operations
        await s3.copyObject(awsCopy).promise()
        await s3.deleteObject(awsDelete).promise()
      }

      // update the images of vehicle
      // TODO: this could be joined with the save operation
      await Vehicles.findOneAndUpdate({ _id: saved._id }, { images: fileLocations })

      res.status(200).send('vehicle created successfully')
    } catch (e) {
      // on fail, delete vehicle from db and delete temporary files
      console.log(e)
      this.deleteOnFail(saved._id, req.files)
      return res.status(500).send('failed to upload images')
    }
  } catch (e) {
    console.log(e)
    this.deleteFiles(req.files)
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
    this.deleteFiles(req.files)
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
      this.deleteFiles(req.files)
      return res.status(500).send('could not find anything associated with that id')
    }

    // if new photos are being uploaded, perform this
    if (includesPhotos) {
      try {
        let awsCopy = {}
        let awsDelete = {}
        let fileLocations = []

        // need for-loop here, user could upload 1 photo, or 7 photos
        //  this loop catches all conditions
        for (const file of req.files) {
          awsCopy = {
            Bucket: `${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${vehicle.dealership}/${vehicle._id}`,
            CopySource: file.location,
            Key: file.key.split('/')[2]
          }
          awsDelete = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.key
          }

          // update photos list in vehicle data
          fileLocations.push({
            Bucket: `${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${vehicle.dealership}/${vehicle._id}`,
            Key: file.key.split('/')[2],
            url: `${process.env.AWS_BASE_URL}/${process.env.AWS_BUCKET_NAME}/${process.env.NODE_ENV}/users/${vehicle.dealership}/${vehicle._id}/${file.key.split('/')[2]}`
          })

          // perform aws operations
          await s3.copyObject(awsCopy).promise()
          await s3.deleteObject(awsDelete).promise()

          // update vehicle photos array
          // TODO: combine this with the the first update operation
          const updatedPhotos = await Vehicles.findOneAndUpdate({ _id: vehicleId }, { $push: { 'images': fileLocations } })
          if (updatedPhotos.n === 0) {
            this.deleteFiles(req.files)
            return res.status(500).send('failed to upload photos')
          }
        }
      } catch (e) {
        console.log(e)
        this.deleteFiles(req.files)
        return res.status(500).send('failed to upload photos')
      }
    }

    res.status(200).send('vehicle successfully updated')
  } catch (e) {
    console.log(e)
    this.deleteFiles(req.files)
    return res.status(500).send('failed to update vehicle')
  }
}

// function to delete vehicle photo(s)
// this function is ONLY called when photos are being
//  deleted
exports.deletePhotos = async (req, res) => {
  const toDelete = []
  toDelete.push(req.body.images)

  try {
    // ensure the user deleting is allowed to, via the token
    const vehicle = await Vehicles
      .find({
        _id: req.params.vehicle_id,
        dealership: req['user']['_id']
      })

    // look through the vehicle in db for matching images to verify they exist
    let matchingImages = []
    let matchingImageUrl = []
    for (const image of toDelete) {
      vehicle[0]['images'].find(details => {
        if (details.url === image) {
          matchingImages.push(details)
          matchingImageUrl.push(details.url)
        }
      })
    }



    // loop through files to delete
    let awsDelete = {}
    for (const image of matchingImages) {
      awsDelete = {
        Bucket: image.Bucket,
        Key: image.Key
      }

      await s3.deleteObject(awsDelete).promise()
    }

    // finally update the vehicles data in db
    await Vehicles
      .update({
        _id: req.params.vehicle_id, dealership: req['user']['_id']
      },
      {
        $pull: { images: { url: { $in: matchingImageUrl } } }
      })

    return res.status(200).json({
      'deleted': matchingImages
    })
  } catch (e) {
    console.log(e)
    return res.status(500).send('unable to delete photos')
  }
}

// function to delete vehicle
exports.deleteVehicle = async (req, res) => {
  // find vehicle and check with token that user is allowed to delete
  const vehicle = await Vehicles
    .find({
      _id: req.params.vehicle_id,
      dealership: req['user']['_id']
    })

  try {
    let images = vehicle[0].images
    let awsDelete = {}

    // delete images first from aws
    for (const image of images) {
      awsDelete = {
        'Bucket': image.Bucket,
        'Key': image.Key
      }

      await s3.deleteObject(awsDelete).promise()
    }

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
      console.log(e)
      return res.status(500).send('successfully delete images, but failed to delete vehicle')
    }
  } catch (e) {
    console.log(e)
    return res.status(500).send('failed to delete images')
  }
}

// deletes on failed add new vehicle attempt
// deletes the vehicle from db and its temporary files from aws
this.deleteOnFail = async (id, files) => {
  try {
    await Vehicles.findOneAndRemove({ _id: id })
    let awsDelete = {}

    if (files.length > 0) {
      for (const file of files) {
        awsDelete = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: file.key
        }

        await s3.deleteObject(awsDelete).promise()
      }
    }

    return true
  } catch (e) {
    console.log(e)
    return false
  }
}

// delete an array of files
// TODO: could be moved in a separate utils file
this.deleteFiles = async (files) => {
  try {
    let awsDelete = {}

    // check if there are files to delete
    if (files.length > 0) {
      for (const file of files) {
        awsDelete = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: file.key
        }

        await s3.deleteObject(awsDelete).promise()
      }
    }

    return true
  } catch (e) {
    console.log(e)
    return false
  }
}
