<script setup>
import { computed, ref, watch } from 'vue'
import { Activity, BarChart3, CalendarDays, ChevronRight, CirclePlay, Clock3, Dumbbell, History, House, LibraryBig, LogIn, Plus, RotateCcw, Sparkles, X } from 'lucide-vue-next'
import ExercisePicker from './ExercisePicker.vue'
import WorkoutEditor from './WorkoutEditor.vue'
import CoachPanel from './CoachPanel.vue'
import { catalog, dateLabel, demoRoutines, duration, exercises, fmt, setCount, setLabel, setTypes, supabase, uid, volume } from './training'
import { useTraining } from './useTraining'

const training = useTraining()
const { state:s, go, signIn, signOut, ordered, week, weekly, progress, best, unit, volumeMetric, edit, begin, addExercises } = training
const menu = [
  ['inicio','Visão geral',House], ['treinar','Treinar',Dumbbell], ['historico','Histórico',History],
  ['progresso','Progresso',BarChart3], ['exercicios','Exercícios',LibraryBig], ['ia','Coach IA',Sparkles],
]
const navActive = page => s.page === page || (page === 'treinar' && ['rotina','sessao'].includes(s.page))
const stats = computed(() => [
  ['Treinos na semana', weekly.value.count, 'treinos', Dumbbell],
  ['Volume na semana', fmt(weekly.value.volume), 'kg', Activity],
  ['Tempo de treino', weekly.value.minutes, 'min', Clock3],
])
const date = new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'})
const historySearch = ref('')
const historyMonth = ref('')
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const monthOf = iso => {
  const date = new Date(iso)
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2,'0')
}
const filteredHistory = computed(() => {
  const query = normalize(historySearch.value.trim())
  return ordered.value.filter(workout => (!historyMonth.value || monthOf(workout.finishedAt) === historyMonth.value) &&
    (!query || normalize(workout.name).includes(query) || workout.exercises.some(e => normalize(exercises[e.exerciseId].name).includes(query))))
})
watch([historySearch,historyMonth], () => { s.limit = 20 })
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" aria-label="Navegação principal">
      <button class="brand" @click="go('inicio')"><img src="/mark.svg" alt="" /><span>Treine<span>AI</span></span></button>
      <nav class="nav"><button v-for="[page,title,icon] in menu" :key="page" :class="{current:navActive(page)}" @click="go(page)"><component :is="icon" :size="19" />{{ title }}</button></nav>
      <div class="side-bottom"><span class="account-avatar">{{ s.session?.user.email?.[0]?.toUpperCase() || 'T' }}</span><div><strong>{{ s.session?.user.email || 'TreineAI' }}</strong><small>{{ s.session ? 'Minha conta' : 'Modo demonstração' }}</small></div><button v-if="s.session" class="icon-button" aria-label="Sair" @click="signOut"><LogIn :size="17" /></button></div>
    </aside>
    <main class="main">
      <header class="topbar">
        <button class="brand mobile-brand" @click="go('inicio')"><img src="/mark.svg" alt="" /><span>Treine<span>AI</span></span></button>
        <div class="top-label"><span>TreineAI</span><ChevronRight :size="14" /><strong>{{ menu.find(item => item[0] === s.page)?.[1] || 'Treinar' }}</strong></div>
        <button v-if="!s.session" class="button subtle small" @click="s.login = true"><LogIn :size="16" /> Entrar</button>
        <button v-else class="button subtle small mobile-only" @click="signOut">Sair</button>
      </header>
      <div class="content">
        <p v-if="s.error" class="message error" role="alert">{{ s.error }}</p>
        <p v-if="s.notice" class="message" role="status">{{ s.notice }}</p>
        <p v-if="s.loading" class="muted" role="status">Carregando sua conta…</p>

        <template v-if="s.page === 'inicio'">
          <div class="intro"><div><p class="date-kicker"><CalendarDays :size="15" /> {{ date.format(s.now) }}</p><h1>Visão geral</h1></div><button class="button dark desktop-only" @click="begin()"><Plus :size="18" /> {{ s.active ? 'Retomar treino' : 'Treino livre' }}</button></div>
          <section class="hero"><div class="hero-content"><h2>{{ s.active ? 'Retome seu treino.' : 'Vamos treinar?' }}</h2><p>{{ s.active ? 'Suas séries estão salvas neste dispositivo.' : 'Escolha uma rotina ou comece um treino livre.' }}</p><button class="button lime" @click="go(s.active ? 'sessao' : 'treinar')"><Dumbbell :size="18" /> {{ s.active ? 'Retomar treino' : 'Começar treino' }}</button></div></section>
          <div class="stats-grid"><article v-for="[label,value,unit,icon] in stats" :key="label" class="card stat"><div class="stat-top"><span>{{ label }}</span><component :is="icon" :size="19" /></div><strong>{{ value }}</strong><small>{{ unit }}</small></article></div>
          <div class="overview-grid">
            <section class="card panel"><div class="section-head"><h2>Minhas rotinas</h2><button class="text-button" @click="go('treinar')">Ver todas <ChevronRight :size="15" /></button></div>
              <p v-if="!s.routines.length" class="empty">Crie uma rotina para repetir seus treinos.</p>
              <div v-for="(routine,i) in s.routines.slice(0,3)" :key="routine.id" class="routine-row"><span class="item-icon" :class="'tone-' + i"><Dumbbell :size="20" /></span><div class="grow"><strong>{{ routine.name }}</strong><span>{{ routine.exercises.length }} exercícios<span v-if="routine.notes"> · {{ routine.notes }}</span></span></div><button class="icon-button" :aria-label="'Iniciar ' + routine.name" @click="begin(routine)"><CirclePlay :size="22" /></button></div>
              <button class="button subtle full" @click="edit()"><Plus :size="18" /> Nova rotina</button>
            </section>
            <section class="card panel"><div class="section-head"><h2>Esta semana</h2><CalendarDays :size="19" class="muted" /></div><div class="week-grid"><div v-for="day in week" :key="day.date" :aria-label="day.date + (day.trained ? ', dia treinado' : '')"><span>{{ day.label }}</span><strong :class="{ trained:day.trained,today:day.today }">{{ day.trained ? '✓' : day.date }}</strong></div></div><div class="recent"><span>Último treino</span><button v-if="ordered[0]" class="text-button" @click="s.selected = ordered[0]">{{ ordered[0].name }} <ChevronRight :size="16" /></button><strong v-else>Nenhum treino registrado</strong></div></section>
          </div>
        </template>

        <template v-else-if="s.page === 'treinar'">
          <div class="intro"><div><h1>Treinar</h1><p>Suas rotinas e sessões de treino.</p></div><button class="button dark" @click="edit()"><Plus :size="18" /> Nova rotina</button></div>
          <div class="card panel action-card"><span class="item-icon"><Dumbbell :size="22" /></span><div class="grow"><strong>{{ s.active?.name || 'Treino livre' }}</strong><span>{{ s.active ? 'Treino em andamento' : 'Monte a sessão enquanto treina.' }}</span></div><button class="button lime" @click="begin()">{{ s.active ? 'Retomar' : 'Iniciar' }}</button></div>
          <div class="routine-grid"><article v-for="routine in s.routines" :key="routine.id" class="card panel"><div class="section-head"><h2>{{ routine.name }}</h2><button class="text-button" @click="edit(routine)">Editar</button></div><p v-if="routine.notes" class="muted">{{ routine.notes }}</p>
            <ul class="simple-list"><li v-for="(item,i) in routine.exercises" :key="i">{{ exercises[item.exerciseId].name }} <span>{{ item.sets.length }} séries</span></li></ul><button class="button dark full" @click="begin(routine)"><CirclePlay :size="18" /> Iniciar rotina</button></article></div>
          <section v-if="!s.routines.length && !s.loading" class="card panel starter-routines">
            <div class="section-head"><h2>Comece com um modelo</h2></div>
            <div v-for="routine in demoRoutines" :key="routine.id" class="routine-row">
              <span class="item-icon"><Dumbbell :size="18" /></span>
              <div class="grow"><strong>{{ routine.name }}</strong><span>{{ routine.notes }} · {{ routine.exercises.length }} exercícios</span></div>
              <button class="button subtle small" @click="edit({...routine,id:uid()})">Usar modelo</button>
            </div>
          </section>
        </template>

        <WorkoutEditor v-else-if="['rotina','sessao'].includes(s.page)" :training="training" />

        <template v-else-if="s.page === 'historico'">
          <div class="intro"><div><h1>Histórico</h1><p>{{ filteredHistory.length }} {{ filteredHistory.length === 1 ? 'treino encontrado' : 'treinos encontrados' }}</p></div></div>
          <section class="card panel">
            <div class="history-filters"><label>Buscar<input v-model="historySearch" type="search" placeholder="Nome do treino ou exercício" /></label><label>Mês<input v-model="historyMonth" type="month" /></label><button v-if="historySearch || historyMonth" class="button subtle" @click="historySearch = ''; historyMonth = ''">Limpar</button></div>
            <p v-if="!filteredHistory.length" class="empty">{{ s.workouts.length ? 'Nenhum treino com esses filtros.' : 'Seus treinos concluídos aparecem aqui.' }}</p>
            <button v-for="workout in filteredHistory.slice(0,s.limit)" :key="workout.id" class="history-row" @click="s.selected = workout"><span class="item-icon"><CalendarDays :size="20" /></span><span class="grow"><strong>{{ workout.name }}</strong><small>{{ dateLabel(workout.finishedAt) }} · {{ duration(workout) }} min · {{ setCount(workout) }} séries</small></span><strong class="history-volume">{{ fmt(volume(workout)) }} kg</strong><ChevronRight :size="17" /></button>
            <button v-if="filteredHistory.length > s.limit" class="button subtle full" @click="s.limit += 20">Mostrar mais</button>
          </section>
        </template>

        <template v-else-if="s.page === 'progresso'">
          <div class="intro"><div><h1>Progresso</h1><p>Acompanhe seu desempenho por exercício.</p></div></div>
          <section class="card panel">
            <div class="history-filters progress-filters">
              <label>Exercício<select v-model="s.exerciseId"><option v-for="item in catalog" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
              <label>Período<select v-model="s.progressPeriod"><option value="30">30 dias</option><option value="90">90 dias</option><option value="365">1 ano</option><option value="all">Todo o histórico</option></select></label>
              <label v-if="unit === 'kg'">Métrica<select v-model="s.progressMetric"><option value="best">Maior carga</option><option value="volume">Volume por treino</option></select></label>
            </div>
            <p v-if="!progress.length" class="empty">Nenhuma série desse exercício no período.</p>
            <template v-else>
              <div class="record"><small>{{ volumeMetric ? 'Maior volume' : 'Melhor marca' }} no período</small><strong>{{ fmt(best) }} {{ unit }}</strong></div>
              <div class="progress-chart" aria-label="Últimos treinos do exercício"><div v-for="entry in progress.slice(0,12).reverse()" :key="entry.id"><strong>{{ fmt(entry.value) }}</strong><span :style="{height:Math.max(6,entry.value/(best||1)*120)+'px'}"></span><small>{{ dateLabel(entry.date) }}</small></div></div>
            </template>
          </section>
        </template>

        <template v-else-if="s.page === 'exercicios'"><div class="intro"><div><h1>Exercícios</h1><p>{{ catalog.length }} exercícios com demonstração em vídeo</p></div></div><section class="card panel"><ExercisePicker @video="s.video = $event" /></section></template>
        <CoachPanel v-else-if="s.page === 'ia'" :training="training" />
      </div>
    </main>

    <nav class="mobile-nav" aria-label="Navegação móvel"><button v-for="[page,title,icon] in menu" :key="page" :class="{current:navActive(page)}" @click="go(page)"><component :is="icon" :size="19" /><span>{{ page === 'inicio' ? 'Início' : page === 'ia' ? 'IA' : title }}</span></button></nav>
    <div v-if="s.selected" class="overlay" @click.self="s.selected = null">
      <section class="dialog card panel" role="dialog" aria-modal="true" aria-label="Treino concluído">
        <div class="section-head"><h2>{{ s.selected.name }}</h2><button class="icon-button" aria-label="Fechar" @click="s.selected = null"><X :size="21" /></button></div>
        <p class="muted">{{ dateLabel(s.selected.finishedAt) }} · {{ duration(s.selected) }} min · {{ fmt(volume(s.selected)) }} kg</p>
        <p v-if="s.selected.notes" class="logged-notes">{{ s.selected.notes }}</p>
        <article v-for="(item,i) in s.selected.exercises" :key="i" class="logged-exercise">
          <h3>{{ exercises[item.exerciseId].name }}</h3>
          <p v-if="item.notes" class="logged-notes muted">{{ item.notes }}</p>
          <ol><li v-for="(set,j) in item.sets" :key="j">{{ setLabel(set) }}<small v-if="set.type !== 'normal'"> · {{ setTypes[set.type] }}</small></li></ol>
        </article>
        <button class="button dark full" @click="begin(s.selected,true)"><RotateCcw :size="18" /> Repetir treino</button>
      </section>
    </div>
    <div v-if="s.picker" class="overlay" @click.self="s.picker = false"><section class="dialog card panel picker-dialog" role="dialog" aria-modal="true" aria-label="Selecionar exercícios"><div class="section-head"><h2>Adicionar exercícios</h2><button class="icon-button" aria-label="Fechar" @click="s.picker = false"><X :size="22" /></button></div><ExercisePicker selection @select="addExercises" @video="s.video = $event" /></section></div>
    <div v-if="s.video" class="overlay video-overlay" @click.self="s.video = null">
      <section class="dialog card panel" role="dialog" aria-modal="true" aria-label="Demonstração do exercício">
        <div class="section-head"><h2>{{ s.video.name }}</h2><button class="icon-button" aria-label="Fechar" @click="s.video = null"><X :size="22" /></button></div>
        <iframe v-if="s.video.youtubeId" class="exercise-video-frame" :title="'Demonstração de ' + s.video.name" :src="'https://www.youtube-nocookie.com/embed/' + s.video.youtubeId" allow="encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        <video v-else :key="s.video.video" :src="s.video.playback || s.video.video" controls playsinline preload="metadata" @error="s.videoFailed = true" />
        <p v-if="s.videoFailed" class="message">Não foi possível reproduzir o vídeo aqui. Abra o arquivo original abaixo.</p>
        <p class="video-credit">
          <span>Vídeo de {{ s.video.author }}<template v-if="s.video.source">, via <a :href="s.video.source" target="_blank" rel="noopener">wger</a> · <a :href="s.video.licenseUrl" target="_blank" rel="noopener">{{ s.video.license }}</a></template></span>
          <a :href="s.video.video" target="_blank" rel="noopener">{{ s.video.youtubeId ? 'Ver no YouTube' : 'Vídeo original' }}</a>
        </p>
      </section>
    </div>
    <div v-if="s.login" class="overlay" @click.self="s.login = false"><section class="dialog card panel login" role="dialog" aria-modal="true" aria-label="Entrar no TreineAI"><div class="section-head"><h2>Entrar no TreineAI</h2><button class="icon-button" aria-label="Fechar" @click="s.login = false"><X :size="22" /></button></div><p v-if="!supabase" class="message">A entrada será habilitada ao configurar o Supabase. Você já pode testar os treinos no modo demonstração.</p><form v-else class="form-fields" @submit.prevent="signIn(false)"><label>E-mail<input v-model="s.email" type="email" autocomplete="email" required /></label><label>Senha<input v-model="s.password" type="password" autocomplete="current-password" minlength="6" required /></label><p v-if="s.loginMessage" class="message" role="status">{{ s.loginMessage }}</p><div class="inline wrap"><button class="button dark" :disabled="s.busy">Entrar</button><button class="button subtle" type="button" :disabled="s.busy" @click="signIn(true)">Criar conta</button></div></form></section></div>
  </div>
</template>
