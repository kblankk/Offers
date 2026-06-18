import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, statSync } from "node:fs";
import { config } from "./config";
import { createLogger } from "./logger";
import { normalizeText, PRODUCT_NOUNS } from "./parse";
import type { Coupon, CouponStatus, RawCoupon, Store, VerificationResult } from "./types";

const log = createLogger("store");

/**
 * Armazenamento em arquivo JSON (gratuito, sem compilacao nativa).
 * O volume de cupons (centenas) cabe em memoria; persistimos de forma atomica.
 */
mkdirSync(dirname(config.dbPath), { recursive: true });

const data = new Map<string, Coupon>();
let lastMtimeMs = 0;

function load(): void {
  if (!existsSync(config.dbPath)) return;
  try {
    const arr = JSON.parse(readFileSync(config.dbPath, "utf8")) as Coupon[];
    data.clear();
    for (const c of arr) data.set(c.id, c);
    lastMtimeMs = statSync(config.dbPath).mtimeMs;
    log.info(`Carregados ${data.size} cupons de ${config.dbPath}`);
  } catch (err) {
    log.warn(`Nao foi possivel carregar o banco (${(err as Error).message}). Comecando vazio.`);
  }
}

/**
 * Recarrega do disco se o arquivo mudou (ex.: o worker, em outro processo,
 * coletou novos cupons). Chamado antes de cada leitura.
 */
function reloadIfChanged(): void {
  if (!existsSync(config.dbPath)) return;
  try {
    const mtime = statSync(config.dbPath).mtimeMs;
    if (mtime > lastMtimeMs) load();
  } catch {
    /* ignora */
  }
}

let saveQueued = false;
function persist(): void {
  if (saveQueued) return;
  saveQueued = true;
  queueMicrotask(() => {
    saveQueued = false;
    const tmp = `${config.dbPath}.tmp`;
    try {
      writeFileSync(tmp, JSON.stringify([...data.values()], null, 2), "utf8");
      renameSync(tmp, config.dbPath);
    } catch (err) {
      log.error(`Falha ao salvar banco: ${(err as Error).message}`);
    }
  });
}

load();

/**
 * Chave estavel. Quando ha codigo, deduplica por loja+codigo (mesmo cupom de
 * fontes diferentes vira um so). Sem codigo (oferta), usa a URL.
 */
export function couponId(store: Store, code: string | null, url: string): string {
  const basis = code ? `${store}|code|${code.toUpperCase()}` : `${store}|url|${url}`;
  return createHash("sha1").update(basis).digest("hex").slice(0, 16);
}

/**
 * Confianca de que o cupom funciona, a partir dos sinais da fonte:
 * "verificado hoje" + muita gente usando hoje = alta; verificado ha mais tempo
 * ou pouco uso = media; sem qualquer sinal = baixa.
 */
function confidenceFrom(raw: RawCoupon): { confidence: Coupon["confidence"]; reason: string } {
  // Cupons recem-postados em canais de cupom sao um sinal forte (alguem acabou
  // de compartilhar como funcional) — tratamos como alta confianca/fresco.
  if (raw.source?.startsWith("telegram:")) {
    return { confidence: "high", reason: `Recém-postado no Telegram @${raw.source.slice(9)}` };
  }
  const verifiedToday = /hoje/i.test(raw.verifiedText ?? "");
  const uses = raw.usesToday ?? 0;
  if (verifiedToday && uses >= 50) {
    return { confidence: "high", reason: `Verificado hoje · ${uses} usaram hoje` };
  }
  if (verifiedToday || uses >= 50) {
    return { confidence: "high", reason: raw.verifiedText ?? `${uses} usaram hoje` };
  }
  if (raw.verifiedText || uses > 0) {
    return { confidence: "medium", reason: raw.verifiedText ?? `${uses} usaram hoje` };
  }
  return { confidence: "low", reason: "Sem verificacao recente na fonte" };
}

export function upsertCoupon(raw: RawCoupon): { coupon: Coupon; isNew: boolean } {
  const id = couponId(raw.store, raw.code, raw.url);
  const now = new Date().toISOString();
  const existing = data.get(id);

  const { confidence, reason } = confidenceFrom(raw);
  const today = now.slice(0, 10);
  // So consideramos "usados hoje" quando a fonte REALMENTE informa esse numero
  // (Cuponomia). Fontes sem esse dado (Telegram) nao devem zerar o contador.
  const hasUses = typeof raw.usesToday === "number";

  if (existing) {
    const sameDay = existing.usesDate === today;
    const prevPeak = sameDay ? existing.usesPeak ?? 0 : 0;
    const uses = hasUses ? (raw.usesToday as number) : (sameDay ? existing.usesToday ?? 0 : 0);
    const peak = Math.max(prevPeak, uses);

    // Queda significativa no mesmo dia (o contador so deveria crescer) => sinal
    // forte de esgotamento. So avaliamos quando a fonte informou os usos.
    const draining = hasUses && sameDay && prevPeak >= 20 && uses < prevPeak * 0.5;

    // O Cuponomia e a fonte CANONICA para os campos descritivos (titulo, escopo,
    // condicoes). Um post do Telegram NAO deve sobrescrever esses campos de um
    // codigo generico (senao um codigo de site herda o titulo de um produto
    // especifico do post). Telegram so "promove" um codigo novo ou atualiza
    // quando ja era a propria fonte.
    const incomingCuponomia = raw.source === "cuponomia";
    const existingCuponomia = existing.source === "cuponomia";
    const useIncomingDesc = incomingCuponomia || !existingCuponomia;

    const updated: Coupon = {
      ...existing,
      title: useIncomingDesc ? raw.title : existing.title,
      description: useIncomingDesc ? raw.description ?? existing.description : existing.description,
      discountText: useIncomingDesc ? raw.discountText ?? existing.discountText : existing.discountText,
      imageUrl: useIncomingDesc ? raw.imageUrl ?? existing.imageUrl : existing.imageUrl,
      verifiedText: raw.verifiedText ?? existing.verifiedText,
      usesToday: hasUses || sameDay ? uses : existing.usesToday,
      usesPeak: Math.max(peak, existing.usesPeak ?? 0),
      usesDate: hasUses ? today : existing.usesDate,
      exclusive: raw.exclusive ?? existing.exclusive,
      minPurchase: useIncomingDesc ? raw.minPurchase ?? existing.minPurchase : existing.minPurchase,
      scope: useIncomingDesc ? raw.scope ?? existing.scope : existing.scope,
      scopeGeneral: useIncomingDesc ? raw.scopeGeneral ?? existing.scopeGeneral : existing.scopeGeneral,
      source: useIncomingDesc ? raw.source : existing.source,
      kind: raw.kind,
      expiresAt: raw.expiresAt ?? existing.expiresAt,
      status: draining ? "suspected_exhausted" : "active",
      confidence: draining ? "medium" : confidence,
      statusReason: draining
        ? `Uso caiu de ${prevPeak} para ${uses} hoje — pode estar acabando.`
        : reason,
      lastSeenAt: now,
      lastCheckedAt: now,
    };
    data.set(id, updated);
    persist();
    return { coupon: updated, isNew: false };
  }

  const coupon: Coupon = {
    id,
    store: raw.store,
    kind: raw.kind,
    code: raw.code,
    title: raw.title,
    description: raw.description,
    url: raw.url,
    discountText: raw.discountText,
    imageUrl: raw.imageUrl,
    verifiedText: raw.verifiedText,
    usesToday: raw.usesToday ?? 0,
    usesPeak: raw.usesToday ?? 0,
    usesDate: today,
    exclusive: raw.exclusive,
    minPurchase: raw.minPurchase,
    scope: raw.scope,
    scopeGeneral: raw.scopeGeneral,
    source: raw.source,
    expiresAt: raw.expiresAt ?? null,
    status: "active",
    confidence,
    statusReason: reason,
    firstSeenAt: now,
    lastSeenAt: now,
    lastCheckedAt: now,
  };
  data.set(id, coupon);
  persist();
  return { coupon, isNew: true };
}

export function applyVerification(id: string, result: VerificationResult): void {
  const c = data.get(id);
  if (!c) return;
  const now = new Date().toISOString();
  data.set(id, {
    ...c,
    status: result.status,
    confidence: result.confidence,
    statusReason: result.reason,
    expiresAt: result.expiresAt ?? c.expiresAt,
    lastCheckedAt: now,
    lastSeenAt: result.status === "active" ? now : c.lastSeenAt,
  });
  persist();
}

/**
 * Marca como expirados os cupons nao vistos em NENHUMA fonte ha mais de
 * `maxAgeMs`. Funciona de forma uniforme para todas as fontes (Cuponomia,
 * Telegram, etc.), ja que cada uma tem seu proprio ritmo de aparicao.
 */
export function expireUnseen(maxAgeMs: number): number {
  let n = 0;
  const now = Date.now();
  const nowIso = new Date().toISOString();
  for (const c of data.values()) {
    if (c.status === "expired") continue;
    if (now - new Date(c.lastSeenAt).getTime() > maxAgeMs) {
      data.set(c.id, {
        ...c,
        status: "expired",
        confidence: "high",
        statusReason: "Nao aparece em nenhuma fonte ha um tempo (provavelmente expirou).",
        lastCheckedAt: nowIso,
      });
      n++;
    }
  }
  if (n) persist();
  return n;
}

export function getCoupon(id: string): Coupon | undefined {
  return data.get(id);
}

export interface ListFilter {
  store?: Store;
  status?: CouponStatus;
  search?: string;
  /** Se true, retorna so cupons de alta confianca (verificados hoje / muito usados). */
  trustedOnly?: boolean;
  limit?: number;
}

export function listCoupons(filter: ListFilter = {}): Coupon[] {
  reloadIfChanged();
  let items = [...data.values()];
  // Rede de seguranca: esconde deals de produto (preco "Por R$ ..." em vez de
  // um desconto), e cupons do Telegram cujo titulo e um produto concreto
  // (ex.: furadeira/TV) mesmo que tenham sido coletados antes do filtro.
  items = items.filter(
    (c) =>
      !/^por\b/i.test(c.discountText ?? "") &&
      !((c.source ?? "").startsWith("telegram") && PRODUCT_NOUNS.test(normalizeText(c.title))),
  );
  if (filter.store) items = items.filter((c) => c.store === filter.store);
  if (filter.status) items = items.filter((c) => c.status === filter.status);
  if (filter.trustedOnly) items = items.filter((c) => c.confidence === "high");
  if (filter.search) {
    const q = filter.search.toLowerCase();
    items = items.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.code ?? "").toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        (c.discountText ?? "").toLowerCase().includes(q),
    );
  }
  // Ordena por: status (ativo > suspeito > expirado), depois confianca,
  // depois quem mais usou hoje (sinal de que funciona), depois mais recente.
  const statusRank = (c: Coupon) =>
    c.status === "active" ? 0 : c.status === "suspected_exhausted" ? 1 : c.status === "unknown" ? 2 : 3;
  const confRank = (c: Coupon) => (c.confidence === "high" ? 0 : c.confidence === "medium" ? 1 : 2);
  items.sort((a, b) => {
    // 1) ativos primeiro; 2) com certeza de funcionamento (alta confianca);
    // 3) NOVOS primeiro (descobertos mais recentemente); 4) mais usados; 5) visto recente.
    if (statusRank(a) !== statusRank(b)) return statusRank(a) - statusRank(b);
    if (confRank(a) !== confRank(b)) return confRank(a) - confRank(b);
    if (a.firstSeenAt !== b.firstSeenAt) return b.firstSeenAt.localeCompare(a.firstSeenAt);
    if ((b.usesToday ?? 0) !== (a.usesToday ?? 0)) return (b.usesToday ?? 0) - (a.usesToday ?? 0);
    return b.lastSeenAt.localeCompare(a.lastSeenAt);
  });
  return filter.limit ? items.slice(0, filter.limit) : items;
}

export function couponsToVerify(limit = 100): Coupon[] {
  return [...data.values()]
    .filter((c) => c.status !== "expired")
    .sort((a, b) => a.lastCheckedAt.localeCompare(b.lastCheckedAt))
    .slice(0, limit);
}

/** Momento da coleta/verificacao mais recente (ISO) ou null se vazio. */
export function lastUpdatedAt(): string | null {
  reloadIfChanged();
  let max: string | null = null;
  for (const c of data.values()) {
    if (!max || c.lastCheckedAt > max) max = c.lastCheckedAt;
  }
  return max;
}

/** True se os dados estao mais velhos que `maxAgeMs` (ou vazios). */
export function isStale(maxAgeMs: number): boolean {
  const last = lastUpdatedAt();
  if (!last) return true;
  return Date.now() - new Date(last).getTime() > maxAgeMs;
}

export function stats(): Record<string, number> {
  reloadIfChanged();
  const out: Record<string, number> = { total: 0, active: 0, expired: 0, suspected_exhausted: 0, unknown: 0 };
  for (const c of data.values()) {
    out[c.status] = (out[c.status] ?? 0) + 1;
    out.total = (out.total ?? 0) + 1;
  }
  return out;
}
