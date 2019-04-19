<template>
  <footer class="text-muted" variant="primary">
    <a href="fnoori431@gmail.com">fnoori431@gmail.com</a>
  </footer>
</template>

<script>
export default {
  name: 'Footer',
  data () {
    return {

    }
  }
}
</script>

<style lang="scss" scoped>
  footer {
    @include footer-style;

    a {
      @include no-default-link;
      display: flex;
      align-items: center;
      height: 100%;
    }
  }
</style>
