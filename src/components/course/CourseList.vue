<template>
    <div class="course-list">
      <div v-for="course in courseList" v-bind:key="course.id">
        {{course.id}} - {{course.title}}
        <div v-if="course.ge">
          <div v-for="code in course.ge" v-bind:key="code">{{code}}</div>
        </div>
        <v-btn @click="addSelectedCourse(course.id)">Add</v-btn>
      </div>
    </div>
</template>

<script lang="ts">
/* eslint-disable no-unused-vars */
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'

import { CourseDisplay } from '@/store/modules/course'

const state = namespace('course')

@Component
export default class CourseList extends Vue {
  @state.State
  public courseList! : CourseDisplay[]

  @state.Mutation
  public addSelectedCourse : (course:string)=>void
}
</script>
