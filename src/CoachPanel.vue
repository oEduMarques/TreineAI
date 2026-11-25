<script setup>
import { Sparkles } from 'lucide-vue-next'
import { exercises } from './training'
const { state:s, generate, savePlan, useDay } = defineProps({ training:{ type:Object,required:true } }).training
</script>

<template>
  <div class="intro"><div><h1>Coach IA</h1><p>Gere e revise planos de treino e alimentação.</p></div></div>
  <div class="overview-grid ai-grid">
    <form class="card panel form-fields" @submit.prevent="generate">
      <div class="section-head"><h2>Novo plano</h2><Sparkles :size="23" /></div>
      <p v-if="!s.status.aiConfigured" class="message">O provedor de IA ainda precisa ser configurado.</p><p v-else-if="!s.session" class="message">Entre para gerar e salvar planos.</p>
      <label>Tipo de plano<select v-model="s.planKind"><option value="training">Treino</option><option value="nutrition">Alimentação</option></select></label>
      <label v-if="s.planKind === 'training'">Dias de treino por semana<input v-model.number="s.days" type="number" min="1" max="7" required /></label>
      <label>Objetivo e preferências<textarea v-model="s.goal" required minlength="10" maxlength="2000" rows="4" :placeholder="s.planKind === 'training' ? 'Ex.: ganhar força com halteres e banco.' : 'Ex.: refeições simples e opções sem lactose.'" /></label>
      <p v-if="s.status.aiConfigured" class="muted">O objetivo informado será enviado ao provedor de IA.</p>
      <button class="button dark" :disabled="s.busy || !s.session || !s.status.aiConfigured"><Sparkles :size="17" /> {{ s.busy ? 'Gerando…' : 'Gerar plano' }}</button>
    </form>
    <section class="card panel">
      <h2>Planos salvos</h2><p v-if="!s.plans.length" class="empty">Seus planos revisados aparecem aqui.</p>
      <article v-for="plan in s.plans" :key="plan.id" class="plan-summary"><strong>{{ plan.title }}</strong><p>{{ plan.summary }}</p><div v-for="(day,i) in plan.days" :key="i" class="routine-row"><span class="grow">{{ day.title }}</span><button class="text-button" @click="useDay(day)">Criar rotina</button></div><div v-for="(meal,i) in plan.meals" :key="i"><strong>{{ meal.title }}</strong><p>{{ meal.foods.join(', ') }}</p></div></article>
    </section>
  </div>
  <section v-if="s.plan" class="card panel plan-preview">
    <div class="section-head"><h2>{{ s.plan.title }}</h2><button class="button lime" :disabled="s.busy" @click="savePlan">Salvar plano</button></div><p>{{ s.plan.summary }}</p>
    <div v-for="(day,i) in s.plan.days" :key="i"><h3>{{ day.title }}</h3><ul class="simple-list"><li v-for="(item,j) in day.exercises" :key="j">{{ exercises[item.exercise_id].name }} <span>{{ item.sets }} × {{ item.reps }} · {{ item.rest_seconds }} s</span></li></ul></div>
    <div v-for="(meal,i) in s.plan.meals" :key="i"><h3>{{ meal.title }}</h3><p>{{ meal.foods.join(', ') }}</p></div>
  </section>
</template>
