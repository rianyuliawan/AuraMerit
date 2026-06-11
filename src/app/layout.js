import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata = {
  title: "AURA Merit - Web3 ASN Meritocracy Protocol",
  description:
    "AURA Merit (Aparatur Unified Records & Accountability) adalah protokol penilaian kinerja ASN terdesentralisasi berbasis blockchain Ethereum.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
