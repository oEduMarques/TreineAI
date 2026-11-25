<script setup>
import { ref, watch } from 'vue'
import { Clipboard, Sparkles } from 'lucide-vue-next'
import { exercises } from './training'
const { state:s, generate, makeBrief, reviewPlan, savePlan, useDay } = defineProps({ training:{ type:Object,required:true } }).training
const method = ref(s.status.aiConfigured ? 'provider' : 'external')
const brief = ref('')
const draftText = ref('')
const copyFeedback = ref('')
watch(() => [s.planKind,s.goal,s.days], () => { brief.value = ''; copyFeedback.value = '' })

function submitGoal() {
  if (method.value === 'provider') return generate()
  return makeBrief(prompt => { brief.value = prompt; copyFeedback.value = '' })
}

async function copyBrief() {
  try {
    await navigator.clipboard.writeText(brief.value)
    copyFeedback.value = 'Prompt copiado.'
  } catch {
    copyFeedback.value = 'Selecione e copie o texto do campo.'
  }
}
</script>

<template>
  <div class="intro"><div><h1>Coach IA</h1><p>Gere e revise planos de treino e alimentação.</p></div></div>
  <div class="overview-grid ai-grid">
    <form class="card panel form-fields" @submit.prevent="submitGoal">
      <div class="section-head"><h2>Novo plano</h2><Sparkles :size="23" /></div>
      <div v-if="!s.session" class="message coach-login"><p>Entre na sua conta para revisar e salvar planos.</p><button type="button" class="text-button" @click="s.login = true">Entrar</button></div>
      <label>Tipo de plano<select v-model="s.planKind"><option value="training">Treino</option><option value="nutrition">Alimentação</option></select></label>
      <label v-if="s.planKind === 'training'">Dias de treino por semana<input v-model.number="s.days" type="number" min="1" max="7" required /></label>
      <label>Objetivo e preferências<textarea v-model="s.goal" required minlength="10" maxlength="2000" rows="4" :placeholder="s.planKind === 'training' ? 'Ex.: ganhar força com halteres e banco.' : 'Ex.: refeições simples e opções sem lactose.'" /></label>
      <label v-if="s.status.aiConfigured">Como gerar<select v-model="method"><option value="provider">Provedor conectado</option><option value="external">ChatGPT ou outra IA</option></select></label>
      <p v-if="method === 'provider'" class="muted">O objetivo informado será enviado ao provedor conectado.</p>
      <p v-else class="muted">Prepare um prompt, envie para o ChatGPT ou outra IA e cole o plano retornado aqui.</p>
      <button class="button dark" :disabled="s.busy || !s.session"><Sparkles :size="17" /> {{ method === 'provider' ? 'Gerar plano' : 'Preparar prompt' }}</button>
    </form>
    <section class="card panel">
      <h2>Planos salvos</h2><p v-if="!s.plans.length" class="empty">Seus planos revisados aparecem aqui.</p>
      <article v-for="plan in s.plans" :key="plan.id" class="plan-summary"><strong>{{ plan.title }}</strong><p>{{ plan.summary }}</p><div v-for="(day,i) in plan.days" :key="i" class="routine-row"><span class="grow">{{ day.title }}</span><button class="text-button" @click="useDay(day)">Criar rotina</button></div><div v-for="(meal,i) in plan.meals" :key="i"><strong>{{ meal.title }}</strong><p>{{ meal.foods.join(', ') }}</p></div></article>
    </section>
  </div>
  <section v-if="method === 'external'" class="card panel form-fields plan-preview">
    <template v-if="brief">
      <div class="section-head"><h2>Prompt para sua IA</h2><button type="button" class="button subtle small" @click="copyBrief"><Clipboard :size="16" /> Copiar</button></div>
      <textarea :value="brief" aria-label="Prompt para sua IA" readonly rows="5"></textarea>
      <p v-if="copyFeedback" class="muted" role="status">{{ copyFeedback }}</p>
    </template>
    <form class="form-fields" @submit.prevent="reviewPlan(draftText,() => { draftText = '' })">
      <h2>Importar plano</h2>
      <label>Resposta da IA<textarea v-model="draftText" rows="5" maxlength="60000" required placeholder="Cole aqui o JSON retornado pela IA." /></label>
      <button class="button dark" :disabled="s.busy || !s.session || !draftText.trim()">Revisar plano</button>
    </form>
  </section>
  <section v-if="s.plan" class="card panel plan-preview">
    <div class="section-head"><h2>{{ s.plan.title }}</h2><button class="button lime" :disabled="s.busy" @click="savePlan">Salvar plano</button></div><p>{{ s.plan.summary }}</p>
    <div v-for="(day,i) in s.plan.days" :key="i"><h3>{{ day.title }}</h3><ul class="simple-list"><li v-for="(item,j) in day.exercises" :key="j">{{ exercises[item.exercise_id].name }} <span>{{ item.sets }} × {{ item.reps }} · {{ item.rest_seconds }} s</span></li></ul></div>
    <div v-for="(meal,i) in s.plan.meals" :key="i"><h3>{{ meal.title }}</h3><p>{{ meal.foods.join(', ') }}</p></div>
  </section>
</template>
