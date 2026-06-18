# Cupom Radar 🎟️

Aplicação **web** para descobrir, buscar e verificar **cupons reais** (código + %) de
**Mercado Livre**, **Amazon** e **Shopee**. Mostra quais estão **ativos**, **expirados**
ou **possivelmente esgotados**.

100% **gratuito** e open-source: Next.js + React + Tailwind, Playwright (coleta) e
armazenamento local em JSON. Nenhum serviço pago, nenhuma compilação nativa.

![status badges: ativo / expirado / suspeito]

---

## ✨ Funcionalidades
- 📡 **Múltiplas fontes**: agregador (Cuponomia) + **canais públicos do Telegram**
  (`t.me/s/<canal>`) — pega cupons recém-postados, muitas vezes antes dos agregadores.
- 🔁 **Deduplicação por código**: o mesmo cupom vindo de fontes diferentes vira um só.
- 🔎 **Busca** por loja, código ou desconto.
- 🏷️ **Filtros** por loja e por status (ativos, suspeitos, expirados, todos).
- 📋 **Copiar código** com um clique.
- 🖼️ **Logos das lojas** e cards com o desconto em destaque.
- ✅ **Verificação automática**: cupons que saem da fonte viram “expirados”.
- 🔄 Botão **“Atualizar agora”** para coletar na hora + worker em segundo plano.

---

## ⚠️ O que dá (e o que não dá) pra garantir
A única forma de garantir **100%** que um cupom funciona é aplicá-lo no checkout — isso o app
**não** faz. O que ele garante de forma confiável:

| Status | Confiança | Como |
|---|---|---|
| ✅ **Ativo** | alta | Cupom presente na lista da fonte agora |
| ⛔ **Expirado** | alta | Saiu da lista da fonte (acabou) ou passou da validade |
| ⚠️ **Pode ter esgotado** | média | Sinais de esgotamento — é **suspeita**, não certeza |
| ❓ **Não verificado** | baixa | Erro na coleta |

---

## 🚀 Como rodar

```bash
npm install        # instala deps + baixa o Chromium do Playwright

# Em um terminal: coleta os cupons (uma vez + a cada 30 min)
npm run worker

# Em outro terminal: sobe o site
npm run dev        # abre em http://localhost:3000
```

Dica: na primeira vez, clique em **“Atualizar agora”** no site para popular os cupons
(ou rode `npm run collect` para uma coleta única no terminal).

---

## 🧱 Arquitetura

```
src/
  app/                       # Next.js (App Router)
    page.tsx                 #   dashboard (busca, filtros, grade)
    layout.tsx, globals.css
    api/
      coupons/route.ts       #   GET cupons (busca/filtro) + stats
      collect/route.ts       #   POST dispara coleta sob demanda
  components/
    CouponCard.tsx           #   card com desconto, código e copiar
    StatusBadge.tsx          #   badge ativo/expirado/suspeito
    StoreLogo.tsx            #   logo da loja
  lib/                       # MOTOR (reutilizável; sem React)
    types.ts, config.ts, logger.ts
    store.ts                 #   armazenamento JSON + verificação por staleness
    browser.ts               #   Playwright (Chromium)
    collector.ts             #   orquestra coleta + expiração
    providers/
      cuponomia.ts           #   raspador do agregador (código + %)
      telegram.ts            #   raspa canais públicos (t.me/s/<canal>)
      index.ts               #   reúne todas as fontes (allSources)
  scripts/
    worker.ts                #   coleta periódica (cron)
    collect-once.ts          #   coleta única (debug)
```

### Trocar a fonte / adicionar APIs oficiais
Os cupons vêm de um agregador (Cuponomia) via `src/lib/providers/cuponomia.ts`. Quando quiser
migrar para as **APIs oficiais de afiliados** (gratuitas: Amazon PA-API, Mercado Livre, Shopee
Affiliate), basta criar um novo provider e mapeá-lo em `providers/index.ts` — a UI não muda.

### Manutenção do scraping
Os seletores em `cuponomia.ts` podem precisar de ajuste quando o site mudar o HTML. Rode
`npm run collect` com `HEADLESS=false` no `.env` para ver o navegador.

---

## 👤 Autor
Desenvolvido por **Kawã Crispim de Oliveira** (Kawã Oliveira).
