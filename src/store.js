import Vue from 'vue'
import Vuex from 'vuex'
import EventServices from '@/services/EventServices'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    premiumVehicles: [],
    loadingPremium: false,

    regularVehicles: [],
    loadingRegular: false
  },
  mutations: {
    SET_PREMIUM_VEHICLES (state, premiumVehicles) {
      state.premiumVehicles.push(...premiumVehicles)
      state.loadingPremium = false
    },
    SET_PREMIUM_LOADING (state) {
      state.loadingPremium = true
    },

    SET_REGULAR_VEHICLES (state, regularVehicles) {
      state.regularVehicles.push(...regularVehicles)
      state.loadingRegular = false
    },
    SET_REGULAR_LOADING (state) {
      state.loadingRegular = true
    }
  },
  actions: {
    fetchPremiumVehicles ({ commit }, { skip, limit }) {

      // set fetching premium boolean to true
      commit('SET_PREMIUM_LOADING')
      EventServices.getPremiumVehicles(skip, limit)
        .then(premium => {
          if (premium.data.isSuccessful) { commit('SET_PREMIUM_VEHICLES', premium.data.value) }
        }).catch(e => {
          console.log('unexpected error when retrieving premium vehicles')
        })
    },

    fetchRegularVehicles ({ commit }, { skip, limit }) {

      commit('SET_REGULAR_LOADING')
      EventServices.getRegularVehicles(skip, limit)
        .then(regular => {
          if (regular.data.isSuccessful) { commit('SET_REGULAR_VEHICLES', regular.data.value) }
        }).catch(e => {
          console.log('unexpected error when retrieving regular vehicles')
          console.log(e)
        })
    }
  },
  getters: {
  }
})
