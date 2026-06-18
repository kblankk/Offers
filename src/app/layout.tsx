import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Cupom Radar — cupons verificados de ML, Amazon e Shopee",
  description:
    "Descubra, busque e verifique cupons reais (codigo + %) do Mercado Livre, Amazon e Shopee. Saiba quais estao ativos, expirados ou esgotados.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
