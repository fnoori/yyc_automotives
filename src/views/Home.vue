<template>
  <div class="home">
    <div class="premium-row">
      <premium-card v-for="premium in premiumVehicles" :key="premium._id" :vehicle="premium"/>
    </div>

    <div class="regular-row">
      <regular-card v-for="regular in regularVehicles" :key="regular._id" :vehicle="regular" />
    </div>
  </div>
</template>

<script>
import PremiumCards from '@/components/PremiumCards'
import RegularCards from '@/components/RegularCards'
import axios from 'axios'

export default {
  name: 'Home',
  components: {
    'premium-card': PremiumCards,
    'regular-card': RegularCards
  },
  data () {
    return {
      premiumVehicles: Object,
      premiumSkip: 0,
      premiumLimit: 5,

      regularVehicles: Object,
      regularSkip: 0,
      regularLimit: 5
    }
  },
  mounted () {
    axios.get(`${process.env.VUE_APP_API_ROUTE}/vehicles/get-premium-vehicles/${this.premiumSkip}/${this.premiumLimit}`)
      .then((premium) => {
        this.premiumVehicles = premium.data
      }).catch(premiumGetErr => {
        alert(`unexpected error when retrieving premium ads`)
      })

    axios.get(`${process.env.VUE_APP_API_ROUTE}/vehicles/get-regular-vehicles/${this.regularSkip}/${this.regularLimit}`)
      .then((regular) => {
        this.regularVehicles = regular.data
      }).catch(regularGetErr => {
        alert(`unexpected error when retrieving regular ads`)
      })
  }
}
</script>

<style lang="scss" scoped>
.premium-row {
  width: 100%;
  overflow-x: scroll;
  padding-bottom: 5px;
  white-space: nowrap;
  position: relative;
}

@media (max-width: 768px) {
  .home {
    margin: 1rem 0;
  }

  .regular-row {
    margin: 1rem;
  }
}
</style>
