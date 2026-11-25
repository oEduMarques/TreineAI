import { createClient } from '@supabase/supabase-js'
import catalog from '../data/exercises.json'

export { catalog }
export const exercises = Object.fromEntries(catalog.map(item => [item.id, item]))
export const muscles = {
  chest: 'Peito', lats: 'Dorsais', upper_back: 'Costas', shoulders: 'Ombros',
  biceps: 'Bíceps', quadriceps: 'Quadríceps', hamstrings: 'Posteriores', glutes: 'Glúteos',
  triceps:'Tríceps', calves:'Panturrilhas', adductors:'Adutores', abdominals:'Abdômen', cardio:'Cardio',
}
export const equipment = { barbell: 'Barra', dumbbell: 'Halteres', machine: 'Máquina', none: 'Peso corporal' }
export const setTypes = { normal:'Normal', warmup:'Aquecimento', failure:'Falha', dropset:'Drop set' }
export const uid = () => crypto.randomUUID()
export const blankSet = () => ({ reps: null, repsMax: null, weight: null, seconds: null, meters: null, done: false, type: 'normal' })
export const blankExercise = id => ({ exerciseId: id, rest: 90, notes: '', sets: [blankSet(), blankSet(), blankSet()] })
export const copy = value => JSON.parse(JSON.stringify(value))
export const fields = {
  weight_reps: [['weight', 'Carga (kg)'], ['reps', 'Repetições']],
  reps_only: [['reps', 'Repetições']],
  duration: [['seconds', 'Tempo (s)']],
  distance_duration: [['meters', 'Distância (m)'], ['seconds', 'Tempo (s)']],
}
export const fmt = n => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n)
export const dateLabel = date => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(new Date(date))
export const volume = workout => workout.exercises.reduce((total, item) =>
  total + item.sets.reduce((sum, set) => sum + (set.type !== 'warmup' ? (set.weight || 0) * (set.reps || 0) : 0), 0), 0)
export const setCount = workout => workout.exercises.reduce((sum, item) => sum + item.sets.length, 0)
export const duration = workout => Math.max(1, Math.round((Date.parse(workout.finishedAt) - Date.parse(workout.startedAt)) / 60000))
export function numberValue(value) {
  if (value === '' || value === null) return null
  const number = Number(String(value).replace(',', '.'))
  return Number.isFinite(number) && number >= 0 ? number : null
}
export function setLabel(set) {
  if (!set) return '—'
  if (Number.isFinite(set.weight) && set.reps) return fmt(set.weight) + ' kg × ' + set.reps
  if (set.reps) return set.reps + ' reps'
  if (set.meters && set.seconds) return fmt(set.meters) + ' m · ' + set.seconds + ' s'
  if (set.seconds) return set.seconds + ' s'
  return '—'
}

const sampleRoutine = (id, name, notes, items) => ({
  id, name, notes,
  exercises: items.map(([exerciseId, reps, rest]) => ({
    ...blankExercise(exerciseId), rest,
    sets: Array.from({ length: 3 }, () => ({ ...blankSet(), reps, repsMax: reps + 2 })),
  })),
})
export const demoRoutines = [
  sampleRoutine('00000000-0000-4000-8000-000000000001', 'Superiores A', 'Peito · Ombros · Bíceps',
    [['79D0BB3A', 8, 120], ['878CD1D0', 10, 90], ['422B08F1', 12, 60], ['37FCC2BB', 10, 60]]),
  sampleRoutine('00000000-0000-4000-8000-000000000002', 'Inferiores A', 'Quadríceps · Posteriores · Glúteos',
    [['C7973E0E', 10, 120], ['2B4B7310', 8, 120], ['11A123F3', 12, 90], ['D57C2EC7', 10, 90]]),
  sampleRoutine('00000000-0000-4000-8000-000000000003', 'Costas e braços', 'Dorsais · Costas · Bíceps',
    [['1B2B1E7C', 6, 90], ['0393F233', 10, 90], ['7E3BC8B6', 10, 60]]),
]
export function demoWorkouts() {
  return [0, 2, 4].map((daysAgo, index) => {
    const routine = demoRoutines[index]
    const finish = new Date()
    finish.setDate(finish.getDate() - daysAgo)
    const exercises = copy(routine.exercises)
    exercises.forEach((item, exerciseIndex) => item.sets.forEach((set, setIndex) => {
      set.done = true
      set.reps += setIndex % 2
      set.repsMax = null
      if (fields[ catalog.find(e => e.id === item.exerciseId).type ].some(([key]) => key === 'weight')) {
        set.weight = [45, 24, 12, 16][exerciseIndex]
      }
    }))
    return { ...routine, id: '00000000-0000-4000-9000-00000000000' + index,
      routineId: routine.id, exercises, finishedAt: finish.toISOString(),
      startedAt: new Date(finish.getTime() - (42 + index * 6) * 60000).toISOString() }
  })
}
export const supabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  : null

export async function api(path, token, options = {}) {
  const headers = { ...options.headers }
  if (options.body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = 'Bearer ' + token
  let result
  try {
    result = await fetch((import.meta.env.VITE_API_URL || '') + '/api' + path, { ...options, headers })
  } catch {
    throw new Error('A API está indisponível. Verifique sua conexão e tente novamente.')
  }
  const data = await result.json().catch(() => ({}))
  if (!result.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Verifique os dados e tente novamente.')
  return data
}
