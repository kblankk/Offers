# Publicar o Cupom Radar de graça 🚀

O app tem duas partes que afetam a hospedagem:
- **Site (Next.js)** — roda em qualquer lugar.
- **Coleta** — usa `fetch` (Telegram) e **Playwright/Chromium** (Cuponomia). O Chromium
  precisa de um ambiente com navegador, então **não roda no plano serverless grátis da
  Vercel**. Por isso usamos um host que roda um servidor Node de verdade (via Docker).

## Opção recomendada (grátis): Render

1. Suba o código no GitHub (já está em `github.com/kblankk/Offers`).
2. Crie conta em **https://render.com** (pode logar com o GitHub).
3. **New → Blueprint** → selecione o repositório `Offers`. O Render lê o `render.yaml`
   e o `Dockerfile` automaticamente.
4. Clique em **Apply**. O primeiro build leva ~5–8 min (baixa o Chromium).
5. Pronto: você recebe uma URL tipo `https://cupom-radar.onrender.com`.

### O que esperar no plano grátis do Render
- ✅ Telegram + Cuponomia funcionam (ambiente completo com Chromium).
- ✅ Atualiza sozinho a cada 5 min **enquanto está acordado**.
- ⚠️ **Dorme após ~15 min sem acesso.** A primeira visita depois disso demora ~30–60s
  (ele acorda, coleta e serve). Os dados são recoletados ao acordar.
- 💾 Sem disco persistente: o JSON é recriado a cada reinício (sem problema — é recoletado).

## Alternativas grátis
- **Fly.io** / **Railway**: mesmos arquivos (Docker). Fly tem opção de ficar sempre ligado.
- **Seu PC + túnel (sempre fresco, sem dormir)**: rode `npm run dev` e exponha com
  **Cloudflare Tunnel** (`cloudflared tunnel --url http://localhost:3000`) ou ngrok.
  Você acessa do celular por uma URL pública enquanto o PC estiver ligado.

## Variáveis de ambiente (opcionais)
- `COLLECT_INTERVAL_MIN` — intervalo da coleta (padrão 5).
- `TELEGRAM_CHANNELS` — lista de canais (csv) para sobrescrever os padrões.
- `ENABLED_STORES` — `mercadolivre,amazon,shopee`.

## Local (sempre funciona)
```bash
npm install
npm run dev      # http://localhost:3000  (já coleta sozinho)
```
