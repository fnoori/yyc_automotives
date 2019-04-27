import Vue from 'vue'
import Vuex from 'vuex'
import EventServices from '@/services/EventServices'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    premiumVehicles: [],
    regularVehicles: []
  },
  mutations: {
    SET_PREMIUM_VEHICLES (state, premiumVehicles) {
      state.premiumVehicles = premiumVehicles
    },
    SET_REGULAR_VEHICLES (state, regularVehicles) {
    }
  },
  actions: {
    fetchPremiumVehicles ({ commit }, { skip, limit }) {
      EventServices.getPremiumVehicles(skip, limit)
        .then(premium => {
          for (let i = 0; i < premium.data.length; i++) {
            premium.data[i].images[0].url = require(`../test_images/test-${i + 1}.jpg`)
          }

          commit('SET_PREMIUM_VEHICLES', premium.data)
        }).catch(getPremiumErr => {
          console.log('unexpected error when retrieving premium vehicles')
          console.log(getPremiumErr)
        })
    },
    fetchRegularVehicles ({ commit }, { skip, limit }) {
    }
  },
  getters: {
  }
})
