import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/debate/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DebateIA — Faça suas IAs debaterem entre si",
  description:
    "Monte um painel de debate com várias IAs e uma IA Chefe que avalia todas as respostas e sintetiza a resposta final. 100% no navegador, sem API, sem cadastro.",
  keywords: ["IA", "debate", "ChatGPT", "Claude", "Gemini", "DeepSeek", "comparar IAs", "síntese"],
  authors: [{ name: "João Vitor Alves Rodrigues" }],
  openGraph: {
    title: "DebateIA — Faça suas IAs debaterem entre si",
    description:
      "Várias IAs debatem entre si em rodadas e uma IA Chefe sintetiza a resposta final. Sem API, direto no navegador.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary",
    title: "DebateIA",
    description: "Várias IAs debatem entre si e uma IA Chefe sintetiza a resposta final.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
