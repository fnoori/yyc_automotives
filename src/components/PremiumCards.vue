<template>
  <router-link
    :to="{ name: 'vehicle', params: { vehicle_id: vehicle._id } }"
    :key="vehicle._id">
    <b-card
      :title="vehicle.basic_info.year + ' ' + vehicle.basic_info.make + ' ' + vehicle.basic_info.model + ' ' + vehicle.basic_info.trim"
      :sub-title="'$ ' + vehicle.basic_info.price"
      title-tag="h6"
      :img-src="vehicle.images[0].url"
      img-alt="Image"
      class="premium-card"
      img-top>

      <b-card-text class="row text-right">
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
      </b-card-text>
      <div slot="footer">
        <small class="text-muted">
          <a href="#">{{ vehicle.dealership.name }}</a>
        </small>
      </div>
    </b-card>
  </router-link>
</template>

<script>
export default {
  name: 'PremiumCard',
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

.premium-card {
  display: inline-block !important;
}
@media (min-width: 320px) {
  .premium-card {
    width: 18.5rem;
    margin: auto .5rem;

    img {
      width: 100%;
    }
    .card-body {
      height: 10rem;

      .quick-info {
        letter-spacing: 1px;
      }
      .quick-icons {
        width: 1rem;
        padding-bottom: .3rem;
      }
    }
    .card-footer a {
      text-decoration: none;
      color: #6c757d !important;
    }
  }
}

@media (min-width: 767px) {
  .premium-card {
    margin: 0.5rem;
  }
}
</style>
