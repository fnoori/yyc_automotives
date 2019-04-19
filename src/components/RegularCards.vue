<template>
  <router-link
    :to="{ name: 'vehicle', params: { vehicle_id: vehicle._id } }"
    :key="vehicle._id">
    <div class="regular-card">
      <h6>
        {{ vehicle.basic_info.year }}
        {{ vehicle.basic_info.make }}
        {{ vehicle.basic_info.model }}
        {{ vehicle.basic_info.trim }}
      </h6>
      <b-card
        :img-src="vehicle.images[0].url"
        img-alt="Image"
        img-left
        tag="article">
        <b-card-text>
          <div>
            <div class="col">
              <div class="d-block quick-info">
                <img src="@/assets/icons/kilometres.png" class="quick-icons" alt="">
                {{ vehicle.basic_info.kilometres }}
              </div>
              <div class="d-block quick-info">
                <img src="@/assets/icons/transmission.png" class="quick-icons" alt="">
                {{ vehicle.mechanical_info.transmission }}
              </div>
              <div class="d-block quick-info">
                <img src="@/assets/icons/gaspump.png" class="quick-icons" alt="">
                {{ vehicle.basic_info.fuel_type }}
              </div>
            </div>
          </div>
        </b-card-text>
      </b-card>
    </div>
  </router-link>
</template>

<script>
export default {
  name: 'RegularCard',
  props: {
    vehicle: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
    }
  }
}
</script>

<style lang="scss" scoped>
a {
  text-decoration: none !important;
  color: black !important;
  cursor: pointer;
}
@media (min-width: 319px) {
  .regular-card {
    width: 100%;
    margin: 1.5rem auto;

    .card {
      .card-img-left {
        height: 30vw !important;
      }

      .card-body {
        flex: 1 0 auto;
        padding: 0;

        .card-text {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;

          .quick-icons {
            width: .9rem;
            padding-bottom: .3rem;
          }
          .dollar-icon {
            width: 0.8rem;
          }
          .quick-info {
            font-size: .8rem;
            letter-spacing: 1px;
          }
        }
      }
    }
  }
}

@media (min-width: 499px) {
  .regular-card {
    width: 65vw;

    .card {
      .card-img-left {
        height: 20vw !important;
      }
    }
  }
}

@media (min-width: 800px) {
  .regular-card {
    width: 50vw;

    .card {
      .card-img-left {
        height: 15vw !important;
      }
    }
  }
}

@media (min-width: 800px) {
  .regular-card {
    width: 30rem !important;

    .card {
      .card-img-left {
        height: 10rem !important;
      }
    }
  }
}
</style>
