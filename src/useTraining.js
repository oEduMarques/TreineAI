import { computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { api, blankExercise, blankSet, catalog, copy, demoRoutines, demoWorkouts, duration, exercises, fields, setLabel, supabase, uid, volume } from './training'

const local = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem('treine-' + key)) ?? fallback } catch { return fallback }
}
const saveLocal = (key, value) => localStorage.setItem('treine-' + key, JSON.stringify(value))
const pages = ['inicio','treinar','historico','exercicios','progresso','ia','rotina','sessao']
const currentPage = () => pages.includes(location.hash.slice(2)) ? location.hash.slice(2) : 'inicio'
export const clock = seconds => Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')

export function useTraining() {
  const state = reactive({
    page: currentPage(), session: null, busy: false, loading: Boolean(supabase), error: '', notice: '',
    routines: local('routines', copy(demoRoutines)), workouts: local('workouts', demoWorkouts()),
    active: local('active-demo', null), plans: local('plans', []), editor: null,
    video: null, picker: false, selected: null, review: false, login: false, loginMessage: '', email: '', password: '',
    now: Date.now(), limit: 20, exerciseId: catalog[0].id, progressPeriod: '90', progressMetric: 'best',
    planKind: 'training', goal: '', days: 3,
    plan: null, status: { aiConfigured: false }, videoFailed: false,
  })
  const key = () => 'active-' + (state.session?.user.id || 'demo')
  const go = page => { state.page = page; location.hash = '/' + page; window.scrollTo(0, 0) }
  const hash = () => { state.page = currentPage() }
  const close = event => {
    if (event.key !== 'Escape') return
    if (state.video) state.video = null
    else if (state.picker) state.picker = false
    else if (state.review && !state.busy) state.review = false
    else if (state.selected) state.selected = null
    else state.login = false
  }
  const writeLocal = (field, value) => {
    try { saveLocal(field, value) } catch { state.error = 'O armazenamento deste dispositivo está indisponível.' }
  }
  watch(() => state.active, value => writeLocal(key(),value), { deep: true, flush: 'sync' })
  watch(() => state.page, () => { state.error = ''; state.notice = ''; state.review = false })
  watch(() => state.video, () => { state.videoFailed = false })

  let version = 0
  let subscription
  let ticker
  async function records(kind, token) {
    const all = []
    let cursor
    do {
      const response = await api('/records/' + kind + (cursor ? '?cursor=' + cursor : ''),token)
      all.push(...response.items)
      cursor = response.nextCursor
    } while (cursor)
    return all
  }
  async function loadSession(session) {
    if (session && state.session?.user.id === session.user.id && !state.loading) {
      state.session = session
      return
    }
    const id = ++version
    state.session = session
    state.active = local(key(), null)
    state.selected = null; state.editor = null; state.plan = null; state.review = false
    if (!session) {
      state.routines = local('routines', copy(demoRoutines))
      state.workouts = local('workouts', demoWorkouts())
      state.plans = local('plans', [])
      state.loading = false
      return
    }
    state.routines = []; state.workouts = []; state.plans = []
    state.loading = true
    try {
      const [routines, workouts, plans] = await Promise.all(['routine','workout','plan'].map(kind => records(kind,session.access_token)))
      if (id === version) Object.assign(state,{ routines, workouts, plans })
    } catch (error) {
      if (id === version) state.error = error.message
    } finally {
      if (id === version) state.loading = false
    }
  }
  onMounted(() => {
    window.addEventListener('hashchange',hash)
    window.addEventListener('keydown',close)
    ticker = setInterval(() => { state.now = Date.now() },300)
    api('/status').then(status => { state.status = status }).catch(() => {})
    if (supabase) subscription = supabase.auth.onAuthStateChange((_event,session) => { void loadSession(session) }).data.subscription
  })
  onUnmounted(() => {
    clearInterval(ticker); subscription?.unsubscribe()
    window.removeEventListener('hashchange',hash)
    window.removeEventListener('keydown',close)
  })
  async function action(callback) {
    if (state.busy) return
    state.busy = true; state.error = ''; state.notice = ''
    try { await callback() } catch (error) { state.error = error.message }
    finally { state.busy = false }
  }
  const signIn = register => action(async () => {
    state.loginMessage = ''
    if (!supabase) return
    try {
      const credentials = { email: state.email.trim(), password: state.password }
      const result = await (register ? supabase.auth.signUp(credentials) : supabase.auth.signInWithPassword(credentials))
      if (result.error) throw result.error
      if (result.data.session) state.login = false
      else state.loginMessage = 'Confirme seu cadastro pelo e-mail.'
    } catch (error) { state.loginMessage = error.message }
    finally { state.password = '' }
  })
  const signOut = () => action(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    go('inicio')
  })
  const ordered = computed(() => [...state.workouts].sort((a,b) => b.finishedAt.localeCompare(a.finishedAt)))
  const weekStart = computed(() => {
    const d = new Date(state.now)
    d.setDate(d.getDate() - (d.getDay()+6)%7); d.setHours(0,0,0,0)
    return d
  })
  const weekWorkouts = computed(() => ordered.value.filter(w => new Date(w.finishedAt) >= weekStart.value))
  const week = computed(() => ['S','T','Q','Q','S','S','D'].map((label,index) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + index)
    const day = d.toDateString()
    return { label, date:d.getDate(), today: day === new Date(state.now).toDateString(),
      trained: weekWorkouts.value.some(w => new Date(w.finishedAt).toDateString() === day) }
  }))
  const weekly = computed(() => ({ count: weekWorkouts.value.length,
    volume: weekWorkouts.value.reduce((n,w) => n + volume(w),0),
    minutes: weekWorkouts.value.reduce((n,w) => n + duration(w),0) }))
  const rest = computed(() => Math.max(0, Math.ceil(((state.active?.timer?.until || 0) - state.now)/1000)))
  const elapsed = computed(() => state.active ? Math.max(0,Math.floor((state.now - Date.parse(state.active.startedAt))/1000)) : 0)
  const doneCount = computed(() => state.active?.exercises.reduce((sum,item) => sum + item.sets.filter(s => s.done).length,0) || 0)
  const totalSets = computed(() => state.active?.exercises.reduce((sum,item) => sum + item.sets.length,0) || 0)
  const nextSet = computed(() => {
    const i = state.active?.exercises.findIndex(item => item.sets.some(set => !set.done)) ?? -1
    return i < 0 ? '' : i + ':' + state.active.exercises[i].sets.findIndex(set => !set.done)
  })
  const recordedVolume = computed(() => state.active ? volume({
    exercises: state.active.exercises.map(item => ({ sets:item.sets.filter(set => set.done) })),
  }) : 0)
  const field = computed(() => fields[exercises[state.exerciseId].type][0][0])
  const volumeMetric = computed(() => field.value === 'weight' && state.progressMetric === 'volume')
  const progress = computed(() => ordered.value.flatMap(workout => {
    const days = Number(state.progressPeriod)
    if (days && Date.parse(workout.finishedAt) < Date.now() - days * 86400000) return []
    const sets = workout.exercises.filter(e => e.exerciseId === state.exerciseId)
      .flatMap(e => e.sets.filter(s => s.type !== 'warmup'))
    const values = sets.map(s => volumeMetric.value ? s.weight * s.reps : s[field.value]).filter(Number.isFinite)
    const value = volumeMetric.value ? values.reduce((sum,n) => sum + n,0) : Math.max(...values)
    return values.length ? [{ id:workout.id, date:workout.finishedAt, value }] : []
  }))
  const best = computed(() => progress.value.reduce((max,item) => Math.max(max,item.value),0))
  const unit = computed(() => ({ weight:'kg',reps:'reps',seconds:'s',meters:'m' })[field.value])
  function edit(source = null) {
    state.editor = source ? copy(source) : { id:uid(),name:'',notes:'',exercises:[] }
    go('rotina')
  }
  function addExercises(ids) {
    const target = state.page === 'rotina' ? state.editor : state.active
    if (!target) return
    const additions = [...new Set(ids)].filter(id => Object.hasOwn(exercises,id))
    if (target.exercises.length + additions.length > 100) {
      state.error = 'Este treino comporta até 100 exercícios.'
      state.picker = false
      return
    }
    target.exercises.push(...additions.map(blankExercise))
    state.picker = false
  }
  async function persist(kind, data, field) {
    const token = state.session?.access_token
    const owner = state.session?.user.id
    const record = token ? await api('/records/' + kind + '/' + data.id,token,
      { method:'PUT', body:JSON.stringify(data) }) : copy(data)
    if (state.session?.user.id !== owner) throw new Error('A conta mudou durante a operação.')
    const next = [record,...state[field].filter(item => item.id !== record.id)]
    if (!token) saveLocal(field,next)
    state[field] = next
  }
  const saveRoutine = () => action(async () => {
    const routine = state.editor
    if (!routine.name.trim() || !routine.exercises.length) throw new Error('Dê um nome à rotina e adicione um exercício.')
    if (routine.exercises.some(e => e.sets.some(s => s.repsMax !== null && (!s.reps || s.repsMax < s.reps)))) throw new Error('Revise a faixa de repetições.')
    await persist('routine',routine,'routines')
    go('treinar')
  })
  function begin(source = null, repeat = false) {
    state.selected = null
    if (!state.active) {
      state.active = { id:uid(), name:source?.name || 'Treino livre', notes:source?.notes || '',
        routineId:source ? repeat ? source.routineId : source.id : null, startedAt:new Date().toISOString(), timer:null,
        exercises:source ? copy(source.exercises).map(item => ({ ...item, sets:item.sets.map(set => ({
          ...set, done:false, target:repeat ? '' : set.repsMax ? set.reps + '–' + set.repsMax + ' reps' : setLabel(set),
          reps:set.repsMax ? null : set.reps, repsMax:null,
        })) })) : [] }
      state.now = Date.now()
    }
    go('sessao')
  }
  function previous(item,index) {
    const past = ordered.value.find(w => w.exercises.some(e => e.exerciseId === item.exerciseId))
    const previous = past?.exercises.find(e => e.exerciseId === item.exerciseId)
    const kind = item.sets[index].type
    const position = item.sets.slice(0,index).filter(set => set.type === kind).length
    return previous?.sets.filter(set => set.type === kind)[position]
  }
  function copyPrevious(item,index) {
    const source = previous(item,index)
    const set = item.sets[index]
    if (!source || set.done) return
    for (const [field] of fields[exercises[item.exerciseId].type]) set[field] = source[field]
  }
  function mark(item,set,i,j) {
    state.error = ''
    const source = i + ':' + j
    if (set.done) {
      set.done = false
      if (state.active.timer?.source === source) state.active.timer = null
      return
    }
    if (fields[exercises[item.exerciseId].type].some(([name]) => !Number.isFinite(set[name]) ||
      (name !== 'weight' && set[name] <= 0) || (['reps','seconds'].includes(name) && !Number.isInteger(set[name])))) {
      state.error = 'Preencha os valores da série antes de marcar.'
      return
    }
    set.done = true
    if (item.rest > 0) state.active.timer = { until: Date.now() + item.rest*1000, source }
    state.now = Date.now()
  }
  function remove(target,items,index) {
    items.splice(index,1)
    if (target.timer) target.timer = null
  }
  function moveExercise(target,index,shift) {
    const next = index + shift
    if (next < 0 || next >= target.exercises.length) return
    const timer = target.timer
    if (timer) {
      const [exercise,set] = timer.source.split(':').map(Number)
      if (exercise === index || exercise === next) timer.source = (exercise === index ? next : index) + ':' + set
    }
    const items = [...target.exercises]
    const moved = items[index]
    items[index] = items[next]
    items[next] = moved
    target.exercises = items
  }
  function reviewWorkout() {
    if (!doneCount.value) { state.error = 'Conclua pelo menos uma série para salvar.'; return }
    state.error = ''
    state.review = true
  }
  const finish = () => action(async () => {
    if (!doneCount.value) throw new Error('Conclua pelo menos uma série para salvar.')
    const { timer, ...item } = copy(state.active)
    item.name = item.name.trim() || 'Treino livre'
    item.finishedAt = new Date().toISOString()
    item.exercises = item.exercises.map(e => ({...e,sets:e.sets.filter(s => s.done)})).filter(e => e.sets.length)
    await persist('workout',item,'workouts')
    state.active = null
    go('historico')
  })
  function discard() {
    if (confirm('Descartar o treino em andamento?')) { state.active = null; go('treinar') }
  }
  const planRequest = () => ({ kind:state.planKind,goal:state.goal.trim(),days_per_week:state.days })
  const generate = () => action(async () => {
    const token = state.session?.access_token
    const userId = state.session?.user.id
    const plan = await api('/ai/plans',token,{ method:'POST',body:JSON.stringify(planRequest()) })
    if (state.session?.user.id === userId) state.plan = plan
  })
  const makeBrief = receive => action(async () => {
    const spec = planRequest()
    if (spec.goal.length < 10) throw new Error('Descreva seu objetivo em pelo menos 10 caracteres.')
    const userId = state.session?.user.id
    const body = JSON.stringify(spec)
    const result = await api('/ai/brief',state.session?.access_token,{ method:'POST',body })
    if (state.session?.user.id === userId && JSON.stringify(planRequest()) === body) receive(result.prompt)
  })
  const reviewPlan = (text, receive) => action(async () => {
    const token = state.session?.access_token
    const userId = state.session?.user.id
    const plan = await api('/ai/review',token,{
      method:'POST',body:JSON.stringify({ kind:state.planKind,text }),
    })
    if (state.session?.user.id === userId) { state.plan = plan; receive() }
  })
  const savePlan = () => action(async () => {
    await persist('plan',{...state.plan,id:uid()},'plans')
    state.plan = null
    state.notice = 'Plano salvo.'
  })
  function useDay(day) {
    edit({ id:uid(),name:day.title,notes:'',exercises:day.exercises.map(item => ({
      ...blankExercise(item.exercise_id),rest:item.rest_seconds,
      sets:Array.from({ length:item.sets },() => ({ ...blankSet(),reps:item.reps })),
    })) })
  }
  return { state,go,signIn,signOut,ordered,week,weekly,rest,elapsed,doneCount,totalSets,nextSet,recordedVolume,progress,best,unit,volumeMetric,
    edit,addExercises,saveRoutine,begin,previous,copyPrevious,mark,remove,moveExercise,reviewWorkout,finish,discard,
    generate,makeBrief,reviewPlan,savePlan,useDay }
}
