<script setup>
import { computed, ref } from 'vue'
import { Check, CirclePlay, Dumbbell, Plus, Search } from 'lucide-vue-next'
import { catalog, equipment, muscles } from './training'

const props = defineProps({ selection: Boolean })
const emit = defineEmits(['select', 'video'])
const query = ref('')
const group = ref('')
const gear = ref('')
const selected = ref([])
function toggle(id) {
  selected.value = selected.value.includes(id) ? selected.value.filter(item => item !== id) : [...selected.value,id]
}
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const filtered = computed(() => catalog.filter(item =>
  (!group.value || item.muscle === group.value) && (!gear.value || item.equipment === gear.value) &&
  normalize(item.name + ' ' + item.reference).includes(normalize(query.value.trim()))))
</script>

<template>
  <div class="exercise-browser">
    <div class="filters">
      <label class="search-input"><Search :size="17" /><input v-model="query" placeholder="Buscar exercício" aria-label="Buscar exercício" /></label>
      <select v-model="group" aria-label="Grupo muscular"><option value="">Todos os músculos</option><option v-for="(label, key) in muscles" :key="key" :value="key">{{ label }}</option></select>
      <select v-model="gear" aria-label="Equipamento"><option value="">Todos os equipamentos</option><option v-for="(label, key) in equipment" :key="key" :value="key">{{ label }}</option></select>
    </div>
    <p v-if="!filtered.length" class="empty">Nenhum exercício com esses filtros.</p>
    <div v-else class="exercise-list">
      <article v-for="item in filtered" :key="item.id" class="exercise-row" :class="{'exercise-selected':selected.includes(item.id)}">
        <span class="item-icon"><Dumbbell :size="20" /></span>
        <div class="grow"><strong>{{ item.name }}</strong><span>{{ muscles[item.muscle] }} · {{ equipment[item.equipment] }}</span></div>
        <button class="icon-button" type="button" :aria-label="'Ver vídeo de ' + item.name" @click="emit('video', item)"><CirclePlay :size="21" /></button>
        <button v-if="props.selection" class="icon-button" type="button" :aria-label="'Selecionar ' + item.name" :aria-pressed="selected.includes(item.id)" @click="toggle(item.id)">
          <Check v-if="selected.includes(item.id)" :size="21" /><Plus v-else :size="21" />
        </button>
      </article>
    </div>
    <div v-if="props.selection" class="exercise-picker-footer">
      <span>{{ selected.length }} {{ selected.length === 1 ? 'selecionado' : 'selecionados' }}</span>
      <button class="button lime" type="button" :disabled="!selected.length" @click="emit('select', selected)">Adicionar</button>
    </div>
  </div>
</template>
