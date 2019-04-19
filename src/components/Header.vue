<template>
  <b-navbar type="dark" variant="primary">
    <b-navbar-brand>
      <router-link :to="{ name: 'home' }">
        <img src="@/assets/logos/primary.png" class="logo">
      </router-link>
    </b-navbar-brand>

    <div class="search-bar">
      <b-input-group>
        <b-form-input></b-form-input>
        <b-input-group-append>
          <b-button variant="info btn-sm">
            <i class="material-icons">
            search
            </i>
          </b-button>
        </b-input-group-append>
      </b-input-group>
    </div>

  </b-navbar>
</template>

<script>
export default {
  name: 'Header',
  data () {
    return {
      menuExpanded: false,
      loggedIn: true
    }
  },

  methods: {
  }
}
</script>

<style lang="scss" scoped>
  nav {
    box-shadow: 0 0px 1px 0px rgba(0,0,0,.15);
  }

  input:focus {
    box-shadow: none !important;
    border-color: white !important;
  }
  input {
    border-radius: 0 !important;
    border: white !important;
  }
  .form-control:focus {
    z-index: 1 !important;
  }
  .btn {
    border-radius: 0 !important;
    line-height: 1;
    border-left: 1px solid rgba(0, 0, 0, 0.1);
    border-bottom: white;
    border-top: white;
    width: 5rem;
  }

  .material-icons {
    color: #56423a;
    height: 100%;
    align-items: center;
    display: flex;
    justify-content: center;
  }

  .search-bar {
    .input-group {
      box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.5);
    }
  }

  @media (min-width: 319px) {
    nav {
      display: block !important;

      .input-group {
        margin-top: 3 !important;
      }
      .logo {
        width: 6rem !important;
      }
      .navbar-brand {
        display: block !important;
      }
      .search-bar {
        display: block !important;
      }
    }
  }

  @media (min-width: 374px) {
    nav {
      .logo {
        width: 6rem !important;
      }
    }
  }

  @media (min-width: 767px) {
    nav {
      display: inline-block !important;
      width: 100%;

      .input-group {
        margin-top: 3 !important;
      }
      .logo {
        width: 6rem !important;
      }
      .navbar-brand {
        display: inline-block !important;
      }
      .search-bar {
        display: inline-block !important;
        width: 80vw;

        .input-group {
          width: 35rem !important;
          margin: 0 auto;
        }
      }
    }
  }
</style>
