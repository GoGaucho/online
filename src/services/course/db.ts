/* eslint-disable camelcase */
/* eslint-disable no-return-assign */
/* eslint-disable no-unused-vars */
import * as UTIL from './utils'
import * as TYPE from './api'
import * as IDB from 'idb'
import Axios from 'axios'

// here quarter should be 'md5' for storage index
type CourseHash = {time:number, quarter:'md5', Info:string, Tree:string, Sections:string};

const f_info = ['title', 'description', 'college', 'grading', 'level', 'restriction', 'min_unit', 'max_unit', 'GE']
const f_sect = ['section', 'cancel', 'close', 'final', 'instructors', 'periods']
const f_type = ['Info', 'Tree', 'Sections']

function getCourseInfo (obj:any): UTIL.StrMap<TYPE.S_CourseID, TYPE.CourseInfo> {
  const data = {}
  for (const key in obj) {
    const info = {}
    f_info.forEach((e, i) => info[e] = obj[key][i])
    data[key] = info
  }
  return data
}

function getCourseTree (obj:any): UTIL.StrMap<TYPE.S_CourseID, TYPE.Tree> {
  const data = {}
  for (const key in obj) {
    const tree : TYPE.Tree = []
    for (const ses in obj[key]) {
      const session = { session: ses, lectures: [] }
      for (const lec in obj[key][ses]) {
        session.lectures.push({ lecture: lec, sections: obj[key][ses][lec] })
      }
      tree.push(session)
    }
    data[key] = tree
  }
  return data
}

function getCourseSections (obj:any): UTIL.StrMap<TYPE.S_CourseID, TYPE.SectionInfo[]> {
  const data = {}
  for (const key in obj) {
    const list = []
    for (const id in obj[key]) {
      const dat = obj[key][id]
      const sec = { code: id }
      f_sect.forEach((e, i) => sec[e] = e === 'final' ? { time: dat[i][0], comment: dat[i][1] } : dat[i])
      list.push(sec)
    }
    data[key] = list
  }
  return data
}

async function getCourseHash (): Promise<UTIL.StrMap<TYPE.S_Quarter, CourseHash>> {
  const data = (await Axios.get('/api/info/CourseHash')).data
  const ls = {}
  for (const key in data.data) {
    const q = key.substr(key.length - 5, 5)
    const s = key.substr(6, key.length - 11)
    if (!ls[q])ls[q] = { time: data.timestamp, quarter: 'md5' }
    ls[q][s] = data.data[key]
  }
  return ls
}

export class CourseDB {
  private readonly courseDB: IDB.IDBPDatabase;

  // stores the last updated time for cache update purpose
  private readonly timeMap:UTIL.StrMap<TYPE.S_Quarter, number> = {};

  // ensures that one quarter would not be loaded twice at the same time
  private readonly queue : UTIL.StrMap<TYPE.S_Quarter, Promise<void>> = {};

  constructor (courseDB: IDB.IDBPDatabase) {
    this.courseDB = courseDB
  }

  public async syncData (q:string) {
    if (this.timeMap[q] && +new Date() / 1000 - this.timeMap[q] < 3600) return false
    const old_hash = await this.courseDB.transaction('CourseObject').objectStore('CourseObject').get(q + '-md5')
    const new_hash = (await getCourseHash())[q]
    let data = null
    for (const ctype of f_type) {
      if (old_hash && old_hash[ctype] === new_hash[ctype]) continue
      if (!data)data = {}
      data[ctype] = await (await Axios.get('/api/info/Course' + ctype + q)).data.data
    }
    this.timeMap[q] = new_hash.time
    if (!data) return false
    const tx = this.courseDB.transaction('CourseObject', 'readwrite')
    const store = tx.objectStore('CourseObject')
    store.put(new_hash, q + '-md5')
    for (const ctype of f_type) {
      store.put(data[ctype], 'Course' + ctype + q)
    }
    await tx.done
    return true
  }

  public async getQuarterData (q: TYPE.S_Quarter) {
    await this.syncData(q)
    const tx = this.courseDB.transaction('CourseObject')
    const store = tx.objectStore('CourseObject')
    const info = getCourseInfo(await store.get('CourseInfo' + q))
    const tree = getCourseTree(await store.get('CourseTree' + q))
    const sect = getCourseSections(await store.get('CourseSections' + q))
    await tx.done
    const ans : UTIL.StrMap<TYPE.S_CourseID, TYPE.CourseObject> = {}
    for (const id in info) {
      ans[id] = { quarter: q, id: id, info: info[id], tree: tree[id], sections: sect[id] }
    }
    return ans
  }
}

async function loadDB () {
  const courseDB = await IDB.openDB('GoGauchoDB', 1, {
    upgrade (db: IDB.IDBPDatabase, oldVer: number, newVer: number, trans: IDB.IDBPTransaction<unknown, string[]>) {
      db.createObjectStore('CourseObject')
    },
    blocked () { },
    blocking () { },
    terminated () { }
  })
  return new CourseDB(courseDB)
}

export const db = loadDB()
