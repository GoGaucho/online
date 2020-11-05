<template>
  <div class="selector">
    <div class="loading" v-if="loading">Loading ...</div>
    <template v-if="display.quarter">
      <v-select
        :value="quarter"
        @input="setQuarter"
        :items="display.quarter"
        item-text="str"
        item-value="q"
        :disabled="loading"
        solo
      />
    </template>
    <template v-if="display.by">
      <v-btn-toggle v-model="query.by" mandatory>
        <v-btn v-for="str of display.by" v-bind:key="str" :value="str" :disabled="loading" >{{str}}</v-btn>
      </v-btn-toggle>
    </template>
    <template v-if="display.dept">
      <v-select v-model="query.dept" :items="display.dept" item-text="name" item-value="code" :disabled="loading" solo/>
    </template>
    <template v-if="display.college">
      <v-select v-model="query.college" :items="display.college" item-text="college" item-value="ind" :disabled="loading" solo />
    </template>
    <template v-if="display.gecode">
      <v-select v-model="query.gecode" :items="display.gecode" :disabled="loading" chips multiple />
    </template>
    <template v-if="display.search">
      <v-text-field v-model="query.search" @keydown.enter="querySearch" :disabled="loading" />
    </template>
    <template v-if="display.level">
      <v-btn-toggle v-model="query.level" multiple>
        <v-btn v-for="str in display.level" v-bind:key="str" :disabled="loading" :value="str">{{str}}</v-btn>
      </v-btn-toggle>
    </template>
    <template v-if="query.gecode">
      <v-btn-toggle v-model="query.gereq" multiple>
        <v-btn v-for="str in query.gecode" v-bind:key="str" :disabled="loading" :value="str">{{str}}</v-btn>
      </v-btn-toggle>
    </template>
    <template v-if="query.gecode.length">
      <v-btn :disabled="loading || query.gecount===0" @click="query.gecount--">-</v-btn>
      {{query.gecount}}
      <v-btn :disabled="loading || query.gecount==query.gecode.length" @click="query.gecount++">+</v-btn>
    </template>
  </div>
</template>

<script lang="ts">
/* eslint-disable no-unused-vars */
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { ResultOptions, StrMap } from '@/services/course/utils'
import { loader } from '@/services/course'
import { CourseDisplay } from '@/store/modules/course'
import * as HELPER from '@/services/course/helper'

type GE = {college:string, ind:number, codes:string[]}
type DEPT = {code:string, name:string}

type Display = {
  quarter: {q:string, str:string}[];
  by: ['Search', 'GE', 'Department'];
  dept: DEPT[];
  college: GE[];
  gecode: string[];
  search: boolean;
  level: ['Lower', 'Upper', 'Grad', 'Postgrad'];
};

type Query = {
  by: 'Search' | 'GE' | 'Department';
  dept: string;
  college: number;
  gecode: string[];
  search: string;
  level: ('Lower' | 'Upper' | 'Grad' | 'Postgrad')[];
  gereq: string[];
  gecount: number;
};

const state = namespace('course')

@Component
export default class Selector extends Vue {
  /** used to disable selectors, possible input: quarter */
  @Prop() readonly disable?: string[];

  @state.State
  public quarter!: string;

  @state.Mutation
  public setQuarter!: (q: string) => void;

  @state.Mutation
  public setCourseList: (list:CourseDisplay[])=>void

  /** true if this component is loading, used for display and disable elements */
  private loading = true;

  private rawCourseList = [];

  /** contains the data for this selector to display */
  private display: Display = {
    quarter: null,
    by: ['Search', 'GE', 'Department'],
    dept: null,
    college: null,
    gecode: null,
    search: true,
    level: ['Lower', 'Upper', 'Grad', 'Postgrad']
  };

  /** contains the user input query */
  private query: Query = {
    by: 'Search',
    dept: null,
    college: null,
    gecode: [],
    search: '',
    level: ['Lower', 'Upper'],
    gereq: [],
    gecount: 0
  };

  /** load the component */
  async mounted () {
    if (!this.disable || !this.disable.includes('quarter')) {
      this.display.quarter = await HELPER.getQuarters()
      if (!this.quarter) this.setQuarter(this.display.quarter[0].q)
    }
    this.loading = false
  }

  /** listen to query changes and refresh display field to change the view */
  @Watch('query.by')
  queryBy () {
    this.display.search = false
    this.display.dept = null
    this.display.college = null
    this.display.gecode = null
    this.display.search = false
    this.query.search = ''
    this.query.dept = null
    this.query.college = null
    this.query.gecode = []
    this.query.gereq = []
    this.query.gecount = 0
    switch (this.query.by) {
      case 'Search':
        this.display.search = true
        break
      case 'Department':
        this.display.dept = HELPER.getDept()
        break
      case 'GE':
        this.display.college = HELPER.getCollege()
    }
  }

  @Watch('query.college')
  queryCollege () {
    if (this.query.by !== 'GE') { return }
    this.display.gecode = this.display.college[this.query.college].codes
  }

  @Watch('query.gecode.length')
  async queryGECode () {
    if (this.query.by !== 'GE') { return }
    if (this.query.gecode.length === 0) { return }
    this.query.gecode.sort()
    this.loading = true
    const map : StrMap<string, CourseDisplay> = {}
    for (const code of this.query.gecode) {
      const list = await loader.queryGE(this.quarter, `${this.display.college[this.query.college].college}-${code}`)
      for (const course of list) {
        if (!map[course.id])map[course.id] = { id: course.id, title: course.title, ge: [] }
        if (!map[course.id].ge.includes(code)) map[course.id].ge.push(code)
      }
    }
    const list : CourseDisplay[] = []
    for (const id in map) list.push(map[id])
    this.setRawCourseList(HELPER.sortCourse(list))
    this.loading = false
  }

  @Watch('query.dept')
  queryDept () {
    if (this.query.by !== 'Department') { return }
    // TODO
    console.log('TODO: load courses under department ' + this.query.dept)
  }

  async querySearch () {
    if (this.query.by !== 'Search') { return }
    if (this.query.search.trim().length === 0) { return }
    this.loading = true
    const result = await loader.search(this.quarter, this.query.search)
    const list = ResultOptions.map(e => result[e]).map(e => HELPER.sortCourse(e)).flat()
    const map = {}
    this.setRawCourseList(list.filter(e => {
      const res = map[e.id]
      map[e.id] = true
      return !res
    }))
    this.loading = false
  }

  @Watch('query.level')
  @Watch('query.gereq')
  @Watch('query.gecount')
  queryGEOptions () {
    this.setRawCourseList()
  }

  setRawCourseList (list?: CourseDisplay[]) {
    if (list) { this.rawCourseList = list }
    this.setCourseList(this.rawCourseList.filter(e => {
      // level filter
      const num = +HELPER.getNumber(e.id) / 100
      if (num === 0 && !this.query.level.includes(this.display.level[0])) { return false }
      if (num === 1 && !this.query.level.includes(this.display.level[1])) { return false }
      if (num === 2 && !this.query.level.includes(this.display.level[2])) { return false }
      if (num === 5 && !this.query.level.includes(this.display.level[3])) { return false }
      // GE filter
      if (this.query.by === 'GE') {
        if (e.ge.length < this.query.gecount) { return false }
        for (const code of this.query.gereq) {
          if (!e.ge.includes(code)) { return false }
        }
      }
      return true
    }))
  }
}
</script>
