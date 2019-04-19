import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Sponsored from './views/Sponsored.vue'
import Vehicle from './views/Vehicle.vue'
import Dealership from './views/Dealership.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/vehicle/:vehicle_id',
      name: 'vehicle',
      component: Vehicle
    },
    {
      path: '/dealership/:dealership_id',
      name: 'dealership',
      component: Dealership
    },
    {
      path: '/sponsored',
      name: 'sponsored',
      component: Sponsored
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/About.vue')
    }
  ]
})
