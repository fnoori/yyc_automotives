<template>
  <div class="gallery">
    <b-carousel
      :interval="0"
      slide
      indicators>
        <b-carousel-slide
          v-for="(image, index) in images"
          img-src="https://via.placeholder.com/1920x1080?text=Visit+Blogging.com+Now"/>
    </b-carousel>
  </div>
</template>

<script>
// uses bootstrap-vue's carousel component to view vehicle images
export default {
  name: 'Gallery',
  props: {
    // images coming from Vehicle page
    images: Array
  },
  data () {
    return {
      mainProps: {
        blank: true,
        blankColor: '#bbb'
      }
    }
  },

  methods: {
  }
}
</script>

<style lang="scss" scoped>
@media (min-width: 320px) {
  .gallery {
    .viewed {
      margin: 0 auto;
      overflow-x: auto;
      white-space: nowrap;
      scroll-snap-type: x mandatory;

      img {
        width: 95%;
        margin: .5rem;
        scroll-snap-align: center;
      }

    }
  }
}

@media (min-width: 576px) {
  .gallery {
    .viewed {
      img {
        width: 100%;
      }
    }
  }
}
</style>
