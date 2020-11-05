/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
import * as UTIL from './utils'

export type S_Quarter = string;
export type S_Session = string;
export type S_CourseID = string;
export type S_EnrollCode = string;
export type S_Time = string;
export type S_Date = string;

/** The storage and transmission format for courses */
export type CourseObject = {
  id: S_CourseID,
  quarter: S_Quarter,

  info: CourseInfo,
  tree: Tree,
  sections: SectionInfo[]
};

export type CourseInfo = {
  title: string,
  description: string,
  college: string,
  grading: string,
  level: string,
  min_unit: number,
  max_unit: number,
  GE: string[]
};

export type Tree = { session: S_Session, lectures: { lecture: S_EnrollCode, sections: S_EnrollCode[] }[] }[];

export type SectionInfo = {
  code: S_EnrollCode,
  section: string,
  cancel: boolean,
  close: boolean,
  instructors: string[],
  periods: PeriodInfo[],
  final: {
    time: string,
    comment: string
  }
};

export type PeriodInfo = {
  days: S_Date,
  begin: S_Time,
  end: S_Time,
  location: string
};

/** The standard format for courses */
export class CourseData {
  sessions: S_Session[];
  lectures: UTIL.StrMap<S_Session, S_EnrollCode[]> = {};
  sections: UTIL.StrMap<S_EnrollCode, S_EnrollCode[]> = {};
  sectionInfo: UTIL.StrMap<S_EnrollCode, SectionInfo> = {};
  code2session: UTIL.StrMap<S_EnrollCode, S_Session> = {};
  parent: UTIL.StrMap<S_EnrollCode, S_EnrollCode> = {};
  info: CourseObject;

  constructor (obj: CourseObject) {
    this.info = obj
    this.sessions = obj.tree.map(e => e.session)
    for (const s of obj.tree) {
      this.lectures[s.session] = s.lectures.map(l => l.lecture)
      for (const l of s.lectures) {
        this.code2session[l.lecture] = s.session
        this.sections[l.lecture] = l.sections
        for (const e of l.sections) {
          this.parent[e] = l.lecture
          this.code2session[e] = s.session
        }
      }
    }
    for (const s of obj.sections) { this.sectionInfo[s.code] = s }
  }
}
