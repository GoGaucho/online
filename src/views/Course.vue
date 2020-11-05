<template>
  <div class="course d-flex flex-column justify-center align-center">
    <Selector />
    <CourseList />
    <h1>This is Course Page</h1>
    <p>On this page, there should be a couple of complex components which are used to look up courses.</p>
  </div>
</template>

<script>
import Selector from '@/components/course/Selector.vue'
import CourseList from '@/components/course/CourseList.vue'
export default {
  name: 'Course',
  components: { Selector, CourseList }
}
</script>

<style scoped>
div.course {
  width: 100vw;
}
</style>
