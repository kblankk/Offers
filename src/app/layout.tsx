import type { Metadata } from "next";
import { Inter, Archivo } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Archivo({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "AllCupom — cupons verificados de Mercado Livre, Amazon e Shopee",
  description:
    "Encontre cupons reais (código + %) de Mercado Livre, Amazon e Shopee. Status verificado, fontes citadas e atualização automática.",
};

// Tema padrao: claro. Respeita a escolha salva, sem flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

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
