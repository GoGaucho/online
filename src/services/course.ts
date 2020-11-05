/* eslint-disable no-return-assign */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */

import * as UTIL from './course/utils'
import * as TYPE from './course/api'
import * as DB from './course/db'

const map : UTIL.StrMap<TYPE.S_Quarter, UTIL.CourseCache> = {}

export async function getCache (q:string) {
  if (map[q]) return map[q]
  return map[q] = new UTIL.CourseCache(q, await DB.db)
}

export const loader = {
  get: async (q:string, id:string) => await (await getCache(q)).get(id),
  bulk: async (q:string, id:string[]) => await (await getCache(q)).bulk(id),
  search: async (q:string, query:string) => await (await getCache(q)).search(query),
  queryGE: async (q:string, ge:string) => await (await getCache(q)).queryGE(ge)
}

const gogaucho = {
  db: DB.db,
  loader: {
    loader: loader,
    getCache: getCache
  },
  processor: require('./course/processor'),
  helper: require('./course/helper'),
  dependencies: {
    axios: require('axios'),
    idb: require('idb')
  }
}
// eslint-disable-next-line no-eval
eval('window.gogaucho = gogaucho')
