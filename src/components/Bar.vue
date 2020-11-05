<template>
  <v-app-bar app>
    <div class="d-flex align-center">
      <v-img
        alt="GoGaucho Logo"
        class="shrink mr-2"
        contain
        src="../assets/logo.png"
        transition="scale-transition"
        width="40"
        style="border-radius: 4px;"
        @click="$router.push('/')"
      />
      <h2 v-ripple style="padding: 0 5px; user-select: none;">
        {{$route.name}}
      </h2>
    </div>
    <v-spacer></v-spacer>
    <v-btn icon @click="$emit('open')">
      <v-icon :color="userColor" large>mdi-account-circle</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'Bar',
  mounted () {
    this.getUser()
  },
  computed: {
    ...mapState(['user']),
    userColor () {
      if (this.user) return 'primary'
      else return ''
    }
  },
  methods: {
    ...mapActions(['getUser'])
  }
}
</script>
