import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import { Map, MessagesSquare, Home } from "lucide-react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "WorldFair Connect",
  description: "A collaborative platform for connecting people and ideas.",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col gap-20 max-w-7xl mx-auto px-4">
              <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                  <div className="flex gap-5 items-center font-semibold">
                    <Link href={"/dashboard"} title="Home" className="flex items-center gap-1">
                      <Home size={20} />
                      <span className="sr-only">Home</span>
                    </Link>
                    <Link href="/chat" title="Chat" className="flex items-center gap-1">
                      <MessagesSquare size={20} className="text-green-500 drop-shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
                      <span className="sr-only">Chat</span>
                    </Link>
                    <Link href="https://github.com/bradwmorris/worldfair-connect" target="_blank" rel="noopener noreferrer" title="GitHub" className="flex items-center ml-3" aria-label="GitHub">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 text-foreground hover:text-green-500 transition-colors"
                      >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.263.82-.582 0-.288-.01-1.05-.015-2.06-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.803 5.624-5.475 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    </Link>
                  </div>
                  <div className="flex items-center gap-4">
                    <HeaderAuth />
                    <ThemeSwitcher />
                  </div>
                </div>
              </nav>
              <div className="flex flex-col gap-20">
                {children}
              </div>

              <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-2 py-16">
                <span>created by </span>
                <a
                  href="https://x.com/bradwmorris"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="bradwmorris on X"
                  className="underline decoration-green-500 decoration-2 underline-offset-4 hover:text-green-600 transition-colors font-medium"
                >
                  brad
                </a>
                <a
                  href="https://x.com/bradwmorris"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="bradwmorris on X"
                  className="flex items-center gap-1 underline decoration-green-500 decoration-2 underline-offset-4 hover:text-green-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 1227"
                    fill="currentColor"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    <path d="M1199.61 21.5H974.09L600.01 505.09L225.91 21.5H.39l470.13 617.5L0 1205.5h225.91l374.1-504.5l374.1 504.5h225.91l-470.52-566.5l470.11-617.5ZM900.6 1102.5l-300.59-406.1l-300.59 406.1H180.3l419.71-567.5L180.3 124.5h119.12l300.59 406.1l300.59-406.1h119.12l-419.71 567.5l419.71 567.5H900.6Z"/>
                  </svg>
                  <span className="sr-only">@bradwmorris</span>
                </a>
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
