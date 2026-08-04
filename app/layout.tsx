import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "Allie's Finance",
  description: "기업 분석과 포트폴리오 인사이트"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans bg-paper text-ink antialiased">
        <div className="max-w-4xl mx-auto px-5">
          <header className="flex items-center justify-between py-5 border-b border-line">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="relative w-9 h-9 rounded-full overflow-hidden border border-line bg-white flex-shrink-0">
                <Image
                  src="/hinsak.jpg"
                  alt="흰색이"
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </span>
              <span className="font-medium text-[17px]">Allie's Finance</span>
            </Link>
            <nav className="text-sm text-neutral-600">
              <Link href="/about" className="hover:text-ink transition-colors">
                About
              </Link>
            </nav>
          </header>
          <main className="py-8">{children}</main>
          <footer className="py-10 text-center text-xs text-muted border-t border-line mt-10">
            © {new Date().getFullYear()} Allie's Finance
          </footer>
        </div>
      </body>
    </html>
  );
}
