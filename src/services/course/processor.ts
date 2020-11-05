/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
import * as TYPE from './api'
import * as UTIL from './utils'

type N_Session = number;
type N_AbsTime = number;
type N_DisTime = number;

export type InputParam = {
  quarter: TYPE.S_Quarter,
  selected: TYPE.S_CourseID[],
  events: { name: string, duration: number, days: TYPE.S_Date[], timerange: TYPE.S_Time[] }[],
  limit: { break: number, timerange: TYPE.S_Time[] },
  checkedEnrollCode: TYPE.S_EnrollCode[]
};

type Event = { title: string, duration: number, periods: N_DisTime[][] };
type InputData = { events: Event[], break: number, begin: number, end: number };

export type SectionPeriod = {
  readonly t0: N_AbsTime,
  readonly t1: N_AbsTime,
  readonly code: TYPE.S_EnrollCode,
  readonly loc: string
}

/** all time periods required by a selectable section
 * @param code the leaf EnrollCode of this option
 * @param periods the periods belongs to this option, contains lecture periods and section periods.
 * @param data the periods belongs to this option, in discrete time format, used only in Processor.
 */
export type OptionPeriod = {
  readonly code: TYPE.S_EnrollCode,
  readonly periods: SectionPeriod[],
  data: N_DisTime[][]
}

class Converter {
  protected readonly timeset: N_AbsTime[];

  constructor (set: N_AbsTime[]) {
    this.timeset = set
  }

  /** convert session string to number */
  protected getSession (ses: TYPE.S_Session): N_Session[] {
    if (!ses) return [0]
    if (ses === 'A') return [0, 1]
    if (ses === 'B') return [2, 3]
    if (ses === 'C') return [0, 1, 2, 3]
    if (ses === 'D') return [0]
    if (ses === 'E') return [1]
    if (ses === 'F') return [2]
    if (ses === 'G') return [3]
    return [0]
  }

  /** convert string time format to absolute number time format and fill timeset */
  protected daytime2num (day: TYPE.S_Date, timeString: TYPE.S_Time, ses?: N_Session): N_AbsTime {
    let dayNum = 0
    if (day === 'T') dayNum = 1
    if (day === 'W') dayNum = 2
    if (day === 'R') dayNum = 3
    if (day === 'F') dayNum = 4
    const h = +timeString.substr(0, 2)
    const m = +timeString.substr(3, 2)
    var ans = (dayNum * 24 + h) * 60 + m
    if (ses) ans += 5 * 24 * 60 * ses
    if (!this.timeset.includes(ans)) this.timeset.push(ans)
    return ans
  }
}

/** Parsed data of a course
 * @param checked a list of periods that represents the selectable leaves of the course tree.
 */
export class CourseDetail extends Converter {
  readonly data: TYPE.CourseData;

  checked: OptionPeriod[] = [];

  constructor (set: N_AbsTime[], data: TYPE.CourseData, checked: TYPE.S_EnrollCode[]) {
    super(set)
    this.data = data

    const check = (code: TYPE.S_EnrollCode) => !checked || checked.includes(code)

    const add = (ses: TYPE.S_Session, lec: TYPE.S_EnrollCode, sec?: TYPE.S_EnrollCode) => {
      if (check(lec) && (!sec || check(sec))) { this.add(ses, lec, sec) }
    }

    for (const session of data.info.tree) {
      for (const lecture of session.lectures) {
        const lec = lecture.lecture
        if (check(lec)) {
          if (lecture.sections.length) {
            lecture.sections.forEach(e => add(session.session, lec, e))
          } else add(session.session, lec)
        }
      }
    }
  }

  private add (ses: TYPE.S_Session, lec: TYPE.S_EnrollCode, sec?: TYPE.S_EnrollCode) {
    const session = this.getSession(ses)

    const convert = (code: TYPE.S_EnrollCode, period: TYPE.PeriodInfo, session: N_Session) =>
      [...period.days].map(c => ({
        t0: this.daytime2num(c, period.begin, session),
        t1: this.daytime2num(c, period.end, session),
        code: code,
        loc: period.location
      }))

    const ans: SectionPeriod[] = []

    for (const period of this.data.sectionInfo[lec].periods) {
      session.forEach(nses => ans.push(...convert(lec, period, nses)))
    }

    if (sec) {
      for (const period of this.data.sectionInfo[sec].periods) {
        session.forEach(nses => ans.push(...convert(sec, period, nses)))
      }
    }

    this.checked.push({ code: sec || lec, periods: ans, data: null })
  }
}

class CoursePool extends Converter {
  private readonly loader: UTIL.CourseCache;

  selected: TYPE.S_CourseID[];
  code2id: UTIL.StrMap<TYPE.S_EnrollCode, TYPE.S_CourseID> = {};
  data: UTIL.StrMap<TYPE.S_CourseID, CourseDetail> = {};

  protected constructor (set: N_AbsTime[], loader: UTIL.CourseCache) {
    super(set)
    this.loader = loader
  }

  protected async initialize (sele: TYPE.S_CourseID[], checked?: TYPE.S_EnrollCode[]) {
    this.selected = sele
    const data = await this.loader.bulk(sele)
    for (const c of data) {
      this.data[c.info.id] = new CourseDetail(this.timeset, c, checked)
      for (const code in c.sectionInfo) { this.code2id[code] = c.info.id }
    }
  }
}

class CourseEncoder {
  readonly selected: TYPE.S_CourseID[];
  readonly detail: UTIL.StrMap<TYPE.S_CourseID, CourseDetail> = {};
  factor: number[] = [];

  constructor (detl: Processor) {
    this.selected = detl.selected
    this.detail = detl.data
    let v = 1
    for (let i = 0; i < this.selected.length; i++) {
      this.factor.push(v)
      v *= this.get(i).length
    }
  }

  public get (ind: number) {
    return this.detail[this.selected[ind]].checked
  }

  public mapArray<V> (func: (t: OptionPeriod) => V) {
    const map: Array<Array<V>> = new Array<Array<V>>(this.selected.length)
    for (let i = 0; i < this.selected.length; i++) {
      const secs = this.get(i)
      map[i] = new Array<V>(secs.length)
      for (let j = 0; j < secs.length; j++) { map[i][j] = func(secs[j]) }
    }
    return map
  }

  public reduce<T, V> (num: number, map: V[][], def: T, func: (t: T, v: V) => T) {
    const val = def
    for (let i = 0; i < this.selected.length; i++) {
      const arr = this.get(i)
      def = func(def, map[i][num % arr.length])
      num /= arr.length
    }
    return def
  }

  public decode (num: number) {
    const ans: OptionPeriod[] = []
    for (let i = 0; i < this.selected.length; i++) {
      const arr = this.get(i)
      ans.push(arr[num % arr.length])
      num /= arr.length
    }
    return ans
  }
}

class Processor extends CoursePool {
  private readonly maxSolution: number = 9999;

  private input: InputData;
  private timegrid: Uint16Array = null;
  private chosen: number = 0;

  encoder: CourseEncoder;
  results: number[] = [];

  constructor (loader: UTIL.CourseCache) {
    super([0, 7200, 14400, 21600, 28800], loader)
  }

  public async init (input: InputParam) {
    await this.initialize(input.selected, input.checkedEnrollCode)
    this.encoder = new CourseEncoder(this)

    this.input = {
      events: [],
      break: input.limit.break,
      begin: this.daytime2num('', input.limit.timerange[0]),
      end: this.daytime2num('', input.limit.timerange[1])
    }

    const summer = input.quarter.charAt(4) === '3'
    this.input.events = input.events.map(e => ({
      title: e.name,
      duration: e.duration,
      periods:
        (summer ? [0, 1, 2, 3] : [0])
          .map(v => e.days.map(d => [...d].map(c => e.timerange.map(r => this.daytime2num(c, r, v)))))
          .flat(2)
    }))

    this.timeset.sort((a, b) => a - b)
    this.timegrid = new Uint16Array((this.timeset.length >> 4) + 1)

    // replace absolute time representation with time index
    for (const id of this.selected) {
      for (const option of this.data[id].checked) {
        option.data = option.periods.map(e => [this.timeset.indexOf(e.t0), this.timeset.indexOf(e.t1)])
      }
    }

    for (const event of this.input.events) {
      for (const period of event.periods) {
        for (const i in period) { period[i] = this.timeset.indexOf(period[i]) }
      }
    }
  }

  /** only used in dfs calling tree, get if the given time slot is occupied */
  private getTime (a: N_DisTime): number {
    return this.timegrid[a >> 4] & (1 << (a & 0xf))
  }

  /** inly used in dfs calling tree, get if the given periods is occupied */
  private getTimeAnd (ps: N_DisTime[][]): boolean {
    for (const p of ps) { for (var i = p[0]; i < p[1]; i++) if (this.getTime(i)) return true }
    return false
  }

  /** only used in dfs calling tree, fill the timegrid for given periods */
  private fillTimeBlock (ps: N_DisTime[][], v: boolean) {
    for (const p of ps) {
      for (let i = p[0]; i < p[1]; i++) {
        if (v) this.timegrid[i >> 4] |= 1 << (i & 0xf)
        else this.timegrid[i >> 4] &= 0xffff - (1 << (i & 0xf))
      }
    }
  }

  dfs (index: number) {
    if (this.results.length > this.maxSolution) return // prevent over calculate
    if (index >= this.selected.length) {
      // success for one solution
      this.results.push(this.chosen)
      return
    }
    const courses = this.data[this.selected[index]].checked

    for (let i = 0; i < courses.length; i++) {
      const choice = courses[i]
      // check time conflict
      if (this.getTimeAnd(choice.data)) continue
      // check limit conflict
      if (!this.checkLimit(choice.data)) continue
      // fill time grid
      this.fillTimeBlock(choice.data, true)
      // check event conflict
      if (!this.checkEvents(choice.data)) {
        this.fillTimeBlock(choice.data, false)
        continue
      }
      // continue recursion
      this.chosen += this.encoder.factor[index] * i
      this.dfs(index + 1)
      this.fillTimeBlock(choice.data, false)
      this.chosen -= this.encoder.factor[index] * i
    }
  }

  /** only used in dfs calling tree, check if the current timegrid violates event requirements */
  private checkEvents (coursePeriods: N_DisTime[][]) {
    for (const period of coursePeriods) {
      for (const event of this.input.events) {
        for (const p of event.periods) {
          let space = 0
          if (period[0] >= p[1] || period[1] <= p[0]) continue
          for (let i = p[0]; i < p[1]; i++) {
            if ((period[0] > i || period[1] <= i) && !this.getTime(i)) {
              space += this.timeset[i + 1] - this.timeset[i]
              if (space >= event.duration) break
            } else space = 0
          }
          if (space < event.duration) return false
        }
      }
    }
    return true
  }

  /** only used in dfs calling tree, check if the given course violates course time limit requirements */
  private checkLimit (coursePeriods: N_DisTime[][]) {
    for (const period of coursePeriods) {
      const p0 = this.timeset[period[0]] % 1440
      const p1 = this.timeset[period[1]] % 1440
      if (p0 < this.input.begin || p1 > this.input.end) return false
      let space = 0
      let i = 0
      while (space < this.input.break) {
        i++
        if (this.getTime(period[0] - i)) return false
        space += this.timeset[period[0] - i + 1] - this.timeset[period[0] - i]
      }
      space = 0
      i = 0
      while (space < this.input.break) {
        if (this.getTime(period[1] + i)) return false
        space += this.timeset[period[1] + i + 1] - this.timeset[period[1] + i]
        i++
      }
    }
    return true
  }
}

/** The result of a course schedule search, contains a groupable result */
export class Result {
  readonly encoder: CourseEncoder;
  readonly resultList: number[];
  readonly code2id: UTIL.StrMap<TYPE.S_EnrollCode, TYPE.S_CourseID>;

  groupID: number = -1;
  private groupedList: number[][] = null;

  constructor (proc: Processor) {
    this.encoder = proc.encoder
    this.resultList = proc.results
    this.code2id = proc.code2id
  }

  /** groups the results by a particular course
   * @param index the current display index
   * @param id the course id used for grouping, null for de-group
   * @returns the new index that corresponds to the old one, or 0 if de-grouped
   */
  group (index: number, id: TYPE.S_CourseID) {
    const ind = this.encoder.selected.indexOf(id)
    this.groupID = ind
    if (ind < 0) {
      this.groupedList = null
      return 0
    }
    const map = new Map<number, number>()
    let tar = 0
    for (let i = 0; i < this.resultList.length; i++) {
      const sol = this.resultList[i]
      const nsec = Math.floor(sol / this.encoder.factor[ind]) % this.encoder.get(ind).length
      const nsol = sol - nsec * this.encoder.factor[ind]
      let val = map.get(nsol)
      if (!val) val = 0
      val |= 1 << nsec
      map.set(nsol, val)
      if (i === index) { tar = nsol }
    }
    this.groupedList = []
    let ans = 0
    map.forEach((v, k) => {
      if (k === tar) { ans = this.groupedList.length }
      this.groupedList.push([k, v])
    })
    return ans
  }

  /** get the length of solutions of the current grouping mode */
  getLength () {
    return this.groupID < 0 ? this.resultList.length : this.groupedList.length
  }

  /** get the group mode */
  getGroup () {
    return this.groupID < 0 ? '' : this.encoder.selected[this.groupID]
  }

  /** get a list of OptionPeriod for a solution
   * @param index the index of the solution
   */
  getList (index: number) {
    if (this.groupID < 0) { return this.encoder.decode(this.resultList[index]) }
    const ans = this.encoder.decode(this.groupedList[index][0])
    ans.splice(this.groupID, 1)
    for (let i = 0; i < this.encoder.get(this.groupID).length; i++) {
      if ((this.groupedList[index][1] & 1 << i) > 0) {
        ans.push(this.encoder.get(this.groupID)[i])
      }
    }
    return ans
  }
}

export async function process (loader: UTIL.CourseCache, input: InputParam) {
  const processor = new Processor(loader)
  await processor.init(input)
  processor.dfs(0)
  return new Result(processor)
}

export type Display = (id: TYPE.S_CourseID, codes: TYPE.S_EnrollCode[]) => void;

export class ConflictCheck {
  private readonly loader: UTIL.CourseCache;
  private readonly courseStore: UTIL.StrMap<TYPE.S_CourseID, CourseDetail> = {};
  private readonly result: Result;
  private readonly display: Display;

  /**
   * @param loader the central course cache for this quarter
   * @param result the Result object to filter
   * @param display the callback function for course display, called in loadCourse
   */
  constructor (loader: UTIL.CourseCache, result: Result, display: Display) {
    this.loader = loader
    this.result = result
    this.display = display
  }

  /**
   * @param ids the course id list to filter, calls display when available courses are found
   */
  public async loadCourse (ids: TYPE.S_CourseID[]) {
    const list = await this.loader.bulk(ids)
    for (const c of list) {
      const detail = this.courseStore[c.info.id] = new CourseDetail([], c, null)
      const map = this.result.encoder.mapArray((option: OptionPeriod) => {
        let val = 0
        for (let i = 0; i < detail.checked.length; i++) {
          if (!this.conflict(detail.checked[i], option)) val |= 1 << i
        }
        return val
      })
      const max = (1 << detail.checked.length) - 1
      let val = max
      for (const sol of this.result.resultList) {
        val |= this.result.encoder.reduce(sol, map, max, (t, v) => t | v)
      }
      const list: TYPE.S_EnrollCode[] = []
      for (let i = 0; i < detail.checked.length; i++) {
        if ((val & 1 << i) > 0) {
          list.push(detail.checked[i].code)
        }
      }
      this.display(c.info.id, list)
    }
  }

  private conflict (test: OptionPeriod, base: OptionPeriod) {
    for (const p0 of test.periods) {
      for (const p1 of base.periods) {
        if (p0.t1 > p1.t0 && p1.t1 > p0.t0) { return true }
      }
    }
    return false
  }
}
