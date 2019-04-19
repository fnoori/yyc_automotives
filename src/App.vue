<template>
  <div id="app">
    <my-header/>
    <keep-alive>
      <router-view/>
    </keep-alive>
    <my-footer/>
  </div>
</template>

<script>
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default {
  components: {
    'my-header': Header,
    'my-footer': Footer
  },
  data () {
    return {

    }
  }
}
</script>

<style lang="scss">
#app {
  -webkit-overflow-scrolling: touch;
}
</style>
