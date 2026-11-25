<script setup>
import { computed } from 'vue'
import { ArrowDown, ArrowUp, Check, CirclePlay, Clipboard, Clock3, Dumbbell, Plus, Timer, Trash2, X } from 'lucide-vue-next'
import { blankSet, equipment, exercises, fields, fmt, muscles, numberValue, setLabel, setTypes } from './training'
import { clock } from './useTraining'

const {
  state:s, go, elapsed, doneCount, totalSets, nextSet, recordedVolume, rest, saveRoutine,
  reviewWorkout, finish, previous, copyPrevious, remove, moveExercise, mark, discard,
} = defineProps({ training:{ type:Object,required:true } }).training
const editing = computed(() => s.page === 'rotina')
const target = computed(() => editing.value ? s.editor : s.active)

function addSet(item) {
  const last = item.sets.at(-1)
  item.sets.push(last ? { ...last, type: 'normal', target: '', done: false } : blankSet())
}
</script>

<template>
  <template v-if="target">
    <div class="intro"><div><h1>{{ editing ? 'Editor de rotina' : 'Treino em andamento' }}</h1></div><button class="button dark" :disabled="s.busy" @click="editing ? saveRoutine() : reviewWorkout()">{{ editing ? 'Salvar rotina' : 'Concluir treino' }}</button></div>
    <div v-if="!editing" class="session-metrics card" aria-label="Resumo do treino">
      <div><Clock3 :size="17" /><span>Tempo</span><strong>{{ clock(elapsed) }}</strong></div>
      <div><Check :size="17" /><span>Séries</span><strong>{{ doneCount }}/{{ totalSets }}</strong></div>
      <div><Dumbbell :size="17" /><span>Volume</span><strong>{{ fmt(recordedVolume) }} kg</strong></div>
    </div>
    <div class="card panel form-fields">
      <label>Nome<input v-model="target.name" maxlength="180" placeholder="Ex.: Superiores A" /></label>
      <details class="workout-notes" :open="editing || Boolean(target.notes)"><summary>Notas {{ editing ? 'da rotina' : 'do treino' }}</summary><textarea v-model="target.notes" aria-label="Notas gerais" rows="2" maxlength="3000" placeholder="Opcional" /></details>
    </div>
    <section v-for="(item,i) in target.exercises" :key="i" class="card panel workout-exercise" :class="{'exercise-complete': !editing && item.sets.every(set => set.done)}">
      <div class="section-head exercise-heading">
        <div class="inline"><span class="item-icon"><Dumbbell :size="19" /></span><div><h2>{{ exercises[item.exerciseId].name }}</h2><small class="muted">{{ muscles[exercises[item.exerciseId].muscle] }} · {{ equipment[exercises[item.exerciseId].equipment] }}</small></div></div>
        <button class="icon-button" :aria-label="'Ver vídeo de ' + exercises[item.exerciseId].name" @click="s.video = exercises[item.exerciseId]"><CirclePlay :size="22" /></button>
      </div>
      <details class="workout-notes exercise-options"><summary>Descanso e opções</summary>
        <div class="exercise-options-row">
          <label class="rest-setting"><Timer :size="16" /> Descanso <input v-model.number="item.rest" type="number" min="0" max="3600" aria-label="Descanso em segundos" /> s</label>
          <div class="inline">
            <button class="icon-button" aria-label="Mover exercício para cima" :disabled="i === 0" @click="moveExercise(target,i,-1)"><ArrowUp :size="18" /></button>
            <button class="icon-button" aria-label="Mover exercício para baixo" :disabled="i === target.exercises.length - 1" @click="moveExercise(target,i,1)"><ArrowDown :size="18" /></button>
            <button class="icon-button" aria-label="Remover exercício" @click="remove(target,target.exercises,i)"><Trash2 :size="18" /></button>
          </div>
        </div>
        <label class="exercise-notes-input">Notas do exercício<textarea v-model="item.notes" maxlength="1200" rows="2" placeholder="Opcional" /></label>
      </details>
      <div v-for="(set,j) in item.sets" :key="j" class="set-row" :class="{done:set.done,'next-set':!editing && nextSet === i + ':' + j}">
        <div class="set-number">
          <label class="set-type"><span>Série {{ j + 1 }}</span><select v-model="set.type" :aria-label="'Tipo da série ' + (j + 1)" :disabled="set.done"><option v-for="(name,type) in setTypes" :key="type" :value="type">{{ name }}</option></select></label>
          <template v-if="!editing">
            <button v-if="previous(item,j) && !set.done" type="button" class="previous-button" :aria-label="'Usar resultado anterior: ' + setLabel(previous(item,j))" @click="copyPrevious(item,j)"><Clipboard :size="13" /> {{ setLabel(previous(item,j)) }}</button>
            <small v-else>Anterior {{ setLabel(previous(item,j)) }}</small>
            <small v-if="set.target && set.target !== '—'">Meta {{ set.target }}</small>
          </template>
        </div>
        <div class="set-inputs">
          <label v-for="[field,label] in fields[exercises[item.exerciseId].type]" :key="field">{{ label }}<input :value="set[field] ?? ''" :inputmode="['reps','seconds'].includes(field) ? 'numeric' : 'decimal'" :disabled="set.done" @change="set[field] = numberValue($event.target.value)" /></label>
          <label v-if="editing && fields[exercises[item.exerciseId].type].some(([key]) => key === 'reps')">Reps máx.<input :value="set.repsMax ?? ''" inputmode="numeric" @change="set.repsMax = numberValue($event.target.value)" /></label>
        </div>
        <div v-if="!editing" class="set-actions"><button class="icon-button check-set" :aria-label="(set.done ? 'Desfazer série ' : 'Concluir série ') + (j+1)" :aria-pressed="set.done" @click="mark(item,set,i,j)"><Check :size="20" /></button><button v-if="!set.done && item.sets.length > 1" class="icon-button remove-set" aria-label="Remover série pendente" @click="remove(target,item.sets,j)"><X :size="15" /></button></div>
        <button v-else-if="item.sets.length > 1" class="icon-button" aria-label="Remover série" @click="remove(target,item.sets,j)"><X :size="19" /></button>
      </div>
      <button class="text-button" :disabled="item.sets.length >= 150" @click="addSet(item)"><Plus :size="17" /> Adicionar série</button>
    </section>
    <div v-if="!target.exercises.length" class="card panel workout-empty"><Dumbbell :size="25" /><h2>Monte os exercícios</h2><p class="muted">Escolha no catálogo e registre as séries na ordem em que treinar.</p></div>
    <div class="inline wrap editor-actions"><button class="button dark" @click="s.picker = true"><Plus :size="18" /> Adicionar exercício</button><button class="button subtle" @click="editing ? go('treinar') : discard()">{{ editing ? 'Cancelar' : 'Descartar treino' }}</button></div>
    <div v-if="!editing && rest" class="timer-bar session-timer"><Timer :size="21" /><strong role="timer">Descanso {{ clock(rest) }}</strong><button class="button subtle small" @click="s.active.timer.until += 15000">+15 s</button><button class="button subtle small" @click="s.active.timer = null">Pular</button></div>
    <div v-if="s.review && !editing" class="overlay" @click.self="!s.busy && (s.review = false)">
      <section class="dialog card panel session-review" role="dialog" aria-modal="true" aria-label="Revisar treino">
        <div class="section-head"><h2>Revisar treino</h2><button class="icon-button" aria-label="Fechar" :disabled="s.busy" @click="s.review = false"><X :size="21" /></button></div>
        <p><strong>{{ target.name || 'Treino livre' }}</strong> · {{ doneCount }} séries · {{ fmt(recordedVolume) }} kg · {{ clock(elapsed) }}</p>
        <p v-if="doneCount < totalSets" class="message">{{ totalSets - doneCount }} séries ficaram pendentes. Só as concluídas entram no histórico.</p>
        <p v-if="s.error" class="message error" role="alert">{{ s.error }}</p>
        <div class="inline wrap"><button class="button subtle" :disabled="s.busy" @click="s.review = false">Continuar treino</button><button class="button lime" :disabled="s.busy" @click="finish">{{ s.busy ? 'Salvando…' : 'Salvar no histórico' }}</button></div>
      </section>
    </div>
  </template>
  <p v-else class="card empty">Abra uma rotina ou inicie um treino na aba <button class="text-button" @click="go('treinar')">Treinar</button>.</p>
</template>
