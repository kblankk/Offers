import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "Cupom Radar — cupons verificados de ML, Amazon e Shopee",
  description:
    "Descubra, busque e verifique cupons reais (codigo + %) do Mercado Livre, Amazon e Shopee. Multiplas fontes (Cuponomia + Telegram), atualizacao automatica.",
};

// Evita "flash" de tema errado: aplica o tema salvo antes do React hidratar.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t? t==='dark' : true;document.documentElement.classList.toggle('dark', d);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
