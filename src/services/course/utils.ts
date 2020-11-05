/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
import * as TYPE from './api'
import * as DB from './db'
import { CourseDisplay } from '@/store/modules/course'

export type StrMap<K extends string, V> = { [key: string]: V; };

export const ResultOptions = ['id', 'title', 'desc']
export type SearchResult = {id:CourseDisplay[], title:CourseDisplay[], desc:CourseDisplay[]}

type CacheData = {
  data: StrMap<TYPE.S_CourseID, TYPE.CourseObject>,
  list: TYPE.S_CourseID[],
  ge: StrMap<string, TYPE.S_CourseID[]>
}

export class CourseCache {
  private readonly quarter: TYPE.S_Quarter;
  private readonly db: DB.CourseDB;

  private data: CacheData;

  private readonly geCache: {[ge:string]:CourseDisplay[]} = {}

  constructor (quarter: TYPE.S_Quarter, db: DB.CourseDB) {
    this.quarter = quarter
    this.db = db
  }

  private async load () {
    if (this.data && !await this.db.syncData(this.quarter)) return this.data
    const data = await this.db.getQuarterData(this.quarter)
    const list = []
    const ge : StrMap<string, TYPE.S_CourseID[]> = {}
    for (const id in data) {
      list.push(id)
      data[id].info.GE.forEach(e => (ge[e] = ge[e] || []).push(id))
    }
    this.data = { data: data, list: list, ge: ge }
    return this.data
  }

  public async search (query:string) : Promise<SearchResult> {
    const data = await this.load()
    const info = (e:TYPE.S_CourseID) => data.data[e].info
    const by = (f:(id:string)=>string) => data.list.filter(e => f(e).match(query)).map(e => ({ id: e, title: info(e).title }))
    return { id: by(e => e), title: by(e => info(e).title), desc: by(e => info(e).description) }
  }

  public async queryGE (ge:string) : Promise<CourseDisplay[]> {
    const data = await this.load()
    ge = ge.replace(/ /g, '')
    return data.ge[ge].map(id => ({ id: id, title: data.data[id].info.title }))
  }

  public async get (id:TYPE.S_CourseID):Promise<TYPE.CourseData> {
    return new TYPE.CourseData((await this.load()).data[id])
  }

  public async bulk (ids:TYPE.S_CourseID[]):Promise<TYPE.CourseData[]> {
    const data = (await this.load()).data
    return ids.map(e => new TYPE.CourseData(data[e]))
  }
}
