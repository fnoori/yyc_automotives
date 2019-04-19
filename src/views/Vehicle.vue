<template>
  <div v-if="isLoaded" class="vehicle container">
    <div class="row m-0">
      <h5>{{ vehicle.basic_info.year }} {{ vehicle.basic_info.make }} {{ vehicle.basic_info.model }} {{ vehicle.basic_info.trim }}</h5>
    </div>
    <div class="row p-1">
      <my-gallery :images="vehicle.images"/>
    </div>

    <div class="row basic-info">
      <div class="col-md">
        <div class="row">
          <div class="col">
            <h5 class="price row justify-content-center">${{ vehicle.basic_info.price.toLocaleString() }}</h5>
            <h6 class="kilometres row justify-content-center">
              <img src="@/assets/icons/kilometres.png" alt="">
              {{ vehicle.basic_info.kilometres.toLocaleString() }}
            </h6>
            <h6 class="row justify-content-center">
              <img src="@/assets/icons/transmission.png" alt="">
              {{ vehicle.mechanical_info.transmission }}
            </h6>
          </div>
        </div>
      </div>
      <div class="col-md">
        <router-link class="row" :to="{ name: 'dealership', params: { dealership_id: vehicle.dealership._id } }">
          <div class="col-md text-center">
            <img src="@/assets/logos/sponsored_logo.png"/>
          </div>
        </router-link>
      </div>
    </div>

    <div class="row">
      <div class="col-md">
        <b-card
          border-variant="light"
          header="Description"
          class="text-left description">
          <div>
            {{ vehicle.basic_info.description }}
          </div>
        </b-card>
      </div>
    </div>

    <div class="row detailed-info">
      <div class="col-md">
        <b-card
          border-variant="light"
          header="Basic Info."
          class="text-left sub-detailed-info">
          <div class="row">
            <div class="col text-right">
              <div class="title">Make</div>
              <div class="value">{{ vehicle.basic_info.make }}</div>
            </div>
            <div class="col text-left">
              <div class="title">Model</div>
              <div class="value">{{ vehicle.basic_info.model }}</div>
            </div>
          </div>
          <div class="row">
            <div class="col text-right">
              <div class="title">Trim</div>
              <div class="value">{{ vehicle.basic_info.trim }}</div>
            </div>
            <div class="col text-left">
              <div class="title">Type</div>
              <div class="value">{{ vehicle.basic_info.type }}</div>
            </div>
          </div>
          <div class="row">
            <div class="col text-right">
              <div class="title">Exterior</div>
              <div class="value">{{ vehicle.basic_info.exterior_colour }}</div>
            </div>
            <div class="col text-left">
              <div v-if="vehicle.basic_info.interior_colour" class="title">Interior Colour</div>
              <div v-if="vehicle.basic_info.interior_colour" class="value">{{ vehicle.basic_info.interior_colour }}</div>
            </div>
          </div>
        </b-card>
      </div>

      <div class="col-md">
        <b-card
          border-variant="light"
          header="Mechanical Info."
          class="text-left sub-detailed-info">
          <div class="row">
            <div class="col text-right">
              <div class="title">Transmission</div>
              <div class="value">{{ vehicle.mechanical_info.transmission }}</div>
            </div>
            <div class="col text-left">
              <div v-if="vehicle.mechanical_info.car_proof" class="title">CarProof</div>
              <div v-if="vehicle.mechanical_info.car_proof" class="value">{{ vehicle.mechanical_info.car_proof }}</div>
            </div>
          </div>
          <div class="row">
            <div class="col text-right">
              <div v-if="vehicle.mechanical_info.engine_size" class="title">Engine Size</div>
              <div v-if="vehicle.mechanical_info.engine_size" class="value">{{ vehicle.mechanical_info.engine_size }}</div>
            </div>
            <div class="col text-left">
              <div v-if="vehicle.mechanical_info.cylinders" class="title">Cylinders</div>
              <div v-if="vehicle.mechanical_info.cylinders" class="value">{{ vehicle.mechanical_info.cylinders }}</div>
            </div>
          </div>
          <div class="row">
            <div class="col text-right">
              <div v-if="vehicle.mechanical_info.horsepower" class="title">Horsepower</div>
              <div v-if="vehicle.mechanical_info.horsepower" class="value">{{ vehicle.mechanical_info.horsepower }}</div>
            </div>
            <div class="col text-left">
              <div v-if="vehicle.mechanical_info.torque" class="title">Torque</div>
              <div v-if="vehicle.mechanical_info.torque" class="value">{{ vehicle.mechanical_info.torque }}</div>
            </div>
          </div>
        </b-card>
      </div>

      <div
        v-if="vehicle.fuel_economy && (vehicle.fuel_economy.city || vehicle.fuel_economy.highway || vehicle.fuel_economy.combined)"
        class="col-md">
        <b-card
          border-variant="light"
          header="Fuel Economy"
          class="text-left sub-detailed-info">
          <div class="row">
            <div class="col text-right">
              <div v-if="vehicle.fuel_economy.city" class="title">City</div>
              <div v-if="vehicle.fuel_economy.city" class="value">{{ vehicle.fuel_economy.city }}</div>
            </div>
            <div class="col text-left">
              <div v-if="vehicle.fuel_economy.highway" class="title">Highway</div>
              <div v-if="vehicle.fuel_economy.highway" class="value">{{ vehicle.fuel_economy.highway }}</div>
            </div>
          </div>
          <div class="row">
            <div class="col text-right">
              <div v-if="vehicle.fuel_economy.combined" class="title">Combined</div>
              <div v-if="vehicle.fuel_economy.combined" class="value">{{ vehicle.fuel_economy.combined }}</div>
            </div>
            <div class="col text-left">
              <div class="title"></div>
              <div class="value"></div>
            </div>
          </div>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>
import Gallery from '@/components/Gallery'
import axios from 'axios'

export default {
  name: 'Vehicle',
  components: {
    'my-gallery': Gallery
  },
  data () {
    return {
      vehicle: Object,
      isLoaded: false
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      axios.get(`${process.env.VUE_APP_API_ROUTE}/vehicles/get-vehicle-by-id/${vm.$route.params.vehicle_id}`)
        .then((vehicle) => {
          vm.vehicle = vehicle.data
          vm.isLoaded = true
        }).catch(vehicleGetErr => {
          alert(`unexpected error when retrieving vehicle`)
        })
    })
  }
}
</script>

<style lang="scss" scoped>
.list-group-item {
  border-radius: 0 !important;
}

@media (min-width: 320px) {
  .vehicle {
    margin-top: 1rem;

    .basic-info {
      align-items: center;
      padding-top: 1rem;

      .price {
        color: green;
        letter-spacing: 1px;
      }
      .kilometres {
        letter-spacing: 1px;
      }

      h5,
      h6 {
        display: -webkit-box;
      }

      img {
        width: 1rem;
      }

      a {
        img {
          width: 15rem;
        }
      }
    }

    .description {
      margin-bottom: 1rem;

      .card-body {
        padding: 1rem;
      }
    }

    .detailed-info {
      .sub-detailed-info{
        width: 100%;
        margin-bottom: 1rem;

        .title {
          color: rgba(0,0,0,0.5);
          font-size: 0.8rem;
        }
        .value {
          color: black;
          font-size: 1rem;
        }
      }
    }

    .info-title {
      font-size: 1.1rem;
    }
  }
}

@media (min-width: 576px) {
  .vehicle {
    .detailed-info {
      .title {
        font-size: 1rem;
      }
      .value {
        font-size: 1rem;
      }
    }
  }
}

@media (min-width: 768px) {
  .vehicle {
    .basic-info {
      padding-top: 0;
    }

    .detailed-info {
      .sub-detailed-info{
        .title {
          font-size: 0.7rem;
        }
        .value {
          font-size: .8rem;
        }
      }
    }
  }
}

@media (min-width: 992px) {
  .vehicle {
    .detailed-info {
      .sub-detailed-info{
        .title {
          font-size: 0.9rem;
        }
        .value {
          font-size: 1rem;
        }
      }
    }
  }
}
</style>
