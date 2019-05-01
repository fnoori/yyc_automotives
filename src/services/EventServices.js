const axios = require('axios')

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
    return api.get(`${process.env.VUE_APP_API_ROUTE}/vehicles/get-regular-vehicles/${skip}/${limit}`)
  },

  getVehicleById (id) {
    return api.get(`${process.env.VUE_APP_API_ROUTE}/vehicles/${id}`)
  }
}
