# TreineAI

Aplicativo web de treino com Vue 3, FastAPI e Supabase. A interface tem navegação lateral no desktop e inferior no celular.

## Executar localmente

Use Node 22 e Python 3.11 ou superior.

```powershell
npm ci
npm run build
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\.venv\Scripts\python.exe -m uvicorn backend.main:app
```

Abra http://127.0.0.1:8000. Para trabalhar no frontend com atualização automática, mantenha o backend na porta 8000 e rode `npm run dev` em outro terminal.

Sem configuração externa, o site inicia com rotinas e treinos fictícios. O modo demonstração guarda as alterações no navegador. A sessão em andamento é retomada no mesmo navegador, inclusive quando o tempo de descanso avançou com a aba fechada.

## Supabase do TreineAI

Crie um projeto **TreineAI** independente. Execute a [migração](supabase/migrations/202611250001_treine_records.sql) no SQL Editor desse projeto ou aplique-a com o CLI vinculado a ele. Habilite o login por e-mail no Supabase Auth e configure a URL do app como destino dos links de confirmação.

Copie `.env.example` para `.env`. Preencha `SUPABASE_URL` e `VITE_SUPABASE_URL` com a URL do novo projeto. Preencha as duas variáveis `*_SUPABASE_PUBLISHABLE_KEY` correspondentes com a chave publicável. Reinicie o backend e gere o build após alterar as variáveis `VITE_*`.

A API usa a chave publicável e o token do usuário. As políticas RLS filtram rotinas, treinos e planos pelo proprietário. Cada treino salvo ocupa uma linha e o aplicativo não impõe um teto de treinos por conta. Um MCP do Supabase é opcional e não faz parte da execução.

## Coach IA

Configure `AI_BASE_URL`, `AI_API_KEY` e `AI_MODEL` no servidor para conectar um provedor compatível com Chat Completions e saída `json_object`. A chave fica no backend. O objetivo escrito pelo usuário é enviado ao provedor. Planos de treino também recebem a lista de exercícios disponíveis.

O Coach gera rascunhos de treino ou sugestões de refeições, valida a estrutura, exibe os detalhes antes de salvar e permite transformar um dia de treino salvo em uma rotina editável. A alimentação tem escopo de planejamento geral. O contrato OpenAPI fica em `/docs`.

- `POST /api/ai/plans` recebe `kind`, `goal` e `days_per_week` e retorna um rascunho para revisão.
- `PUT /api/records/plan/{id}` salva um plano revisado e serve para importar um plano estruturado de outro cliente.
- Ambos exigem o token Supabase da conta do usuário. A geração exige um provedor configurado.

## Catálogo e vídeos

O [catálogo inicial](data/exercises.json) referencia 14 exercícios verificados com o MCP do Hevy. Os nomes em português foram adaptados para o TreineAI. Os vídeos são do autor Goulart, via wger, sob CC BY-SA 4.0. Cada exercício mantém os links do vídeo original, da fonte e da licença. O catálogo inicial cobre os movimentos com demonstrações correspondentes encontradas nesta etapa.

As cópias locais em `public/videos` foram transcodificadas para MP4/H.264 a 480p e mantêm a licença CC BY-SA 4.0. Para recriá-las, instale `imageio-ffmpeg` no ambiente de desenvolvimento e execute `python scripts/prepare_videos.py`.
