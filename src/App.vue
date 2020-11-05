<template>
  <v-app>
    <Bar @open="userMenu = true" />
    <v-content>
      <transition name="fade" mode="out-in">
        <router-view />
      </transition>
    </v-content>
    <v-navigation-drawer
      app
      right
      temporary
      width="300px"
      v-model="userMenu"
    >
      <user />
    </v-navigation-drawer>
  </v-app>
</template>

<script>
import Bar from '@/components/Bar.vue'
import User from '@/components/User.vue'

export default {
  name: 'App',
  components: {
    Bar, User
  },
  data () {
    return {
      userMenu: false
    }
  }
}
</script>

<style>
  .fade-enter-active, .fade-leave-active {
    transition: opacity .3s;
  }
  .fade-enter, .fade-leave-to {
    opacity: 0;
  }
</style>
