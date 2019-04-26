import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_ROUTE,
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

export default {
  getPremiumVehicles (skip, limit) {
    return api.get(`${process.env.VUE_APP_API_ROUTE}/vehicles/get-premium-vehicles/${skip}/${limit}`)
  },
  getRegularVehicles (skip, limit) {
    api.get(`${process.env.VUE_APP_API_ROUTE}/vehicles/get-regular-vehicles/${this.skip}/${this.limit}`)
      .then((regular) => {

      }).catch(regularGetErr => {
        alert(`unexpected error when retrieving regular ads`)
      })
  },
  getVehicleById (id) {
    api.get(`${process.env.VUE_APP_API_ROUTE}/vehicles/get-vehicle-by-id/${id}`)
      .then((vehicle) => {

      }).catch(vehicleGetErr => {
        alert(`unexpected error when retrieving vehicle`)
      })
  }
}
/**
     let counter = 1
    for (const car of tmpData) {
      car.images[0].url = require(`../../test_images/test-${counter}.jpg`)

      if (new Date() < new Date(car.premium_ad.end)) {
        this.premiumVehicles.push(car)
      } else {
        this.regularVehicles.push(car)
      }
      counter += 1
    }
 *
*/
