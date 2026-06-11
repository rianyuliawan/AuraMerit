"use client";

import {
  History,
  Award,
  ShieldCheck,
  Users,
  TrendingUp,
  FileText,
  Wallet,
  ChevronRight,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";

function shortenAddress(value) {
  if (!value || value === "-") return "-";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function LandingPage({
  theme,
  toggleTheme,
  onEnterPortal,
  onConnectAndEnter,
  walletConnected,
  walletAddress,
  totalAsns,
  totalEvents,
  isLoading,
}) {
  const isDark = theme === "dark";

  const features = [
    {
      icon: <History className="h-6 w-6" />,
      color: isDark
        ? "text-violet-400 bg-violet-500/10 border-violet-500/20"
        : "text-violet-700 bg-violet-50 border-violet-200",
      title: "Audit Permanen On-Chain",
      desc: "Setiap perubahan data kepegawaian tercatat sebagai transaksi blockchain yang tidak dapat dimanipulasi.",
    },
    {
      icon: <Award className="h-6 w-6" />,
      color: isDark
        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
        : "text-amber-700 bg-amber-50 border-amber-200",
      title: "SK Terdesentralisasi",
      desc: "Surat Keputusan Kenaikan Pangkat ditandatangani kriptografis dan dapat diverifikasi siapapun tanpa perantara.",
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      color: isDark
        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        : "text-emerald-700 bg-emerald-50 border-emerald-200",
      title: "Evaluasi Objektif",
      desc: "Penilaian kinerja BerAKHLAK dan SKP diinput oleh Evaluator berlisensi ke smart contract secara real-time.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      color: isDark
        ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
        : "text-sky-700 bg-sky-50 border-sky-200",
      title: "Manajemen ASN Digital",
      desc: "Profil, golongan, jabatan fungsional, dan riwayat karir PNS tersimpan di ledger Ethereum yang terbuka.",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      color: isDark
        ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
        : "text-indigo-700 bg-indigo-50 border-indigo-200",
      title: "Merit-Based Promotion",
      desc: "Kenaikan pangkat berbasis akumulasi Poin Merit yang transparan, menggantikan sistem senioritas konvensional.",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      color: isDark
        ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
        : "text-rose-700 bg-rose-50 border-rose-200",
      title: "Rapor Kinerja Digital",
      desc: "ASN dapat mengakses dan mengunduh rapor kinerja resmi yang dapat diverifikasi hash on-chain-nya.",
    },
  ];

  const stats = [
    { label: "ASN Terdaftar", value: isLoading ? "—" : String(totalAsns || 0), unit: "Pegawai" },
    { label: "Transaksi On-Chain", value: isLoading ? "—" : String(totalEvents || 0), unit: "Rekaman" },
    { label: "Blockchain Network", value: "Sepolia", unit: "Ethereum" },
    { label: "Kontrak Status", value: "Live", unit: "EVM Verified" },
  ];

  return (
    <div
      className={`min-h-screen font-sans flex flex-col ${isDark ? "bg-[#060a14] text-slate-200" : "bg-slate-50 text-slate-900"
        }`}
    >
      {/* ── TOP NAV ── */}
      <nav
        className={`sticky top-0 z-40 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between ${isDark
            ? "bg-[#060a14]/80 border-slate-800/60"
            : "bg-white/80 border-slate-200 shadow-sm"
          }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              AURA Merit
            </p>
            <p
              className={`text-[9px] font-semibold tracking-wider uppercase leading-none ${isDark ? "text-slate-600" : "text-slate-500"
                }`}
            >
              Aparatur Unified Records &amp; Accountability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border cursor-pointer ${isDark
                ? "bg-slate-800/80 border-slate-700 text-amber-400 hover:text-white"
                : "bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200"
              }`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={onEnterPortal}
            className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border cursor-pointer ${isDark
                ? "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-violet-500 hover:text-violet-300"
                : "bg-white border-slate-300 text-slate-700 hover:border-violet-400 hover:text-violet-700"
              }`}
          >
            <span>Masuk Portal</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onConnectAndEnter}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/25 cursor-pointer"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {walletConnected ? shortenAddress(walletAddress) : "Hubungkan Wallet"}
            </span>
            <span className="sm:hidden">Connect</span>
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-36 overflow-hidden">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full blur-3xl opacity-[0.15] ${isDark ? "bg-violet-600" : "bg-violet-300"
              }`}
          />
          <div
            className={`absolute top-2/3 -left-48 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.08] ${isDark ? "bg-sky-600" : "bg-sky-300"
              }`}
          />
          <div
            className={`absolute top-2/3 -right-48 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.08] ${isDark ? "bg-indigo-600" : "bg-indigo-300"
              }`}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          {/* Live Badge */}

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            <span className="block bg-gradient-to-br from-violet-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent pb-2">
              AURA Merit
            </span>
            <span
              className={`block text-3xl sm:text-4xl md:text-5xl font-bold ${isDark ? "text-slate-200" : "text-slate-800"
                }`}
            >
              Platform Meritokrasi ASN
            </span>
            <span
              className={`block text-2xl sm:text-3xl font-semibold mt-2 ${isDark ? "text-slate-500" : "text-slate-500"
                }`}
            >
              Terdesentralisasi &amp; Transparan
            </span>
          </h1>

          <p
            className={`max-w-2xl mx-auto text-base sm:text-lg leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"
              }`}
          >
            Sistem penilaian kinerja Aparatur Sipil Negara yang dibangun di atas{" "}
            <strong className={isDark ? "text-slate-200" : "text-slate-800"}>
              blockchain Ethereum
            </strong>{" "}
            &mdash; objektif, immutable, dan dapat diverifikasi secara independen
            oleh siapapun.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onConnectAndEnter}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xl shadow-violet-500/30 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Wallet className="h-4 w-4" />
              <span>
                {walletConnected
                  ? `Portal sebagai ${shortenAddress(walletAddress)}`
                  : "Hubungkan MetaMask"}
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={onEnterPortal}
              className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-sm font-bold border cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${isDark
                  ? "border-slate-700 text-slate-300 hover:border-violet-500 hover:text-violet-300 bg-slate-800/40"
                  : "border-slate-300 text-slate-700 hover:border-violet-400 hover:text-violet-700 bg-white"
                }`}
            >
              <span>Lihat Portal (Tanpa Wallet)</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── LIVE STATS BAR ── */}
      <section
        className={`border-y py-10 px-6 ${isDark
            ? "border-slate-800/60 bg-slate-900/20"
            : "border-slate-200 bg-white"
          }`}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center space-y-1">
              <p
                className={`text-3xl sm:text-4xl font-extrabold tabular-nums ${isDark ? "text-white" : "text-slate-900"
                  }`}
              >
                {s.value}
              </p>
              <p
                className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-500"
                  }`}
              >
                {s.label}
              </p>
              <p
                className={`text-xs font-semibold ${isDark ? "text-violet-400" : "text-violet-600"
                  }`}
              >
                {s.unit}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="px-6 py-20 max-w-6xl mx-auto w-full">
        <div className="text-center mb-14 space-y-3">
          <p
            className={`text-xs font-bold tracking-widest uppercase ${isDark ? "text-violet-400" : "text-violet-600"
              }`}
          >
            Fitur Unggulan
          </p>
          <h2
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"
              }`}
          >
            Ekosistem Kepegawaian yang Lebih Adil
          </h2>
          <p
            className={`max-w-xl mx-auto text-sm leading-relaxed ${isDark ? "text-slate-500" : "text-slate-600"
              }`}
          >
            AURA Merit mengintegrasikan teknologi smart contract untuk memastikan
            setiap keputusan kepegawaian dapat diverifikasi secara independen.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className={`p-6 rounded-2xl border ${isDark
                  ? "bg-slate-900/40 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/70"
                  : "bg-white border-slate-200 hover:border-violet-200 hover:shadow-lg"
                }`}
            >
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center border mb-4 ${f.color}`}
              >
                {f.icon}
              </div>
              <h3
                className={`font-bold text-sm mb-2 ${isDark ? "text-slate-100" : "text-slate-900"
                  }`}
              >
                {f.title}
              </h3>
              <p
                className={`text-xs leading-relaxed ${isDark ? "text-slate-500" : "text-slate-600"
                  }`}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div
            className={`relative rounded-3xl p-10 sm:p-14 overflow-hidden text-center ${isDark
                ? "bg-gradient-to-br from-violet-900/30 via-indigo-900/20 to-slate-900/50 border border-violet-500/20"
                : "bg-gradient-to-br from-violet-50 via-indigo-50 to-white border border-violet-200"
              }`}
          >
            <div className="pointer-events-none absolute inset-0">
              <div
                className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl ${isDark ? "bg-violet-700/20" : "bg-violet-200/80"
                  }`}
              />
              <div
                className={`absolute -bottom-20 -left-20 w-56 h-56 rounded-full blur-3xl ${isDark ? "bg-indigo-700/20" : "bg-indigo-200/80"
                  }`}
              />
            </div>
            <div className="relative z-10 space-y-6">
              <h2
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"
                  }`}
              >
                Siap Memasuki Era<br />Meritokrasi Digital?
              </h2>
              <p
                className={`text-sm max-w-lg mx-auto leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"
                  }`}
              >
                Hubungkan dompet MetaMask Anda dan mulai kelola data kepegawaian
                dengan transparansi penuh berbasis Ethereum blockchain.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onConnectAndEnter}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/30 cursor-pointer hover:scale-[1.02]"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Mulai Sekarang</span>
                </button>
                <button
                  onClick={onEnterPortal}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold border cursor-pointer hover:scale-[1.02] ${isDark
                      ? "border-slate-700 text-slate-300 hover:border-violet-500"
                      : "border-slate-300 text-slate-700 bg-white hover:border-violet-400"
                    }`}
                >
                  <span>Eksplorasi Tanpa Wallet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className={`border-t px-6 py-8 ${isDark ? "border-slate-800/60" : "border-slate-200"
          }`}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <span
              className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-600"
                }`}
            >
              AURA Merit &copy; {new Date().getFullYear()}
            </span>
          </div>
          <p
            className={`text-[10px] font-mono ${isDark ? "text-slate-600" : "text-slate-400"
              }`}
          >
            Badan Kepegawaian Negara &bull; Ethereum EVM &bull; Open Source
          </p>
        </div>
      </footer>
    </div>
  );
}
