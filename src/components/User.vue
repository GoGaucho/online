<template>
  <v-sheet style="padding: 30px 10px 20px 0px;">
    <h2 style="margin-left: 20px;">{{name}}</h2>
    <p style="margin-left: 20px;">{{tip}}</p>
    <v-divider></v-divider>
    <!-- Function List -->
    <v-list shaped>
      <v-list-item v-if="!user" @click="login">
        <v-list-item-icon>
          <v-icon>mdi-account-circle</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Login</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item v-if="user" @click="dialog = true">
        <v-list-item-icon>
          <v-icon>mdi-link</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Link Account</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item v-if="user && user.admin" @click="$router.push('/admin')">
        <v-list-item-icon>
          <v-icon>mdi-server</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Admin</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item v-if="user" @click="logout">
        <v-list-item-icon>
          <v-icon>mdi-logout</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <!-- dialog for link account -->
    <v-dialog v-model="dialog" max-width="420px">
      <v-card>
        <v-card-title>
          <span class="headline">Link Account</span>
        </v-card-title>
        <v-card-text>
          <v-alert text dense :type="alertType">{{ alert }}</v-alert>
          <v-text-field v-model="code" label="Code" outlined></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="dialog = false">Cancel</v-btn>
          <v-btn :loading="dialogLoading" color="primary" text @click="link">Link Account</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>

<script>
import { mapState } from 'vuex'
import axios from 'axios'

export default {
  name: 'User',
  data () {
    return {
      dialog: false,
      code: '',
      dialogLoading: false,
      alert: 'For example, GoGauchoBot on Telegram',
      alertType: 'info'
    }
  },
  computed: {
    ...mapState(['user']),
    tip () {
      if (!this.user) return 'You can login with your UCSB Gmail Account'
      else return this.user.email || 'anonymous login'
    },
    name () {
      if (!this.user) return 'Welcome!'
      else return (this.user.name || ',Welcome!').split(',')[1]
    }
  },
  methods: {
    login () {
      window.sessionStorage.callback = window.location.href
      window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https://www.googleapis.com/auth/userinfo.email%20https://www.googleapis.com/auth/userinfo.profile%20openid&response_type=code&prompt=consent&client_id=244305690784-kh1bv40adk1v7nb81vmdses9stguj2ov.apps.googleusercontent.com&hd=ucsb.edu&redirect_uri=https://gogaucho.app/auth.html'
    },
    logout () {
      window.localStorage.removeItem('token')
      window.location.reload(false)
    },
    async link () {
      if (!this.code) return
      this.dialogLoading = true
      await axios // link account request
        .put(`/api/user/${this.code}`, {}, { headers: { token: window.localStorage.token } })
        .then(res => {
          this.alertType = 'success'
          this.alert = 'Success'
          setTimeout(() => { this.dialog = false }, 800)
        })
        .catch(err => {
          this.alertType = 'error'
          this.alert = err.errMsg || 'Fail'
        })
      this.code = ''
      this.dialogLoading = false
    }
  }
}
</script>
