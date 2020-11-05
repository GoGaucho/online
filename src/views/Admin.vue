<template>
  <div class="admin d-flex flex-column justify-center align-center">
    <v-alert text dense :type="alertType">{{ alert }}</v-alert>
    <div class="d-flex" style="align-self: flex-start; height: 100px;">
      <v-select
        :items="['info', 'task']"
        label="Model"
        v-model="model"
        outlined
      ></v-select>
      <v-btn style="margin: 10px;" v-if="model" large color="primary" @click="getAll">Get</v-btn>
      <v-btn style="margin: 10px;" v-if="model" large color="success" @click="edit">Add</v-btn>
    </div>
    <v-card style="width: 100%;">
      <v-list-item three-line v-for="d in data" :key="d._id" @click="edit(d)">
        <v-list-item-content>
          <v-list-item-title>{{ d._id }}</v-list-item-title>
          <v-list-item-subtitle>{{ description(d) }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-card>
    <v-bottom-sheet v-model="sheet" inset>
      <v-card :loading="loading" :disabled="loading">
        <v-card-title>Document</v-card-title>
        <v-card-text>
          <v-textarea height="60vh" outlined v-model="doc"></v-textarea>
        </v-card-text>
        <v-card-actions class="d-flex">
          <v-spacer></v-spacer>
          <v-btn color="success" @click="upsert">Upsert</v-btn>
          <v-btn color="error" @click="remove">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-bottom-sheet>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Admin',
  data () {
    return {
      alert: 'Be careful for all admin operations',
      alertType: 'info',
      model: '',
      sheet: false,
      loading: false,
      data: [],
      doc: ''
    }
  },
  methods: {
    async getAll () {
      axios // get all data
        .get(`/api/${this.model}`, { headers: { token: window.localStorage.token } })
        .then(resp => {
          this.data = resp.data
          this.alert = 'Be careful for all admin operations'
          this.alertType = 'info'
        }).catch(err => {
          this.alert = err.errMsg || 'Fail'
          this.alertType = 'error'
        })
    },
    description (d) {
      if (this.model === 'task') return d.description
      else {
        const a = new Date(d.timestamp * 1000)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const year = a.getFullYear()
        const month = months[a.getMonth()]
        const date = a.getDate()
        const hour = a.getHours()
        const min = a.getMinutes()
        const sec = a.getSeconds()
        return `${month} ${date} ${year} ${hour}:${min}:${sec}`
      }
    },
    async edit (d) {
      this.doc = '{\n\n}'
      this.loading = true
      this.sheet = true
      if (!d) return
      await axios // get detail doc
        .get(`/api/${this.model}/${d._id}`, { headers: { token: window.localStorage.token } })
        .then(resp => {
          this.doc = JSON.stringify(resp.data, null, 2)
          this.alert = 'Be careful for all admin operations'
          this.alertType = 'info'
        }).catch(err => {
          this.alert = err.errMsg || 'Fail'
          this.alertType = 'error'
        })
      this.loading = false
    },
    async remove () {
      const d = JSON.parse(this.doc)
      if (!d._id) return
      this.loading = true
      await axios // delete doc
        .delete(`/api/${this.model}/${d._id}`, { headers: { token: window.localStorage.token } })
        .then(resp => {
          this.alert = 'Success'
          this.alertType = 'success'
          this.sheet = false
          this.getAll()
        }).catch(err => {
          this.alert = err.errMsg || 'Fail'
          this.alertType = 'error'
        })
      this.loading = false
    },
    async upsert () {
      const d = JSON.parse(this.doc)
      if (!d._id) return
      this.loading = true
      await axios // upsert doc
        .put(`/api/${this.model}`, d, { headers: { token: window.localStorage.token } })
        .then(resp => {
          this.alert = 'Success'
          this.alertType = 'success'
          this.sheet = false
          this.getAll()
        }).catch(err => {
          this.alert = err.errMsg || 'Fail'
          this.alertType = 'error'
        })
      this.loading = false
    }
  }
}
</script>

<style scoped>
  div.admin {
    width: 100vw;
    padding: 20px;
  }
</style>
