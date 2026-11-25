<script setup>
import { computed } from 'vue'
import { Check, CirclePlay, Plus, Timer, Trash2, X } from 'lucide-vue-next'
import { blankSet, exercises, fields, numberValue } from './training'
import { clock } from './useTraining'

const { state:s, go, elapsed, doneCount, rest, saveRoutine, finish, previous, remove, mark, discard } = defineProps({ training:{ type:Object,required:true } }).training
const editing = computed(() => s.page === 'rotina')
const target = computed(() => editing.value ? s.editor : s.active)
</script>

<template>
  <template v-if="target">
    <div class="intro"><div><h1>{{ editing ? 'Editor de rotina' : 'Treino em andamento' }}</h1><p v-if="!editing">{{ clock(elapsed) }} · {{ doneCount }} séries concluídas</p></div><button class="button dark" :disabled="s.busy" @click="editing ? saveRoutine() : finish()">{{ editing ? 'Salvar rotina' : 'Concluir treino' }}</button></div>
    <div class="card panel form-fields"><label>Nome<input v-model="target.name" maxlength="180" placeholder="Ex.: Superiores A" /></label><label v-if="editing">Notas<textarea v-model="target.notes" rows="2" maxlength="3000" placeholder="Opcional" /></label></div>
    <section v-for="(item,i) in target.exercises" :key="i" class="card panel workout-exercise">
      <div class="section-head"><h2>{{ exercises[item.exerciseId].name }}</h2><div class="inline"><button class="icon-button" aria-label="Ver vídeo" @click="s.video = exercises[item.exerciseId]"><CirclePlay :size="21" /></button><button class="icon-button" aria-label="Remover exercício" @click="remove(target,target.exercises,i)"><Trash2 :size="18" /></button></div></div>
      <div class="rest-setting"><Timer :size="16" /><label>Descanso <input v-model.number="item.rest" type="number" min="0" max="3600" aria-label="Descanso em segundos" /> s</label></div>
      <div v-for="(set,j) in item.sets" :key="j" class="set-row" :class="{done:set.done}">
        <div class="set-number"><strong>{{ j + 1 }}</strong><small v-if="!editing">Anterior {{ previous(item,j) }}<template v-if="set.target && set.target !== '—'"> · Meta {{ set.target }}</template></small></div>
        <div class="set-inputs">
          <label v-for="[field,label] in fields[exercises[item.exerciseId].type]" :key="field">{{ label }}<input :value="set[field] ?? ''" :inputmode="['reps','seconds'].includes(field) ? 'numeric' : 'decimal'" :disabled="set.done" @change="set[field] = numberValue($event.target.value)" /></label>
          <label v-if="editing && fields[exercises[item.exerciseId].type].some(([key]) => key === 'reps')">Reps máx.<input :value="set.repsMax ?? ''" inputmode="numeric" @change="set.repsMax = numberValue($event.target.value)" /></label>
        </div>
        <button v-if="!editing" class="icon-button check-set" :aria-label="(set.done ? 'Desfazer série ' : 'Concluir série ') + (j+1)" :aria-pressed="set.done" @click="mark(item,set,i,j)"><Check :size="20" /></button>
        <button v-else-if="item.sets.length > 1" class="icon-button" aria-label="Remover série" @click="remove(target,item.sets,j)"><X :size="19" /></button>
      </div>
      <button class="text-button" @click="item.sets.push(blankSet())"><Plus :size="17" /> Adicionar série</button>
    </section>
    <div class="inline wrap editor-actions"><button class="button dark" @click="s.picker = true"><Plus :size="18" /> Adicionar exercício</button><button class="button subtle" @click="editing ? go('treinar') : discard()">{{ editing ? 'Cancelar' : 'Descartar treino' }}</button></div>
    <div v-if="!editing && rest" class="timer-bar"><Timer :size="21" /><strong role="timer">Descanso {{ clock(rest) }}</strong><button class="button subtle small" @click="s.active.timer.until += 15000">+15 s</button><button class="button subtle small" @click="s.active.timer = null">Pular</button></div>
  </template>
  <p v-else class="card empty">Abra uma rotina ou inicie um treino na aba <button class="text-button" @click="go('treinar')">Treinar</button>.</p>
</template>
