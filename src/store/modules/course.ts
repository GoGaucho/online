/* eslint-disable no-unused-vars */
import { VuexModule, Module, Mutation } from 'vuex-module-decorators'
import { StrMap } from '@/services/course/utils'

export type CourseDisplay = {id:string, title:string, ge?:string[]}

@Module({ namespaced: true, name: 'course' })
class Course extends VuexModule {
  /** the current quarter */
  public quarter: string = '';

  /** list of courses intended to display */
  public courseList: CourseDisplay[] = [];

  /** selected courses */
  public selected: StrMap<string, string[]> = {};

  @Mutation
  public setQuarter (q: string): void {
    this.quarter = q
  }

  @Mutation
  public setCourseList (list: CourseDisplay[]): void {
    this.courseList = list
  }

  @Mutation
  public addSelectedCourse (course: string): void{
    const q = this.quarter
    if (!this.selected[q]) { this.selected[q] = [] }
    if (!this.selected[q].includes(course)) this.selected[q].push(course)
  }

  @Mutation
  public delSelectedCourse (course: string): void{
    const q = this.quarter
    if (!this.selected[q]) { this.selected[q] = [] }
    this.selected[q] = this.selected[q].filter(e => e !== course)
  }
}
export default Course
