<template>
  <div class="dining d-flex flex-column justify-center align-center">
    <Commons />
  </div>
</template>

<script>
import Commons from '@/components/dining/Commons.vue'
export default {
  name: 'Dining',
  components: {
    Commons
  }
}
</script>

<style scoped>
  div.dining {
    width: 100vw;
    background: #E3F2FD;
  }
</style>
