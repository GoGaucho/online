<template>
  <v-flex v-show="dataReady" flat>
  <v-container>
    <v-row dense>
      <v-col
        v-for="(common, i) in commons"
        :key="i"
        class="col-xs-12 col-md-6"
      >
        <v-card>
          <v-img
            :src="require(`@/assets/common_pic/${common.title}.jpg`)"
            class="white--text align-end picture"
            transition="fab-transition"
            max-height="30vh"
          >
            <v-card-title style="font-size: 30px">{{ common.title }}</v-card-title>
          </v-img>

          <v-card-text
            class="text--primary"
            v-if="common.open"
          >
            Open today
          </v-card-text>
          <v-card-text
            class="text--primary"
            v-else
          >
            Closed now
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>

            <!-- View Schedule -->
            <v-dialog v-model="dialog1" scrollable max-width="70vw">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  v-bind="attrs"
                  v-on="on"
                  v-show="common.open"
                  class="mr-2"
                >
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      icon
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon>mdi-timer</v-icon>
                    </v-btn>
                  </template>
                  <span>View Schedule</span>
                </v-tooltip>
                </v-btn>
              </template>
              <v-card v-show="common.open">
                <v-card-title>
                  Today's schedule of {{ common.title }}
                </v-card-title>
                  <v-divider></v-divider>
                  <v-list
                    v-for="meal in common.hours"
                    :key="meal.name"
                  >
                    <v-list-item-title class="ml-8">{{ meal.name }}: {{ meal.open }} - {{ meal.close }} </v-list-item-title>
                  </v-list>
                  <v-divider></v-divider>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="dialog1 = false">Close</v-btn>
                  </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- View Menu -->
            <v-dialog v-model="dialog2" scrollable max-width="70vw">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  v-bind="attrs"
                  v-on="on"
                  v-show="common.open"
                  class="mr-2"
                >
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      icon
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon>mdi-menu</v-icon>
                    </v-btn>
                  </template>
                  <span>View Menu</span>
                </v-tooltip>
                </v-btn>
              </template>
              <v-card>
                <v-tabs
                  background-color="primary"
                  color="white"
                  dark
                  centered
                  height="70px"
                >
                  <v-tabs-slider color="white"></v-tabs-slider>
                  <v-tab
                    v-for="meal in common.hours"
                    :key="meal.name"
                  >
                    <span>
                      {{ meal.name }}
                      <h4 class="mt-2"> {{ meal.open }} - {{ meal.close }} </h4>
                    </span>

                  </v-tab>
                </v-tabs>
                  <v-tabs-items v-model="tab">
                  <v-tab-item
                    v-for="(common, i) in commons"
                    :key="i"
                  >
                    <v-card flat>
                      <v-card-text>{{ commons[i].title }}</v-card-text>
                    </v-card>
                  </v-tab-item>
                </v-tabs-items>
                  <v-divider></v-divider>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="dialog2= false">Close</v-btn>
                  </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- View Location -->
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  v-bind="attrs"
                  v-on="on"
                  @click="getLocation(common.title)"
                >
                  <v-icon>mdi-map-marker</v-icon>
                </v-btn>
              </template>
              <span>Find Location</span>
            </v-tooltip>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  </v-flex>
</template>

<script>
export default {
  name: 'Commons',
  data () {
    return {
      commons: [
        { title: 'Ortega', open: false, hours: [], menus: {} },
        { title: 'Carrillo', open: false, hours: [], menus: {} },
        { title: 'De La Guerra', open: false, hours: [], menus: {} },
        { title: 'Portola', open: false, hours: [], menus: {} }
      ],
      dialog1: false,
      dialog2: false,
      dataReady: false
    }
  },
  beforeMount: function () {
    this.getData()
    this.dataReady = true
  },
  methods: {
    checkTimeRange (beginTime, endTime) {
      var strb = beginTime.split(':')
      if (strb.length !== 2) {
        return false
      }
      var stre = endTime.split(':')
      if (stre.length !== 2) {
        return false
      }

      var b = new Date()
      var e = new Date()
      var n = new Date()

      b.setHours(strb[0])
      b.setMinutes(strb[1])
      e.setHours(stre[0])
      e.setHours(stre[1])

      console.log(n)
      if (n.getTime() - b.getTime() > 0 && n.getTime() - e.getTime() < 0) {
        return true
      } else {
        return false
      }
    },
    getData () {
      var _this = this
      this.$ajax // get hours
        .get('/api/dining/hours')
        .then(resp => {
          for (var p in resp.data) {
            for (var s in _this.commons) {
              if (_this.commons[s].title.toLowerCase() === resp.data[p].diningCommonCode) {
                var m = resp.data[p].mealCode
                m = m.replace(m[0], m[0].toUpperCase())
                var meal = {
                  name: m,
                  open: resp.data[p].open,
                  close: resp.data[p].close
                }
                _this.commons[s].hours.push(meal)
                _this.commons[s].open = true
              }
            }
          }
        })
      // get menus
      for (var s in _this.commons) {
        if (_this.commons[s].open >= 1) {
          this.$ajax
            .get('/api/dining/menus/' + _this.commons[s].title.toLowerCase())
            .then(resp => {
              _this.commons[s].menus = resp.data
              console.log(_this.commons[s])
            })
        }
      }

      _this.$nextTick(function () {
        _this.dataReady = true
      })
    },
    getLocation (commonTitle) {
      window.location.href = 'https://www.google.com/maps/search/?api=1&query=' + commonTitle + ' UCSB'
    }
  }
}
</script>

<style scoped>
.scroll {
  overflow-y: scroll
}
</style>
