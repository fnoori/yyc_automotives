<template>
  <div class="home">
    <div class="premium-row">
      <premium-card v-for="premium in premiumVehicles" :key="premium._id" :vehicle="premium"/>
      <!-- <button @click="premiumLoadMore">load more</button> -->
      <!-- <div>{{loadingPremium}}</div> -->
    </div>

    <div class="regular-row">
      <regular-card v-for="regular in regularVehicles" :key="regular._id" :vehicle="regular" />
      <!-- <button @click="regularLoadMore">load more</button> -->
      <!-- <div>{{loadingRegular}}</div> -->
    </div>
  </div>
</template>

<script>
import PremiumCards from '@/components/PremiumCards'
import RegularCards from '@/components/RegularCards'
import { mapState } from 'vuex'

export default {
  name: 'Home',
  components: {
    'premium-card': PremiumCards,
    'regular-card': RegularCards
  },
  data () {
    return {
      premiumSkip: 0,
      premiumLimit: 2,

      regularSkip: 0,
      regularLimit: 2
    }
  },
  created () {
    this.premiumLoadMore()
    this.regularLoadMore()
  },
  computed: {
    ...mapState([
        'premiumVehicles',
        'regularVehicles',
        'loadingPremium',
        'loadingRegular'
      ])
  },
  methods: {
    premiumLoadMore () {
      this.$store.dispatch('fetchPremiumVehicles', {
        skip: this.premiumSkip,
        limit: this.premiumLimit
      })
      this.premiumSkip += 2
    },
    regularLoadMore () {
      this.$store.dispatch('fetchRegularVehicles', {
        skip: this.regularSkip,
        limit: this.regularLimit
      })
      this.regularSkip += 2
    }
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
