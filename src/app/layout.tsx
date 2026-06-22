import type { Metadata } from "next";
import { Hanken_Grotesk, Bricolage_Grotesque, Space_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { PageFrame } from "@/components/PageFrame";

// Tipografia com caráter (skill frontend-design: fugir de Inter/Roboto/system):
//  - Bricolage Grotesque: display editorial, com personalidade (manchetes, descontos)
//  - Hanken Grotesk: corpo humanista, quente, legível
//  - Space Mono: o "recibo" — códigos, rótulos, carimbos
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono-r", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AllCupom — cupons verificados de Mercado Livre, Amazon e Shopee",
    template: "%s",
  },
  description:
    "Encontre cupons reais (código + %) de Mercado Livre, Amazon e Shopee. Status verificado, fontes citadas e atualização automática.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "AllCupom — cupons verificados de Mercado Livre, Amazon e Shopee",
    description: "Cupons reais (código + %) testados e atualizados o tempo todo. Veja os que realmente funcionam.",
    url: SITE_URL,
    siteName: "AllCupom",
    type: "website",
    images: ["/header.jpg"],
    locale: "pt_BR",
  },
};

// Tema padrao: ESCURO (pegada neon). Respeita a escolha salva, sem flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light')document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">
        <PageFrame />
        {children}
      </body>
    </html>
  );
}
