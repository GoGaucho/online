<template>
  <div class="library">
    <p>{{ tip }}</p>
    <v-card v-for="l in libs" :key="l.id" style="margin: 20px;">
      <v-card-title>
        {{ l.name }}
        <v-progress-circular
          style="margin-left: 20px;"
          :value="100 * l.percentage"
          :rotate="-90"
          :color="l.percentage > 0.8 ? 'error' : l.percentage > 0.6 ? 'warning' : 'success'"
        ></v-progress-circular>
      </v-card-title>
      <v-card-subtitle>{{ l.hourSummary }}</v-card-subtitle>
      <v-card-text>
        <template v-for="s in l.sublocations">
          <v-list-item :key="s.id">
            {{ s.name }} &nbsp; ({{ s.people }}/{{ s.capacity }})
          </v-list-item>
          <v-progress-linear
            style="width: 80%; margin-left: 10%;"
            :key="s.id + 'P'"
            :value="100 * s.percentage"
            :color="s.percentage > 0.8 ? 'error' : s.percentage > 0.6 ? 'warning' : 'success'"
          ></v-progress-linear>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'Library',
  data: () => ({
    tip: 'Loading...',
    libs: []
  }),
  mounted () {
    this.$ajax // get lib info
      .get('/api/waitz')
      .then(resp => {
        this.libs = resp.data
        this.tip = ''
      })
      .catch(err => {
        this.tip = err.response ? err.response.data : 'Network Error'
      })
  }
}
</script>

<style scoped>
  div.library {
    width: 100vw;
    padding: 2%;
  }
</style>
