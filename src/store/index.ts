import Vue from 'vue'
import Vuex from 'vuex'
import Course from './modules/course'
import axios from 'axios'

Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    user: null
  },
  modules: {
    course: Course
  },
  actions: {
    getUser ({ state }) {
      const token = window.localStorage.token
      if (!token) state.user = null
      else {
        axios // get user information
          .get('/api/user', { headers: { token: token } })
          .then(resp => {
            state.user = {
              name: resp.data.name,
              email: resp.data.email,
              admin: resp.data.admin
            }
          })
          .catch(err => {
            console.log(err)
            state.user = null
            window.localStorage.removeItem('token')
          })
      }
    }
  }

})
export default store
