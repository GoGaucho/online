<template>
  <div class="home d-flex flex-column justify-center align-start">
    <h1 class="d-flex">
      <div>G</div>
      <div :class="[expand ? 'expand' : 'hide-width']">aucho</div>
      <div>O</div>
      <div :class="[expand ? 'expand' : 'hide-width']">nline</div>
    </h1>
    <p>We are here for your success</p>
    <div :class="[expand ? 'show' : 'hide-opacity', 'buttons', 'd-flex']">
      <v-btn color="primary" style="margin: 10px;" large
        @click="$router.push('/course')"
      >
        <v-icon left>mdi-book</v-icon>Course
      </v-btn>
      <v-btn color="primary" style="margin: 10px;" large
        @click="$router.push('/dining')"
      >
        <v-icon left>mdi-food</v-icon>Dining
      </v-btn>
      <v-btn color="primary" style="margin: 10px;" large      >
        <v-icon left>mdi-library</v-icon>Library
      </v-btn>
    </div>
    <div class="footer">
      <a href="https://forms.gle/6s1V2HeZFNjuw3sw7">Feedback</a><br>
      <a href="https://about.gogaucho.app/">Copyright&nbsp;&copy;&nbsp;2020 GoGaucho</a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data () {
    return {
      expand: false
    }
  },
  mounted () {
    setTimeout(() => {
      this.expand = true
    }, 1000)
  }
}
</script>

<style scoped>
  * {
    overflow: hidden;
    transition: all 1s ease;
  }
  div.home {
    position: relative;
    height: 100%;
    width: 100vw;
    padding: 50px;
    color: #333;
    background-image: url("../assets/banner.svg");
    background-size: cover;
    background-position: bottom right;
  }
  h1 {
    font-size: 7rem;
  }
  p {
    font-size: 1.5rem;
    margin-left: 20px;
  }
  .hide-width {
    width: 0;
  }
  .hide-opacity {
    opacity: 0.6;
  }
  .expand {
    width: 21rem;
  }
  .show {
    opacity: 1;
  }
  div.buttons {
    margin: 0 0 50px 10px;
    max-width: 80%;
    flex-wrap: wrap;
  }
  div.footer {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 100%;
    text-align: right;
    color: white;
    opacity: 0.8;
  }
  div.footer a {
    color: white;
    text-decoration: none;
  }
  /* responsive */
  @media (max-width: 900px) {
    h1 { font-size: 5rem; }
    p { font-size: 1.3rem; }
    .expand { width: 15rem; }
  }
  @media (max-width: 680px) {
    h1 { font-size: 3.5rem; }
    p { font-size: 1.1rem; }
    .expand { width: 10.5rem; }
  }
  @media (max-width: 500px) {
    div.home { padding: 20px; }
    div.buttons { flex-direction: column; }
    h1 { font-size: 2.5rem; }
    p {
      font-size: 1rem;
      margin-left: 5px;
    }
    .expand { width: 7.5rem; }
  }
</style>
