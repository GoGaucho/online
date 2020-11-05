/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */

import * as CourseList from '@/assets/course'
import { CourseDisplay } from '@/store/modules/course'

function addQuarterName (q:string) {
  const name = ['', 'Winter', 'Spring', 'Summer', 'Fall']
  return { q: q, str: q.substr(0, 4) + ' ' + name[+q.substr(4, 1)] }
}

export async function getQuarters () {
  return ['20204', '20203', '20202', '20201'].map(e => addQuarterName(e))
}

export function getDept () {
  return CourseList.default.dept.map(e => ({ code: e.code, name: e.code + ' - ' + e.name }))
}

export function getCollege () {
  return CourseList.default.ge.map((e, i) => ({ college: e.college, ind: i, codes: e.codes }))
}

export function getNumber (id:string) {
  const ids = id.replace(/[A-Z-]+/g, ' ').trim().split(' ')
  return ids[ids.length - 1]
}

export function getPrefix (id:string) {
  return id.substr(0, id.indexOf(getNumber(id)))
}

export function sortCourse (ids: CourseDisplay[]) {
  const list = ids.map((e:CourseDisplay) => ({ num: +getNumber(e.id), pre: getPrefix(e.id), val: e }))
  const sorted = list.sort((a, b) =>
    a.val.ge && b.val.ge && a.val.ge.length !== b.val.ge.length ? b.val.ge.length - a.val.ge.length
      : a.pre > b.pre ? 1 : a.pre < b.pre ? -1
        : a.num > b.num ? 1 : a.num < b.num ? -1
          : a.val.id > b.val.id ? 1 : a.val.id < b.val.id ? -1 : 0)
  return sorted.map(e => e.val)
}
