"use client";

import { useDeferredValue, useEffect, useState, startTransition } from "react";
import { ethers } from "ethers";
import { createId, ROLE_LABELS } from "@/lib/local-merit-store";
import {
  ASN_MERIT_CONTRACT_ABI,
  CONTRACT_ADDRESS as ENV_CONTRACT_ADDRESS,
  SEPOLIA_RPC_URL as ENV_RPC_URL,
  START_BLOCK as ENV_START_BLOCK,
  SEPOLIA_CHAIN_ID,
} from "@/lib/asn-merit-contract";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ShieldCheck,
  ClipboardList,
  Award,
  FileText,
  History,
  Settings,
  Sun,
  Moon,
  Wallet,
  LogOut,
  Clock,
  Menu,
  X,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Printer,
  ChevronRight,
  UserCheck,
  TrendingUp,
  FileCheck,
  QrCode,
  Briefcase,
  Building,
  PenTool
} from "lucide-react";
import LandingPage from "./landing-page";

const tabLabels = {
  dashboard: "Ringkasan AURA",
  asns: "Daftar Pegawai ASN",
  register: "Registrasi ASN Baru",
  evaluators: "Otoritas Penilai",
  performance: "Input Penilaian",
  promotion: "SK Kenaikan Pangkat",
  rapor: "Rapor Kinerja Saya",
  audit: "Jejak Audit Web3",
};

const tabIcons = {
  dashboard: <LayoutDashboard className="h-4 w-4 shrink-0" />,
  asns: <Users className="h-4 w-4 shrink-0" />,
  register: <UserPlus className="h-4 w-4 shrink-0" />,
  evaluators: <ShieldCheck className="h-4 w-4 shrink-0" />,
  performance: <ClipboardList className="h-4 w-4 shrink-0" />,
  promotion: <Award className="h-4 w-4 shrink-0" />,
  rapor: <UserCheck className="h-4 w-4 shrink-0" />,
  audit: <History className="h-4 w-4 shrink-0" />,
};

const ranksList = [
  { name: "Penata Muda", golongan: "III/a", points: 0 },
  { name: "Penata Muda Tk. I", golongan: "III/b", points: 200 },
  { name: "Penata", golongan: "III/c", points: 400 },
  { name: "Penata Tk. I", golongan: "III/d", points: 600 },
  { name: "Pembina", golongan: "IV/a", points: 800 },
  { name: "Pembina Tk. I", golongan: "IV/b", points: 1000 },
  { name: "Pembina Utama Muda", golongan: "IV/c", points: 1200 },
  { name: "Pembina Utama Madya", golongan: "IV/d", points: 1400 },
  { name: "Pembina Utama", golongan: "IV/e", points: 1600 },
];

const subcategoryLabels = {
  Utama: "Kinerja Utama (SKP)",
  Tambahan: "Kinerja Tambahan",
  Pelayanan: "Berorientasi Pelayanan",
  Akuntabel: "Akuntabel",
  Kompeten: "Kompeten",
  Harmonis: "Harmonis",
  Loyal: "Loyal",
  Adaptif: "Adaptif",
  Kolaboratif: "Kolaboratif",
  Inovasi: "Inovasi Kerja",
  Prestasi: "Penghargaan Resmi",
  Diklat: "Sertifikasi & Diklat",
  Umum: "Penilaian Umum",
};

const emptyAsnForm = {
  nama: "",
  nip: "",
  jabatanFungsional: "Pranata Komputer Ahli Pertama",
  instansi: "Dinas Komunikasi dan Informatika",
  golongan: "III/a",
  wallet: "",
};

const emptyEvaluatorForm = {
  name: "",
  email: "",
  unit: "",
  wallet: "",
};

const emptyPerformanceForm = {
  asnId: "",
  category: "SKP",
  subcategory: "Utama",
  points: "",
  note: "",
};

const emptyPromotionForm = {
  asnId: "",
  newRole: "",
  requiredPoints: "",
};

function shortenAddress(value) {
  if (!value || value === "-") return "-";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function getNetworkName(id) {
  if (Number(id) === 11155111) return "Sepolia Testnet";
  if (Number(id) === 84532) return "Base Sepolia Testnet";
  return `Chain ID ${id}`;
}

// Parse structured jabatan string
// Pattern: [Fungsional] Pangkat (Golongan Ruang) @ Instansi
function parseJabatan(jabStr) {
  const result = {
    fungsional: "Pelaksana Umum",
    golongan: "III/a",
    pangkat: "Penata Muda",
    instansi: "Pemerintah Daerah",
    raw: jabStr || "",
  };

  if (!jabStr) return result;

  const fungsionalMatch = jabStr.match(/^\[(.*?)\]/);
  if (fungsionalMatch) {
    result.fungsional = fungsionalMatch[1];
  } else {
    const parts = jabStr.split(" (Golongan");
    if (parts.length > 0 && parts[0].trim()) {
      result.fungsional = parts[0].trim();
    }
  }

  const instansiMatch = jabStr.match(/@\s*(.*?)$/);
  if (instansiMatch) {
    result.instansi = instansiMatch[1];
  }

  const cleanJab = jabStr.toLowerCase();
  for (let i = ranksList.length - 1; i >= 0; i--) {
    const r = ranksList[i];
    if (cleanJab.includes(r.golongan.toLowerCase()) || cleanJab.includes(r.name.toLowerCase())) {
      result.golongan = r.golongan;
      result.pangkat = r.name;
      break;
    }
  }

  return result;
}

// Dynamic Rank Calculator Helper
function getAsnRankInfo(jabatan, points) {
  const details = parseJabatan(jabatan);
  const cleanGol = details.golongan.toLowerCase();

  for (let i = ranksList.length - 1; i >= 0; i--) {
    const r = ranksList[i];
    if (cleanGol === r.golongan.toLowerCase()) {
      return { current: r, next: ranksList[i + 1] || null, index: i };
    }
  }

  // Fallback berdasarkan akumulasi poin
  let activeIdx = 0;
  for (let i = 0; i < ranksList.length; i++) {
    if (points >= ranksList[i].points) {
      activeIdx = i;
    }
  }
  return { current: ranksList[activeIdx], next: ranksList[activeIdx + 1] || null, index: activeIdx };
}

// Parse Category and Note from reasons
function parseNoteContent(rawNote) {
  let category = "SKP";
  let subcategory = "Utama";
  let cleanNote = rawNote || "";

  const match = cleanNote.match(/^\[([a-zA-Z0-9]+)-(.*?)\]/);
  if (match) {
    category = match[1];
    subcategory = match[2];
    cleanNote = cleanNote.slice(match[0].length).trim();
  } else if (cleanNote.startsWith("[SKP]")) {
    category = "SKP";
    subcategory = "Utama";
    cleanNote = cleanNote.slice(5).trim();
  } else if (cleanNote.startsWith("[Perilaku]")) {
    category = "Perilaku";
    subcategory = "Umum";
    cleanNote = cleanNote.slice(10).trim();
  } else if (cleanNote.startsWith("[Inovasi]")) {
    category = "Inovasi";
    subcategory = "Umum";
    cleanNote = cleanNote.slice(9).trim();
  }

  return { category, subcategory, note: cleanNote };
}

export default function MeritSystemApp() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState("landing"); // "landing" | "portal"
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState("dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [time, setTime] = useState("");

  const [query, setQuery] = useState("");
  const [filterGolongan, setFilterGolongan] = useState("");
  const [filterInstansi, setFilterInstansi] = useState("");

  const deferredQuery = useDeferredValue(query);

  // Forms
  const [asnForm, setAsnForm] = useState(emptyAsnForm);
  const [evaluatorForm, setEvaluatorForm] = useState(emptyEvaluatorForm);
  const [performanceForm, setPerformanceForm] = useState(emptyPerformanceForm);
  const [promotionForm, setPromotionForm] = useState(emptyPromotionForm);

  // Blockchain Settings & State
  const [contractAddress, setContractAddress] = useState("");
  const [rpcUrl, setRpcUrl] = useState("");
  const [startBlock, setStartBlock] = useState(0);
  const [chainIdSetting, setChainIdSetting] = useState(SEPOLIA_CHAIN_ID);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletChainId, setWalletChainId] = useState("");
  const [bkdAdminAddress, setBkdAdminAddress] = useState("");
  const [walletIsEvaluator, setWalletIsEvaluator] = useState(false);

  // Blockchain Data
  const [blockchainAsns, setBlockchainAsns] = useState([]);
  const [blockchainEvents, setBlockchainEvents] = useState([]);
  const [isLoadingBlockchain, setIsLoadingBlockchain] = useState(false);

  // UI state
  const [notice, setNotice] = useState("");
  const [toasts, setToasts] = useState([]);
  const [busy, setBusy] = useState(false);

  // Detail Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAsnDetail, setSelectedAsnDetail] = useState(null);

  const [showSkModal, setShowSkModal] = useState(false);
  const [selectedAsnSk, setSelectedAsnSk] = useState(null);
  const [selectedSkEvent, setSelectedSkEvent] = useState(null);

  const [showPrintRaporModal, setShowPrintRaporModal] = useState(false);
  const [selectedAsnPrint, setSelectedAsnPrint] = useState(null);

  const [showDraftSkModal, setShowDraftSkModal] = useState(false);
  const [draftSkData, setDraftSkData] = useState(null);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setTime(date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Theme Sync with Body
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("asn_theme") || "dark";
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "light") {
        document.body.style.backgroundColor = "#f1f5f9";
        document.body.style.color = "#0f172a";
      } else {
        document.body.style.backgroundColor = "#060a14";
        document.body.style.color = "#e2e8f0";
      }
    }
  }, [theme]);

  // Initialize Web3 configs
  useEffect(() => {
    setMounted(true);

    const savedAddress = window.localStorage.getItem("asn_contract_address") || ENV_CONTRACT_ADDRESS;
    const savedRpc = window.localStorage.getItem("asn_rpc_url") || ENV_RPC_URL;
    const savedStartBlock = window.localStorage.getItem("asn_start_block") || ENV_START_BLOCK;
    const savedChainId = window.localStorage.getItem("asn_chain_id") || SEPOLIA_CHAIN_ID.toString();

    setContractAddress(savedAddress);
    setRpcUrl(savedRpc);
    setStartBlock(Number(savedStartBlock));
    setChainIdSetting(Number(savedChainId));

    const wasDisconnected = window.localStorage.getItem("asn_wallet_disconnected") === "true";
    if (!wasDisconnected) {
      checkMetaMaskConnection(savedAddress, savedRpc, Number(savedStartBlock));
    }
  }, []);

  // Auto switch tab when role is resolved
  useEffect(() => {
    const role = getCurrentUserRole();
    if (role === "asn") {
      setActiveTab("rapor");
    } else if (role === "bkd" || role === "evaluator" || role === "public") {
      const allowed = getTabsForRole(role);
      if (!allowed.includes(activeTab)) {
        setActiveTab("dashboard");
      }
    }
  }, [walletAddress, bkdAdminAddress, walletIsEvaluator, blockchainAsns]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    window.localStorage.setItem("asn_theme", newTheme);
  };

  // Toast Management
  const addToast = (title, message, type = "info", txHash = "") => {
    const id = createId("toast");
    setToasts((prev) => [...prev, { id, title, message, type, txHash }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  // MetaMask & Web3 Logic
  const checkMetaMaskConnection = async (targetAddress, targetRpc, targetStartBlock) => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      const network = await provider.getNetwork();

      const currentWallet = accounts[0] || "";
      setWalletAddress(currentWallet);
      setWalletConnected(!!currentWallet);
      setWalletChainId(network.chainId.toString());

      if (targetAddress) {
        if (currentWallet) {
          await readContractPermissions(currentWallet, targetAddress, provider);
        }
        await fetchBlockchainData(targetAddress, targetRpc, targetStartBlock ?? startBlock);
      }
    } catch (err) {
      console.error("MetaMask connection check error:", err);
    }
  };

  const readContractPermissions = async (wallet, targetAddress, provider) => {
    if (!targetAddress || !ethers.isAddress(targetAddress)) return;
    try {
      const contract = new ethers.Contract(targetAddress, ASN_MERIT_CONTRACT_ABI, provider);
      const admin = await contract.bkdAdmin();
      const isEval = await contract.authorizedEvaluators(wallet);
      setBkdAdminAddress(admin);
      setWalletIsEvaluator(isEval);
    } catch (err) {
      console.error("Failed to read permissions from contract:", err);
    }
  };

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      addToast("MetaMask Tidak Ditemukan", "Instal ekstensi MetaMask di browser untuk menggunakan mode blockchain.", "error");
      return;
    }

    try {
      setBusy(true);
      window.localStorage.removeItem("asn_wallet_disconnected");
      const provider = new ethers.BrowserProvider(window.ethereum);

      try {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (permErr) {
        console.warn("Permission request bypassed/rejected:", permErr);
      }

      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();

      const currentWallet = accounts[0];
      setWalletAddress(currentWallet);
      setWalletConnected(true);
      setWalletChainId(network.chainId.toString());

      addToast("Wallet Terhubung", `Berhasil terkoneksi ke ${shortenAddress(currentWallet)}`, "success");

      if (network.chainId !== BigInt(chainIdSetting)) {
        addToast("Salah Jaringan", `Harap ubah jaringan MetaMask Anda ke ${getNetworkName(chainIdSetting)}.`, "warning");
      }

      if (contractAddress) {
        await readContractPermissions(currentWallet, contractAddress, provider);
        await fetchBlockchainData(contractAddress, rpcUrl, startBlock);
      }
    } catch (err) {
      addToast("Koneksi Gagal", err.message || "MetaMask menolak permintaan koneksi.", "error");
    } finally {
      setBusy(false);
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress("");
    setBkdAdminAddress("");
    setWalletIsEvaluator(false);
    window.localStorage.setItem("asn_wallet_disconnected", "true");
    addToast("Wallet Terputus", "Koneksi ke wallet dihentikan secara lokal.", "info");
  };

  const switchNetwork = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const chainIdHex = `0x${Number(chainIdSetting).toString(16)}`;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
      addToast("Jaringan Diubah", `Berhasil beralih ke ${getNetworkName(chainIdSetting)}.`, "success");
    } catch (err) {
      if (err.code === 4902 || err.code === -32603) {
        let addParams = null;
        if (Number(chainIdSetting) === 11155111) {
          addParams = {
            chainId: chainIdHex,
            chainName: "Sepolia Testnet",
            nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          };
        } else if (Number(chainIdSetting) === 84532) {
          addParams = {
            chainId: chainIdHex,
            chainName: "Base Sepolia Testnet",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://sepolia.base.org"],
            blockExplorerUrls: ["https://sepolia.basescan.org"],
          };
        }

        if (addParams) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [addParams],
            });
            addToast("Jaringan Ditambahkan", "Berhasil menambahkan jaringan baru.", "success");
          } catch (addError) {
            addToast("Gagal Menambahkan Jaringan", addError.message, "error");
          }
        } else {
          addToast("Pemberitahuan", `Harap tambahkan jaringan Chain ID ${chainIdSetting} secara manual di MetaMask Anda.`, "warning");
        }
      } else {
        addToast("Gagal Mengubah Jaringan", err.message, "error");
      }
    }
  };

  // Listen for MetaMask changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      startTransition(() => {
        const nextWallet = accounts[0] || "";
        setWalletAddress(nextWallet);
        setWalletConnected(!!nextWallet);
        if (nextWallet && contractAddress) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          readContractPermissions(nextWallet, contractAddress, provider);
        } else {
          setBkdAdminAddress("");
          setWalletIsEvaluator(false);
        }
        addToast("Akun Berubah", `Akun wallet diubah ke ${shortenAddress(nextWallet)}`, "info");
      });
    };

    const handleChainChanged = (chainIdHex) => {
      startTransition(() => {
        const nextChainId = BigInt(chainIdHex).toString();
        setWalletChainId(nextChainId);
        addToast("Jaringan Berubah", `Jaringan diubah ke Chain ID: ${nextChainId}`, "info");
        if (contractAddress) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          readContractPermissions(walletAddress, contractAddress, provider);
        }
      });
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [walletAddress, contractAddress]);

  // Index Blockchain Data
  const fetchBlockchainData = async (targetContract, targetRpc, targetStartBlock) => {
    if (!targetContract || !ethers.isAddress(targetContract)) return;
    setIsLoadingBlockchain(true);

    try {
      let provider;
      if (typeof window !== "undefined" && window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        provider = new ethers.JsonRpcProvider(targetRpc || "https://ethereum-sepolia-rpc.publicnode.com");
      }

      const contract = new ethers.Contract(targetContract, ASN_MERIT_CONTRACT_ABI, provider);

      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, targetStartBlock || latestBlock - 50000);

      const [registeredLogs, performanceLogs, promotionLogs] = await Promise.all([
        contract.queryFilter(contract.filters.ASNTerdaftar(), fromBlock, latestBlock),
        contract.queryFilter(contract.filters.PoinDitambahkan(), fromBlock, latestBlock),
        contract.queryFilter(contract.filters.PromosiJabatan(), fromBlock, latestBlock),
      ]);

      const uniqueWallets = Array.from(
        new Set(registeredLogs.map((log) => log.args.asnWallet))
      );

      const profiles = await Promise.all(
        uniqueWallets.map(async (asnWallet) => {
          try {
            const profile = await contract.dataASN(asnWallet);
            const blockInfo = registeredLogs.find((log) => log.args.asnWallet === asnWallet);

            // Calculate category breakdown from logs for this wallet
            let skpPoints = 0;
            let perilakuPoints = 0;
            let inovasiPoints = 0;

            let subcategoryPoints = {
              Utama: 0,
              Tambahan: 0,
              Pelayanan: 0,
              Akuntabel: 0,
              Kompeten: 0,
              Harmonis: 0,
              Loyal: 0,
              Adaptif: 0,
              Kolaboratif: 0,
              Inovasi: 0,
              Prestasi: 0,
              Diklat: 0,
              Umum: 0,
            };

            performanceLogs
              .filter((log) => log.args.asnWallet.toLowerCase() === asnWallet.toLowerCase())
              .forEach((log) => {
                const { category, subcategory } = parseNoteContent(log.args.alasan);
                const pts = Number(log.args.poin);
                if (category === "SKP") skpPoints += pts;
                else if (category === "Perilaku") perilakuPoints += pts;
                else if (category === "Inovasi") inovasiPoints += pts;

                if (subcategory && subcategoryPoints[subcategory] !== undefined) {
                  subcategoryPoints[subcategory] += pts;
                }
              });

            return {
              id: asnWallet,
              nama: profile.nama,
              nip: profile.nip,
              jabatan: profile.jabatan,
              meritPoint: Number(profile.meritPoint),
              isActive: profile.isActive,
              lastPromoted: profile.lastPromoted ? new Date(Number(profile.lastPromoted) * 1000).toISOString() : "",
              wallet: asnWallet,
              createdAt: blockInfo ? (await blockInfo.getBlock()).timestamp : 0,
              breakdown: { skpPoints, perilakuPoints, inovasiPoints },
              subcategoryPoints
            };
          } catch (e) {
            console.error(`Error loading profile for ${asnWallet}:`, e);
            return null;
          }
        })
      );

      const validProfiles = profiles.filter((p) => p !== null && p.isActive);
      setBlockchainAsns(validProfiles);

      const events = [
        ...registeredLogs.map((log) => ({
          id: `reg-${log.transactionHash}`,
          action: "Registrasi ASN",
          actor: "BKD Admin",
          detail: `Pegawai ASN ${log.args.nama} (${log.args.nip}) berhasil didaftarkan.`,
          wallet: log.args.asnWallet,
          txHash: log.transactionHash,
          block: log.blockNumber,
          category: "SKP",
        })),
        ...performanceLogs.map((log) => {
          const parsed = parseNoteContent(log.args.alasan);
          return {
            id: `perf-${log.transactionHash}-${log.index}`,
            action: "Kinerja Dicatat",
            actor: `Evaluator (${shortenAddress(log.args.penilai)})`,
            detail: `Menambahkan ${log.args.poin.toString()} poin: "${parsed.note}"`,
            wallet: log.args.asnWallet,
            txHash: log.transactionHash,
            block: log.blockNumber,
            category: parsed.category,
            subcategory: parsed.subcategory,
          };
        }),
        ...promotionLogs.map((log) => ({
          id: `promo-${log.transactionHash}`,
          action: "Kenaikan Pangkat",
          actor: "BKD Admin",
          detail: `Dipromosikan pangkat/jabatan ke: ${log.args.jabatanBaru}`,
          wallet: log.args.asnWallet,
          txHash: log.transactionHash,
          block: log.blockNumber,
          category: "Inovasi",
        })),
      ].sort((a, b) => b.block - a.block);

      setBlockchainEvents(events);

      const admin = await contract.bkdAdmin();
      setBkdAdminAddress(admin);
    } catch (err) {
      console.error("Error fetching blockchain logs:", err);
      addToast("Sinkronisasi Gagal", "Gagal menyinkronkan data dari Smart Contract. Periksa kembali alamat contract dan koneksi.", "error");
    } finally {
      setIsLoadingBlockchain(false);
    }
  };

  const getContractInstance = async () => {
    if (!walletConnected) throw new Error("Wallet belum terhubung");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, ASN_MERIT_CONTRACT_ABI, signer);
  };

  // Role resolution
  const getCurrentUserRole = () => {
    if (!walletConnected) return "public";
    if (walletAddress.toLowerCase() === bkdAdminAddress.toLowerCase()) return "bkd";
    if (walletIsEvaluator) return "evaluator";

    const isAsn = blockchainAsns.some((a) => a.id.toLowerCase() === walletAddress.toLowerCase());
    if (isAsn) return "asn";

    return "public";
  };

  const getCurrentUserName = () => {
    if (!walletConnected) return "Akses Publik";
    if (walletAddress.toLowerCase() === bkdAdminAddress.toLowerCase()) return "BKD Admin (On-Chain)";
    if (walletIsEvaluator) return "Evaluator (On-Chain)";

    const asnObj = blockchainAsns.find((a) => a.id.toLowerCase() === walletAddress.toLowerCase());
    if (asnObj) return `${asnObj.nama} (Pegawai ASN)`;

    return "Tamu Publik";
  };

  const getTabsForRole = (role) => {
    const tabs = {
      bkd: ["dashboard", "asns", "register", "evaluators", "promotion", "audit"],
      evaluator: ["dashboard", "asns", "performance", "audit"],
      asn: ["rapor", "asns", "audit"],
      public: ["dashboard", "asns", "audit"],
    };
    return tabs[role] || ["dashboard", "asns", "audit"];
  };

  // Actions
  const handleRegisterAsn = async (e) => {
    e.preventDefault();
    if (!asnForm.nama || !asnForm.nip || !asnForm.jabatanFungsional || !asnForm.instansi) {
      showNotice("Semua field wajib diisi.");
      return;
    }

    if (!ethers.isAddress(asnForm.wallet)) {
      addToast("Address Invalid", "Alamat wallet ASN tidak valid.", "warning");
      return;
    }

    try {
      setBusy(true);
      addToast("Mengirim Transaksi", "Menunggu konfirmasi tanda tangan MetaMask...", "info");

      const contract = await getContractInstance();
      const rank = ranksList.find((r) => r.golongan === asnForm.golongan);
      const structuredJabatan = `[${asnForm.jabatanFungsional}] ${rank.name} (Golongan ${rank.golongan}) @ ${asnForm.instansi}`;

      const tx = await contract.registrasiASN(
        asnForm.wallet,
        asnForm.nama,
        asnForm.nip,
        structuredJabatan
      );

      addToast("Transaksi Terkirim", "Transaksi sedang diproses di blockchain Sepolia.", "info", tx.hash);
      await tx.wait();

      addToast("Registrasi Sukses", `ASN ${asnForm.nama} berhasil didaftarkan di blockchain.`, "success", tx.hash);
      setAsnForm(emptyAsnForm);
      await fetchBlockchainData(contractAddress, rpcUrl, startBlock);
    } catch (err) {
      addToast("Transaksi Gagal", err.reason || err.message || "Gagal melakukan registrasi ASN.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleAddEvaluator = async (e) => {
    e.preventDefault();
    if (!ethers.isAddress(evaluatorForm.wallet)) {
      addToast("Address Invalid", "Alamat wallet Evaluator tidak valid.", "warning");
      return;
    }

    try {
      setBusy(true);
      addToast("Mengirim Transaksi", "Menunggu konfirmasi tanda tangan MetaMask...", "info");

      const contract = await getContractInstance();
      const tx = await contract.tambahPenilai(evaluatorForm.wallet);

      addToast("Transaksi Terkirim", "Menunggu konfirmasi block...", "info", tx.hash);
      await tx.wait();

      const cachedEvaluators = JSON.parse(window.localStorage.getItem(`eval_cache_${contractAddress}`) || "[]");
      const newEvaluator = {
        name: evaluatorForm.name || "Penilai On-Chain",
        email: evaluatorForm.email || "-",
        unit: evaluatorForm.unit || "Departemen Penilai",
        wallet: evaluatorForm.wallet,
        createdAt: new Date().toISOString(),
      };
      window.localStorage.setItem(`eval_cache_${contractAddress}`, JSON.stringify([newEvaluator, ...cachedEvaluators]));

      addToast("Evaluator Ditambahkan", `Wallet ${shortenAddress(evaluatorForm.wallet)} berwenang sebagai penilai.`, "success", tx.hash);
      setEvaluatorForm(emptyEvaluatorForm);
    } catch (err) {
      addToast("Transaksi Gagal", err.reason || err.message || "Gagal menambahkan evaluator.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleInputPerformance = async (e) => {
    e.preventDefault();
    const points = Number(performanceForm.points);
    if (points <= 0 || !performanceForm.note) {
      showNotice("Poin harus positif dan catatan wajib diisi.");
      return;
    }

    const targetAsn = blockchainAsns.find((a) => a.id === performanceForm.asnId);
    if (!targetAsn) {
      showNotice("Pilih ASN yang valid.");
      return;
    }

    try {
      setBusy(true);
      addToast("Mengirim Transaksi", "Menunggu konfirmasi tanda tangan MetaMask...", "info");

      const contract = await getContractInstance();
      const formattedNote = `[${performanceForm.category}-${performanceForm.subcategory}] ${performanceForm.note}`;
      const tx = await contract.inputKinerja(targetAsn.wallet, BigInt(points), formattedNote);

      addToast("Transaksi Terkirim", "Menambahkan poin merit di blockchain...", "info", tx.hash);
      await tx.wait();

      addToast("Kinerja Diinput", `Menambahkan ${points} poin merit untuk ${targetAsn.nama}.`, "success", tx.hash);
      setPerformanceForm(emptyPerformanceForm);
      await fetchBlockchainData(contractAddress, rpcUrl, startBlock);
    } catch (err) {
      addToast("Transaksi Gagal", err.reason || err.message || "Gagal melakukan input kinerja.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handlePromoteAsn = async (e) => {
    e?.preventDefault();
    const reqPoints = Number(promotionForm.requiredPoints);
    if (!promotionForm.newRole || reqPoints < 0) {
      showNotice("Jabatan baru dan syarat poin wajib diisi.");
      return;
    }

    const targetAsn = blockchainAsns.find((a) => a.id === promotionForm.asnId);
    if (!targetAsn) {
      showNotice("Pilih ASN yang valid.");
      return;
    }
    if (targetAsn.meritPoint < reqPoints) {
      addToast("Poin Tidak Cukup", `Merit point ${targetAsn.nama} (${targetAsn.meritPoint}) kurang dari syarat (${reqPoints}).`, "warning");
      return;
    }

    try {
      setBusy(true);
      setShowDraftSkModal(false);
      addToast("Mengirim Transaksi", "Menunggu konfirmasi tanda tangan MetaMask...", "info");

      const contract = await getContractInstance();
      const tx = await contract.promosiJabatan(targetAsn.wallet, promotionForm.newRole, BigInt(reqPoints));

      addToast("Transaksi Terkirim", "Memproses promosi di blockchain...", "info", tx.hash);
      await tx.wait();

      addToast("Promosi Berhasil", `ASN ${targetAsn.nama} dipromosikan menjadi ${parseJabatan(promotionForm.newRole).pangkat} (${parseJabatan(promotionForm.newRole).golongan}).`, "success", tx.hash);
      setPromotionForm(emptyPromotionForm);
      await fetchBlockchainData(contractAddress, rpcUrl, startBlock);
    } catch (err) {
      addToast("Transaksi Gagal", err.reason || err.message || "Gagal memproses promosi.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!ethers.isAddress(contractAddress)) {
      addToast("Address Invalid", "Alamat contract tidak valid.", "warning");
      return;
    }
    window.localStorage.setItem("asn_contract_address", contractAddress);
    window.localStorage.setItem("asn_rpc_url", rpcUrl);
    window.localStorage.setItem("asn_start_block", startBlock.toString());
    window.localStorage.setItem("asn_chain_id", chainIdSetting.toString());
    setShowSettingsModal(false);
    addToast("Pengaturan Disimpan", "Mencoba menghubungkan ulang ke smart contract...", "success");
    checkMetaMaskConnection(contractAddress, rpcUrl);
  };

  const handleResetSettings = () => {
    window.localStorage.removeItem("asn_contract_address");
    window.localStorage.removeItem("asn_rpc_url");
    window.localStorage.removeItem("asn_start_block");
    window.localStorage.removeItem("asn_chain_id");
    setContractAddress(ENV_CONTRACT_ADDRESS);
    setRpcUrl(ENV_RPC_URL);
    setStartBlock(Number(ENV_START_BLOCK));
    setChainIdSetting(SEPOLIA_CHAIN_ID);
    setShowSettingsModal(false);
    addToast("Pengaturan Direset", "Kembali menggunakan konfigurasi bawaan.", "info");
    checkMetaMaskConnection(ENV_CONTRACT_ADDRESS, ENV_RPC_URL);
  };

  const handleOpenSk = async (asnObj, logEvent) => {
    try {
      setSelectedAsnSk(asnObj);
      setSelectedSkEvent(logEvent);
      setShowSkModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const currentAsns = blockchainAsns;
  const currentEvents = blockchainEvents;

  const totalAsnsCount = currentAsns.length;
  const totalPoints = currentAsns.reduce((sum, asn) => sum + Number(asn.meritPoint), 0);
  const averagePoint = totalAsnsCount ? Math.round(totalPoints / totalAsnsCount) : 0;
  const eligiblePromotion = currentAsns.filter((asn) => {
    const info = getAsnRankInfo(asn.jabatan, asn.meritPoint);
    return info.next && asn.meritPoint >= info.next.points;
  }).length;
  const evaluatorsCount = typeof window !== "undefined"
    ? (JSON.parse(window.localStorage.getItem(`eval_cache_${contractAddress}`) || "[]").length || 1)
    : 1;

  // Unique instansi list for filters
  const uniqueInstansi = Array.from(new Set(blockchainAsns.map((a) => parseJabatan(a.jabatan).instansi).filter(Boolean)));

  // Filter ASNs
  const filteredAsns = blockchainAsns.filter((asn) => {
    const details = parseJabatan(asn.jabatan);
    const text = `${asn.nama} ${asn.nip} ${asn.jabatan}`.toLowerCase();

    const matchesSearch = text.includes(deferredQuery.toLowerCase());
    const matchesGolongan = !filterGolongan || details.golongan === filterGolongan;
    const matchesInstansi = !filterInstansi || details.instansi.toLowerCase() === filterInstansi.toLowerCase();

    return matchesSearch && matchesGolongan && matchesInstansi;
  });

  // Golongan distribution count
  const golonganCounts = ranksList.reduce((acc, r) => {
    acc[r.golongan] = 0;
    return acc;
  }, {});

  blockchainAsns.forEach((asn) => {
    const details = parseJabatan(asn.jabatan);
    if (golonganCounts[details.golongan] !== undefined) {
      golonganCounts[details.golongan]++;
    }
  });

  const activeUserRole = getCurrentUserRole();
  const availableTabs = getTabsForRole(activeUserRole);

  // Auto-filled promotion queue for BKD Admin
  const promotionQueue = currentAsns.filter((asn) => {
    const info = getAsnRankInfo(asn.jabatan, asn.meritPoint);
    return info.next && asn.meritPoint >= info.next.points;
  });

  // Load active ASN data if role is asn
  const activeAsnData = activeUserRole === "asn"
    ? currentAsns.find((a) => a.id.toLowerCase() === walletAddress.toLowerCase())
    : null;

  // Theme Class Resolver Map — Premium Color Palette
  const themeClasses = {
    bg: theme === "dark"
      ? "bg-[#060a14] text-slate-200"
      : "bg-slate-100 text-slate-900",
    sidebar: theme === "dark"
      ? "bg-[#0a1120]/90 border-slate-800/60"
      : "bg-white border-slate-200 shadow-md",
    header: theme === "dark"
      ? "bg-[#0a1120]/80 border-slate-800/60 text-slate-100"
      : "bg-white/90 border-slate-200 text-slate-900 shadow-md",
    card: theme === "dark"
      ? "bg-slate-900/50 border-slate-800/60"
      : "bg-white border-slate-200 shadow-sm",
    panel: theme === "dark"
      ? "bg-slate-900/30 border-slate-800/50"
      : "bg-white border-slate-200 shadow-sm",
    input: theme === "dark"
      ? "bg-[#0d1526] border-slate-700 text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-violet-500/20"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-violet-500/10",
    textPrimary: theme === "dark" ? "text-slate-100" : "text-slate-900",
    textSecondary: theme === "dark" ? "text-slate-400" : "text-slate-600",
    textMuted: theme === "dark" ? "text-slate-500" : "text-slate-500",
    border: theme === "dark" ? "border-slate-800/60" : "border-slate-200",
    divider: theme === "dark" ? "border-slate-800/50" : "border-slate-150",
    tabActive: theme === "dark"
      ? "bg-violet-500/10 text-violet-300 border-l-4 border-violet-500"
      : "bg-violet-50 text-violet-700 border-l-4 border-violet-600",
    tabInactive: theme === "dark"
      ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  };

  // === LANDING PAGE ===
  if (view === "landing") {
    return (
      <LandingPage
        theme={theme}
        toggleTheme={toggleTheme}
        onEnterPortal={() => {
          setView("portal");
          setActiveTab("dashboard");
        }}
        onConnectAndEnter={async () => {
          await connectWallet();
          setView("portal");
        }}
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        totalAsns={blockchainAsns.length}
        totalEvents={blockchainEvents.length}
        isLoading={isLoadingBlockchain}
      />
    );
  }

  return (
    <main className={`min-h-screen flex flex-col font-sans ${themeClasses.bg}`}>

      {/* HEADER NAVBAR */}
      <header className={`sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-4 ${themeClasses.header}`}>
        <div className="flex items-center gap-3 justify-between w-full sm:w-auto">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`p-2 rounded-xl border lg:hidden cursor-pointer ${theme === "dark"
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100"
                }`}
              title="Buka Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">AURA Merit</h1>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${theme === "dark" ? "bg-violet-500/10 text-violet-300 border border-violet-500/20" : "bg-violet-50 text-violet-700 border border-violet-200"}`}>
                  v2.0
                </span>
              </div>
              <p className={`text-[10px] font-semibold ${theme === "dark" ? "text-slate-500" : "text-slate-500"}`}>Aparatur Unified Records &amp; Accountability &bull; BKN</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Clock */}
          <div className={`hidden md:flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-lg border ${theme === "dark" ? "bg-slate-950/40 border-slate-900 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-650"
            }`}>
            <Clock className="h-3.5 w-3.5 text-sky-500" />
            <span>{time}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${theme === "dark"
                ? "bg-slate-900 border-slate-800 text-amber-400 hover:text-white"
                : "bg-slate-50 border-slate-200 text-indigo-600 hover:bg-slate-100"
              }`}
            title={theme === "dark" ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* DApp Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${theme === "dark"
                ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100"
              }`}
            title="Pengaturan Smart Contract"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Web3 Connect Status */}
          {walletConnected ? (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 border rounded-xl px-4 py-2 text-xs ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-250"
                }`}>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className={`font-mono ${theme === "dark" ? "text-slate-450" : "text-slate-650"}`}>{shortenAddress(walletAddress)}</span>
                <span className="hidden sm:inline-block bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/20 rounded px-1.5 text-[10px]">
                  {activeUserRole === "bkd" ? "BKD Admin" : activeUserRole === "evaluator" ? "Evaluator" : activeUserRole === "asn" ? "ASN Pegawai" : "Tamu Publik"}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className={`border text-xs px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${theme === "dark"
                    ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    : "bg-slate-50 border-slate-250 text-slate-650 hover:bg-slate-100"
                  }`}
              >
                <LogOut className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden sm:inline">Putuskan</span>
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={busy}
              className="bg-sky-600 hover:bg-sky-500 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 px-4 py-2 rounded-xl text-xs font-bold hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Wallet className="h-4 w-4" />
              <span>Hubungkan Wallet</span>
            </button>
          )}
        </div>
      </header>

      {/* BODY LAYOUT */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">

        {/* SIDEBAR NAVIGATION (Desktop) */}
        <aside className={`hidden lg:flex lg:w-64 xl:w-72 border-r p-6 flex-col gap-6 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto ${themeClasses.sidebar}`}>
          <div className={`rounded-2xl p-4 border ${theme === "dark" ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-50 border-slate-200"
            }`}>
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-extrabold text-sm ${theme === "dark" ? "bg-violet-500/15 text-violet-400" : "bg-violet-100 text-violet-700"
                }`}>
                {getCurrentUserName().charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{getCurrentUserName()}</p>
                <p className="text-[10px] text-slate-550 mt-0.5 uppercase tracking-wider font-bold">
                  Role: {ROLE_LABELS[activeUserRole] || "Pegawai ASN"}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 flex flex-col gap-1">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-3 h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab ? themeClasses.tabActive : themeClasses.tabInactive
                  }`}
              >
                {tabIcons[tab]}
                <span>{tabLabels[tab]}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* MOBILE NAVIGATION DRAWER */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden no-print">
            {/* Backdrop overlay */}
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            ></div>

            {/* Sidebar drawer content */}
            <aside className={`relative flex flex-col w-72 max-w-[80vw] h-full p-6 border-r shadow-2xl animate-slide-in-left ${theme === "dark" ? "bg-slate-900 border-slate-850 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-250 dark:border-slate-800">
                <h3 className="font-bold text-sm">Navigasi SIMPEG</h3>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                  title="Tutup Menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* User Profile Info inside drawer */}
              <div className={`rounded-xl p-3 border mt-4 ${theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-150"
                }`}>
                <p className="text-xs font-bold truncate">{getCurrentUserName()}</p>
                <p className="text-[9px] text-slate-500 uppercase mt-0.5 font-bold">
                  {ROLE_LABELS[activeUserRole] || "Pegawai ASN"}
                </p>
              </div>

              {/* Nav Links */}
              <nav className="flex-1 flex flex-col gap-1 mt-6">
                {availableTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab ? themeClasses.tabActive : themeClasses.tabInactive
                      }`}
                  >
                    {tabIcons[tab]}
                    <span>{tabLabels[tab]}</span>
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* MAIN PANEL CONTENT */}
        <section className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">

          {/* Wrong Network Banner */}
          {walletConnected && walletChainId !== chainIdSetting.toString() && (
            <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-550 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Salah Jaringan Blockchain</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    MetaMask Anda tersambung ke Chain ID {walletChainId}. DApp ini dikonfigurasi untuk {getNetworkName(chainIdSetting)} (ID {chainIdSetting}).
                  </p>
                </div>
              </div>
              <button
                onClick={switchNetwork}
                className="bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                Ubah Jaringan
              </button>
            </div>
          )}

          {/* Loading Banner for Web3 */}
          {isLoadingBlockchain && (
            <div className="mb-6 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 flex items-center gap-4 animate-pulse">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-500 dark:border-sky-400 border-t-transparent"></div>
              <p className="text-xs text-sky-600 dark:text-sky-450">Sinkronisasi data real-time dari smart contract...</p>
            </div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total ASN" value={totalAsnsCount} caption="Terdaftar di smart contract" theme={theme} />
                <StatCard label="Rata-rata Merit" value={averagePoint} caption="Dari seluruh ASN aktif" theme={theme} />
                <StatCard label="Antrean Naik Pangkat" value={eligiblePromotion} caption="Pegawai layak naik golongan" theme={theme} />
                <StatCard label="Evaluator Resmi" value={evaluatorsCount} caption="Bisa memberikan penilaian" theme={theme} />
              </div>

              {/* Grid content */}
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-6">
                  <Panel title="Pemimpin Skor Merit ASN" caption="Prioritas berdasarkan performa akumulatif tertinggi di blockchain." theme={theme}>
                    <AsnTable
                      asns={[...currentAsns].sort((a, b) => b.meritPoint - a.meritPoint).slice(0, 5)}
                      onViewDetail={(asn) => {
                        setSelectedAsnDetail(asn);
                        setShowDetailModal(true);
                      }}
                      theme={theme}
                    />
                  </Panel>
                </div>

                {/* Golongan Distribution chart inside Admin view or General stats */}
                <div className="lg:col-span-4">
                  <Panel title="Statistik Golongan" caption="Distribusi pangkat pegawai aktif." theme={theme}>
                    <div className="space-y-3.5">
                      {ranksList.map((r) => {
                        const count = golonganCounts[r.golongan] || 0;
                        const maxCount = Math.max(...Object.values(golonganCounts), 1);
                        const pct = (count / maxCount) * 100;
                        return (
                          <div key={r.golongan} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className={theme === "dark" ? "text-slate-350" : "text-slate-700"}>
                                Gol. {r.golongan} ({r.name})
                              </span>
                              <span className="text-sky-600 dark:text-sky-400 font-bold">{count} ASN</span>
                            </div>
                            <div className={`h-2 w-full rounded-full overflow-hidden ${theme === "dark" ? "bg-slate-950 border border-slate-900" : "bg-slate-100 border border-slate-200"}`}>
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-12">
                <div className="xl:col-span-12">
                  <Panel title="Aktivitas Kepegawaian Terbaru" caption="Jejak audit permanen proses kepegawaian on-chain." theme={theme}>
                    <AuditList
                      logs={currentEvents.slice(0, 8)}
                      onShowSk={handleOpenSk}
                      asns={currentAsns}
                      theme={theme}
                    />
                  </Panel>
                </div>
              </div>
            </div>
          )}

          {/* ASN DATA LIST TAB */}
          {activeTab === "asns" && (
            <Panel title="Basis Data ASN Kepegawaian" caption="Menampilkan profil ASN yang dibaca langsung dari mapping smart contract." theme={theme}>
              <div className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                <Field
                  label="Cari Pegawai ASN"
                  value={query}
                  onChange={setQuery}
                  placeholder="Nama, NIP..."
                  theme={theme}
                />
                <SelectField
                  label="Filter Golongan"
                  value={filterGolongan}
                  onChange={setFilterGolongan}
                  theme={theme}
                >
                  <option value="">Semua Golongan</option>
                  {ranksList.map((r) => (
                    <option key={r.golongan} value={r.golongan}>{r.name} ({r.golongan})</option>
                  ))}
                </SelectField>
                <SelectField
                  label="Filter Instansi Penempatan"
                  value={filterInstansi}
                  onChange={setFilterInstansi}
                  theme={theme}
                >
                  <option value="">Semua Instansi</option>
                  {uniqueInstansi.map((inst) => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </SelectField>
              </div>
              <AsnTable
                asns={filteredAsns}
                onViewDetail={(asn) => {
                  setSelectedAsnDetail(asn);
                  setShowDetailModal(true);
                }}
                theme={theme}
              />
            </Panel>
          )}

          {/* REGISTER ASN FORM TAB */}
          {activeTab === "register" && (
            <Panel title="Registrasi Pegawai Baru" caption="Daftarkan ASN baru secara resmi ke blockchain. Fitur ini terkunci hanya untuk BKD Admin." theme={theme}>
              <form onSubmit={handleRegisterAsn} className="grid gap-5 max-w-2xl">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    label="Nama Lengkap (Tanpa Gelar Pangkat)"
                    value={asnForm.nama}
                    onChange={(val) => setAsnForm({ ...asnForm, nama: val })}
                    placeholder="Contoh: Rian Yuliawan"
                    theme={theme}
                  />
                  <Field
                    label="NIP (Nomor Induk Pegawai)"
                    value={asnForm.nip}
                    onChange={(val) => setAsnForm({ ...asnForm, nip: val })}
                    placeholder="Contoh: 198903122010012005"
                    theme={theme}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    label="Jabatan Fungsional"
                    value={asnForm.jabatanFungsional}
                    onChange={(val) => setAsnForm({ ...asnForm, jabatanFungsional: val })}
                    placeholder="Contoh: Pranata Komputer Ahli Pertama"
                    theme={theme}
                  />
                  <Field
                    label="Instansi Induk / Penempatan"
                    value={asnForm.instansi}
                    onChange={(val) => setAsnForm({ ...asnForm, instansi: val })}
                    placeholder="Contoh: Dinas Komunikasi dan Informatika"
                    theme={theme}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Golongan / Pangkat Awal"
                    value={asnForm.golongan}
                    onChange={(val) => setAsnForm({ ...asnForm, golongan: val })}
                    theme={theme}
                  >
                    {ranksList.slice(0, 7).map((r) => (
                      <option key={r.golongan} value={r.golongan}>
                        {r.name} - Golongan {r.golongan}
                      </option>
                    ))}
                  </SelectField>
                  <Field
                    label="Alamat Wallet Pegawai ASN (Ethereum/Sepolia)"
                    value={asnForm.wallet}
                    onChange={(val) => setAsnForm({ ...asnForm, wallet: val })}
                    placeholder="Contoh: 0x..."
                    theme={theme}
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={busy}>
                    {busy ? "Memproses Blockchain..." : "Daftarkan ASN Resmi"}
                  </Button>
                </div>
              </form>
            </Panel>
          )}

          {/* EVALUATORS MANAGEMENT TAB */}
          {activeTab === "evaluators" && (
            <Panel title="Kelola Otoritas Penilai" caption="Berikan wewenang kepada Kepala Dinas / Evaluator untuk menginput poin kinerja ASN secara on-chain." theme={theme}>
              <form onSubmit={handleAddEvaluator} className="grid gap-5 max-w-2xl mb-8 border-b pb-8 border-slate-200 dark:border-slate-800">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    label="Nama Evaluator / Jabatan"
                    value={evaluatorForm.name}
                    onChange={(val) => setEvaluatorForm({ ...evaluatorForm, name: val })}
                    placeholder="Contoh: Maya Sari, M.Si"
                    theme={theme}
                  />
                  <Field
                    label="Email Instansi"
                    value={evaluatorForm.email}
                    onChange={(val) => setEvaluatorForm({ ...evaluatorForm, email: val })}
                    placeholder="Contoh: mayasari@inspektorat.go.id"
                    theme={theme}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    label="Unit Kerja Penilai"
                    value={evaluatorForm.unit}
                    onChange={(val) => setEvaluatorForm({ ...evaluatorForm, unit: val })}
                    placeholder="Contoh: Inspektorat Kinerja Wilayah I"
                    theme={theme}
                  />
                  <Field
                    label="Wallet Penilai (Wajib)"
                    value={evaluatorForm.wallet}
                    onChange={(val) => setEvaluatorForm({ ...evaluatorForm, wallet: val })}
                    placeholder="Contoh: 0x..."
                    theme={theme}
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={busy}>
                    {busy ? "Memproses Blockchain..." : "Daftarkan Penilai"}
                  </Button>
                </div>
              </form>

              <h3 className="text-base font-bold text-slate-850 dark:text-slate-200 mb-4">Daftar Evaluator Berwenang</h3>
              <EvaluatorList contractAddress={contractAddress} theme={theme} />
            </Panel>
          )}

          {/* INPUT PERFORMANCE SCORE TAB */}
          {activeTab === "performance" && (
            <Panel title="Input Evaluasi Kinerja Pegawai" caption="Masukkan poin capaian meritokrasi berdasarkan Kinerja SKP, Perilaku BerAKHLAK, atau Inovasi." theme={theme}>
              <form onSubmit={handleInputPerformance} className="grid gap-5 max-w-2xl">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  <SelectField
                    label="Pilih Pegawai ASN"
                    value={performanceForm.asnId}
                    onChange={(val) => setPerformanceForm({ ...performanceForm, asnId: val })}
                    theme={theme}
                  >
                    <option value="">-- Pilih ASN --</option>
                    {currentAsns.map((asn) => {
                      const rankInfo = getAsnRankInfo(asn.jabatan, asn.meritPoint);
                      return (
                        <option key={asn.id} value={asn.id}>
                          {asn.nama} - {rankInfo.current.golongan} (Skor: {asn.meritPoint})
                        </option>
                      );
                    })}
                  </SelectField>
                  <SelectField
                    label="Kategori Kinerja"
                    value={performanceForm.category}
                    onChange={(val) => {
                      let sub = "Utama";
                      if (val === "Perilaku") sub = "Pelayanan";
                      else if (val === "Inovasi") sub = "Inovasi";
                      setPerformanceForm({ ...performanceForm, category: val, subcategory: sub });
                    }}
                    theme={theme}
                  >
                    <option value="SKP">Sasaran Kinerja Pegawai (SKP)</option>
                    <option value="Perilaku">Perilaku Kerja (BerAKHLAK)</option>
                    <option value="Inovasi">Inovasi & Prestasi</option>
                  </SelectField>

                  {/* Dynamic subcategory dropdown */}
                  {performanceForm.category === "SKP" && (
                    <SelectField
                      label="Sub-kategori SKP"
                      value={performanceForm.subcategory}
                      onChange={(val) => setPerformanceForm({ ...performanceForm, subcategory: val })}
                      theme={theme}
                    >
                      <option value="Utama">Kinerja Utama</option>
                      <option value="Tambahan">Kinerja Tambahan</option>
                    </SelectField>
                  )}

                  {performanceForm.category === "Perilaku" && (
                    <SelectField
                      label="Sub-kategori BerAKHLAK"
                      value={performanceForm.subcategory}
                      onChange={(val) => setPerformanceForm({ ...performanceForm, subcategory: val })}
                      theme={theme}
                    >
                      <option value="Pelayanan">Berorientasi Pelayanan</option>
                      <option value="Akuntabel">Akuntabel</option>
                      <option value="Kompeten">Kompeten</option>
                      <option value="Harmonis">Harmonis</option>
                      <option value="Loyal">Loyal</option>
                      <option value="Adaptif">Adaptif</option>
                      <option value="Kolaboratif">Kolaboratif</option>
                    </SelectField>
                  )}

                  {performanceForm.category === "Inovasi" && (
                    <SelectField
                      label="Sub-kategori Inovasi"
                      value={performanceForm.subcategory}
                      onChange={(val) => setPerformanceForm({ ...performanceForm, subcategory: val })}
                      theme={theme}
                    >
                      <option value="Inovasi">Inovasi Kerja</option>
                      <option value="Prestasi">Penghargaan Resmi</option>
                      <option value="Diklat">Sertifikasi & Diklat</option>
                    </SelectField>
                  )}
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-3 items-end">
                  <div className="md:col-span-2">
                    <Field
                      label="Catatan Bukti / Keterangan Kinerja"
                      value={performanceForm.note}
                      onChange={(val) => setPerformanceForm({ ...performanceForm, note: val })}
                      placeholder="Deskripsi bukti penyelesaian kerja atau perilaku..."
                      theme={theme}
                    />
                  </div>
                  <Field
                    label="Poin Penilaian (+)"
                    type="number"
                    value={performanceForm.points}
                    onChange={(val) => setPerformanceForm({ ...performanceForm, points: val })}
                    placeholder="Contoh: 35"
                    theme={theme}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={busy}>
                    {busy ? "Memproses Blockchain..." : "Kirim & Catat Kinerja"}
                  </Button>
                </div>
              </form>
            </Panel>
          )}

          {/* PROCESS PROMOTION TAB */}
          {activeTab === "promotion" && (
            <Panel title="Manajemen & Promosi Golongan ASN" caption="Validasi dan proses kenaikan pangkat pegawai yang telah melampaui syarat angka kredit minimum secara bertahap." theme={theme}>
              <div className="grid gap-6 xl:grid-cols-12 mb-8">

                {/* Auto queue card */}
                <div className={`xl:col-span-8 rounded-2xl p-5 border ${theme === "dark" ? "bg-slate-900/40 border-slate-900" : "bg-slate-50 border-slate-200"
                  }`}>
                  <h3 className="text-sm font-bold text-sky-600 dark:text-sky-400 mb-3 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" /> Antrean Layak Naik Golongan
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={`text-left border-b pb-2 ${theme === "dark" ? "text-slate-500 border-slate-900" : "text-slate-550 border-slate-200"}`}>
                          <th className="pb-2">Nama Pegawai</th>
                          <th className="pb-2">Pangkat Saat Ini</th>
                          <th className="pb-2">Poin Merit</th>
                          <th className="pb-2">Target Baru</th>
                          <th className="pb-2 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className={theme === "dark" ? "divide-y divide-slate-900/50" : "divide-y divide-slate-200/50"}>
                        {promotionQueue.map((asn) => {
                          const info = getAsnRankInfo(asn.jabatan, asn.meritPoint);
                          return (
                            <tr key={asn.id} className={theme === "dark" ? "hover:bg-slate-900/20" : "hover:bg-slate-100/40"}>
                              <td className="py-3 font-semibold">{asn.nama}</td>
                              <td className="py-3 text-slate-500">{parseJabatan(asn.jabatan).pangkat} ({info.current.golongan})</td>
                              <td className="py-3 text-emerald-600 dark:text-emerald-400 font-bold">{asn.meritPoint}</td>
                              <td className="py-3 text-sky-600 dark:text-sky-400 font-semibold">{info.next?.golongan} ({info.next?.points} Pts)</td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => {
                                    const jabDetails = parseJabatan(asn.jabatan);
                                    const structuredNewRank = `[${jabDetails.fungsional}] ${info.next.name} (Golongan ${info.next.golongan}) @ ${jabDetails.instansi}`;

                                    setPromotionForm({
                                      asnId: asn.id,
                                      newRole: structuredNewRank,
                                      requiredPoints: info.next.points.toString(),
                                    });

                                    setDraftSkData({
                                      asn,
                                      jabDetails,
                                      nextRank: info.next,
                                      structuredNewRank
                                    });
                                    setShowDraftSkModal(true);
                                  }}
                                  className="bg-sky-650 hover:bg-sky-550 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer shadow-sm"
                                >
                                  Terbitkan SK
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {promotionQueue.length === 0 && (
                      <div className="py-6 text-center text-slate-500 text-xs">
                        Belum ada pegawai yang memenuhi syarat kenaikan pangkat (poin belum cukup).
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual form card */}
                <div className={`xl:col-span-4 rounded-2xl p-5 border ${theme === "dark" ? "bg-slate-950/40 border-slate-900" : "bg-slate-50 border-slate-200"
                  }`}>
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-sky-500" /> Kenaikan Pangkat Manual
                  </h3>
                  <form onSubmit={(e) => { e.preventDefault(); handlePromoteAsn(); }} className="space-y-4">
                    <SelectField
                      label="Pilih ASN"
                      value={promotionForm.asnId}
                      onChange={(val) => {
                        const target = currentAsns.find((a) => a.id === val);
                        if (target) {
                          const info = getAsnRankInfo(target.jabatan, target.meritPoint);
                          const jabDetails = parseJabatan(target.jabatan);
                          if (info.next) {
                            const structuredNewRank = `[${jabDetails.fungsional}] ${info.next.name} (Golongan ${info.next.golongan}) @ ${jabDetails.instansi}`;
                            setPromotionForm({
                              asnId: val,
                              newRole: structuredNewRank,
                              requiredPoints: info.next.points.toString(),
                            });
                          } else {
                            setPromotionForm({
                              asnId: val,
                              newRole: "",
                              requiredPoints: "",
                            });
                            addToast("Pangkat Maksimal", "ASN telah mencapai pangkat tertinggi (Golongan IV/e).", "info");
                          }
                        } else {
                          setPromotionForm(emptyPromotionForm);
                        }
                      }}
                      theme={theme}
                    >
                      <option value="">-- Pilih --</option>
                      {currentAsns.map((asn) => (
                        <option key={asn.id} value={asn.id}>
                          {asn.nama} ({asn.meritPoint} Pts)
                        </option>
                      ))}
                    </SelectField>
                    <Field
                      label="Jabatan/Golongan Baru"
                      value={promotionForm.newRole ? parseJabatan(promotionForm.newRole).pangkat + " (Gol. " + parseJabatan(promotionForm.newRole).golongan + ")" : ""}
                      onChange={() => { }}
                      placeholder="Terisi otomatis..."
                      disabled={true}
                      theme={theme}
                    />
                    <Field
                      label="Syarat Poin"
                      type="number"
                      value={promotionForm.requiredPoints}
                      onChange={() => { }}
                      placeholder="Terisi otomatis..."
                      disabled={true}
                      theme={theme}
                    />
                    <button
                      type="submit"
                      disabled={busy || !promotionForm.asnId || !promotionForm.newRole}
                      className="w-full bg-gradient-to-r from-sky-600 to-indigo-700 dark:from-sky-500 dark:to-indigo-600 text-white dark:text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {busy ? "Memproses..." : "Proses Kenaikan Pangkat"}
                    </button>
                  </form>
                </div>

              </div>
            </Panel>
          )}

          {/* DEDICATED CIVIL SERVANT REPORT CARD TAB (For role: asn) */}
          {activeTab === "rapor" && activeAsnData && (
            <div className="space-y-6">
              {/* Profile Overview & KPE Card */}
              <div className="grid gap-6 md:grid-cols-12">
                <div className="md:col-span-8">
                  <AsnRaporView
                    asnData={activeAsnData}
                    isSelf={true}
                    onPrint={() => {
                      setSelectedAsnPrint(activeAsnData);
                      setShowPrintRaporModal(true);
                    }}
                    theme={theme}
                  />
                </div>
                <div className="md:col-span-4 flex flex-col gap-6">
                  <Panel title="Kartu Identitas Pegawai" caption="E-Kartu KPE resmi berbasis Web3." theme={theme}>
                    <KartuPegawai asnData={activeAsnData} />
                    <div className={`mt-4 rounded-xl p-3 text-[10px] leading-relaxed border ${theme === "dark"
                        ? "bg-slate-950/60 border-slate-900 text-slate-450"
                        : "bg-slate-50 border-slate-200 text-slate-650"
                      }`}>
                      <Info className="h-3.5 w-3.5 text-sky-500 inline mr-1 shrink-0 align-text-bottom" /> <b>Informasi KPE</b>: Kartu Pegawai Elektronik Web3 ini memuat data NIP dan identitas digital Anda yang tersinkronisasi di smart contract. Klik <b>Cetak Rapor Resmi</b> untuk mengunduh laporan performa.
                    </div>
                  </Panel>
                </div>
              </div>

              <Panel title="Riwayat Penilaian Kerja Anda" caption="Daftar lengkap penambahan nilai merit Anda dari atasan/evaluator yang tercatat di blockchain." theme={theme}>
                <AuditList
                  logs={currentEvents.filter((log) => log.wallet.toLowerCase() === walletAddress.toLowerCase())}
                  onShowSk={handleOpenSk}
                  asns={currentAsns}
                  theme={theme}
                />
              </Panel>
            </div>
          )}

          {/* AUDIT TIMELINE TAB */}
          {activeTab === "audit" && (
            <Panel title="Riwayat Jejak Audit Web3" caption="Daftar seluruh transaksi kepegawaian ASN Merit System yang dideploy secara live di Sepolia." theme={theme}>
              <AuditList
                logs={currentEvents}
                onShowSk={handleOpenSk}
                asns={currentAsns}
                theme={theme}
              />
            </Panel>
          )}

        </section>
      </div>

      {/* DYNAMIC TOAST CONTAINER */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </div>

      {/* BACK TO LANDING */}
      <div className={`fixed bottom-5 left-5 z-40 no-print`}>
        <button
          onClick={() => setView("landing")}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border shadow-lg transition-all cursor-pointer ${theme === "dark"
              ? "bg-slate-900/90 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-md"
            }`}
          title="Kembali ke Landing Page"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          <span>Beranda</span>
        </button>
      </div>

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`border rounded-3xl p-6 w-full max-w-lg shadow-2xl ${theme === "dark" ? "bg-[#0d1526] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}>
            <div className={`flex items-center justify-between border-b pb-4 mb-5 ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Settings className="h-5 w-5 text-sky-500" /> Pengaturan Web3
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-450 hover:text-slate-650 transition-all cursor-pointer font-bold text-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <Field
                label="Alamat Smart Contract (EVM)"
                value={contractAddress}
                onChange={setContractAddress}
                placeholder="0x..."
                theme={theme}
              />
              <Field
                label="RPC Endpoint"
                value={rpcUrl}
                onChange={setRpcUrl}
                placeholder="https://..."
                theme={theme}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Chain ID (Network)"
                  type="number"
                  value={chainIdSetting.toString()}
                  onChange={(val) => setChainIdSetting(Number(val))}
                  placeholder="11155111"
                  theme={theme}
                />
                <Field
                  label="Start Block (Untuk scanning)"
                  type="number"
                  value={startBlock.toString()}
                  onChange={(val) => setStartBlock(Number(val))}
                  placeholder="0"
                  theme={theme}
                />
              </div>

              <div className="pt-4 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetSettings}
                  className={`border font-semibold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${theme === "dark"
                      ? "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                      : "bg-slate-50 border-slate-250 text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  Reset ke Bawaan
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className={`border font-semibold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${theme === "dark"
                        ? "bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800"
                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASN PROFILE & RAPOR MODAL */}
      {showDetailModal && selectedAsnDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className={`border rounded-3xl p-6 w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-y-auto my-8 ${theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}>
            <div className={`flex items-center justify-between border-b pb-4 mb-5 ${theme === "dark" ? "border-slate-800" : "border-slate-150"}`}>
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-500" /> Rapor Kinerja & KPE Pegawai
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-450 hover:text-slate-650 transition-all cursor-pointer font-bold text-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
              <div className="md:col-span-8">
                <AsnRaporView
                  asnData={selectedAsnDetail}
                  isSelf={false}
                  onPrint={() => {
                    setSelectedAsnPrint(selectedAsnDetail);
                    setShowPrintRaporModal(true);
                  }}
                  onClose={() => setShowDetailModal(false)}
                  theme={theme}
                />
              </div>
              <div className="md:col-span-4 flex flex-col gap-6">
                <Panel title="Identity Badge (KPE)" caption="E-Kartu KPE pegawai resmi." theme={theme}>
                  <KartuPegawai asnData={selectedAsnDetail} />
                </Panel>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT RAPOR MODAL */}
      {showPrintRaporModal && selectedAsnPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm overflow-y-auto no-print">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <PrintableRaporView
              asnData={selectedAsnPrint}
              onClose={() => setShowPrintRaporModal(false)}
            />
          </div>
        </div>
      )}

      {/* SK DECREE MODAL */}
      {showSkModal && selectedAsnSk && selectedSkEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm overflow-y-auto no-print">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <SkDecreeView
              asnData={selectedAsnSk}
              timestamp={selectedSkEvent.timestamp || selectedSkEvent.block * 12 + 1718100000} // estimation or mock
              txHash={selectedSkEvent.txHash}
              blockNumber={selectedSkEvent.block}
              onClose={() => setShowSkModal(false)}
            />
          </div>
        </div>
      )}

      {/* BKD ADMIN DRAFT SK CONFIRMATION MODAL */}
      {showDraftSkModal && draftSkData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm overflow-y-auto no-print">
          <div className={`border rounded-3xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto ${theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}>
            <div className={`flex items-center justify-between border-b pb-4 mb-5 ${theme === "dark" ? "border-slate-800" : "border-slate-155"}`}>
              <h3 className="text-base font-bold text-amber-500 dark:text-amber-400 flex items-center gap-2">
                <PenTool className="h-5 w-5 text-amber-500" /> Draf Keputusan Kenaikan Pangkat (SK)
              </h3>
              <button
                onClick={() => setShowDraftSkModal(false)}
                className="text-slate-450 hover:text-slate-650 transition-all cursor-pointer font-bold text-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
              <SkDecreeView
                asnData={{
                  nama: draftSkData.asn.nama,
                  nip: draftSkData.asn.nip,
                  jabatan: draftSkData.structuredNewRank,
                  meritPoint: draftSkData.asn.meritPoint,
                  wallet: draftSkData.asn.wallet
                }}
                txHash="Pending (Menunggu blockchain)"
                blockNumber="Pending"
                onClose={() => setShowDraftSkModal(false)}
                isDraft={true}
              />
            </div>

            <div className={`flex justify-end gap-3 mt-6 pt-4 border-t ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
              <button
                onClick={() => setShowDraftSkModal(false)}
                className={`border font-semibold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${theme === "dark"
                    ? "bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-350"
                    : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100"
                  }`}
              >
                Batal
              </button>
              <button
                onClick={handlePromoteAsn}
                className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-500 dark:to-teal-600 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                Tandatangani & Terbitkan SK
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

// UI HELPER COMPONENTS

function StatCard({ label, value, caption, theme }) {
  return (
    <div className={`rounded-2xl p-5 border transition-all ${theme === "dark"
        ? "bg-slate-900/40 border-slate-900 hover:border-slate-800 shadow-sm"
        : "bg-white border-slate-200 shadow-sm hover:border-slate-300"
      }`}>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1.5 font-display">{value}</p>
      <p className="text-[10px] text-slate-500 mt-1">{caption}</p>
    </div>
  );
}

function Panel({ title, caption, children, theme }) {
  return (
    <section className={`rounded-3xl p-6 border transition-all ${theme === "dark"
        ? "bg-slate-900/20 border-slate-900"
        : "bg-white border-slate-200 shadow-sm"
      }`}>
      <div className="mb-5">
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{caption}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", disabled = false, theme }) {
  const inputClass = theme === "dark"
    ? "bg-slate-950 border-slate-900 text-slate-200 focus:border-sky-500 focus:ring-sky-500/10"
    : "bg-white border-slate-200 text-slate-900 focus:border-sky-600 focus:ring-sky-600/10";
  return (
    <label className="grid gap-1.5 w-full text-left">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-10 rounded-xl border px-4 text-xs outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:bg-slate-50/50 dark:disabled:bg-slate-950/40 disabled:text-slate-400 ${inputClass}`}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, children, theme }) {
  const selectClass = theme === "dark"
    ? "bg-slate-950 border-slate-900 text-slate-200 focus:border-sky-500 focus:ring-sky-500/10"
    : "bg-white border-slate-200 text-slate-900 focus:border-sky-600 focus:ring-sky-600/10";
  return (
    <label className="grid gap-1.5 w-full text-left">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 rounded-xl border px-4 text-xs outline-none transition focus:ring-2 ${selectClass}`}
      >
        {children}
      </select>
    </label>
  );
}

function Button({ children, onClick, type = "button", disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-indigo-700 dark:from-sky-500 dark:to-indigo-600 px-6 text-xs font-bold text-white transition-all shadow-md shadow-sky-500/10 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
    >
      {children}
    </button>
  );
}

function BreakdownBar({ label, val, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-550 font-medium">{label}</span>
        <span className="font-bold">{val} Poin</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-900">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${Math.min(100, Math.round((val / 400) * 100))}%` }}
        />
      </div>
    </div>
  );
}

function AsnTable({ asns, onViewDetail, theme }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-xs text-left">
        <thead>
          <tr className={`border-b text-slate-500 font-bold uppercase tracking-wider ${theme === "dark" ? "border-slate-900" : "border-slate-200"}`}>
            <th className="pb-3 font-semibold">Nama & NIP</th>
            <th className="pb-3 font-semibold">Jabatan Fungsional</th>
            <th className="pb-3 font-semibold">Golongan</th>
            <th className="pb-3 font-semibold">Poin Merit (Target)</th>
            <th className="pb-3 font-semibold">Instansi</th>
            <th className="pb-3 font-semibold text-right">Kelayakan / Detail</th>
          </tr>
        </thead>
        <tbody className={theme === "dark" ? "divide-y divide-slate-900/60" : "divide-y divide-slate-200/60"}>
          {asns.map((asn) => {
            const rankInfo = getAsnRankInfo(asn.jabatan, asn.meritPoint);
            const jabDetails = parseJabatan(asn.jabatan);
            const hasEnoughPoints = rankInfo.next && asn.meritPoint >= rankInfo.next.points;

            const currentMin = rankInfo.current.points;
            const nextMax = rankInfo.next ? rankInfo.next.points : currentMin + 200;
            const pct = Math.max(0, Math.min(100, Math.round(((asn.meritPoint - currentMin) / (nextMax - currentMin)) * 100)));

            let badgeStyle = "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20";
            if (rankInfo.current.golongan.startsWith("IV")) {
              badgeStyle = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
            } else if (rankInfo.current.golongan === "III/c" || rankInfo.current.golongan === "III/d") {
              badgeStyle = "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20";
            }

            return (
              <tr key={asn.id} className={`transition-all ${theme === "dark" ? "hover:bg-slate-900/20" : "hover:bg-slate-100/30"}`}>
                <td className="py-4 pr-3">
                  <p className="font-bold">{asn.nama}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">NIP: {asn.nip}</p>
                </td>
                <td className="py-4 text-slate-500 pr-3 truncate max-w-44 font-semibold" title={jabDetails.fungsional}>
                  {jabDetails.fungsional}
                </td>
                <td className="py-4 pr-3">
                  <span className={`inline-block rounded-lg px-2.5 py-1 text-[10px] font-bold ${badgeStyle}`}>
                    Gol. {rankInfo.current.golongan}
                  </span>
                </td>
                <td className="py-4 pr-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-20 overflow-hidden rounded-full border ${theme === "dark" ? "bg-slate-950 border-slate-900" : "bg-slate-100 border-slate-200"}`}>
                      <div
                        className="h-full rounded-full transition-all bg-gradient-to-r from-sky-500 to-indigo-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-650 dark:text-slate-300">
                      {asn.meritPoint} <span className="text-slate-400 font-medium">/ {rankInfo.next ? rankInfo.next.points : "Maks"}</span>
                    </span>
                  </div>
                </td>
                <td className="py-4 text-slate-500 pr-3 truncate max-w-40" title={jabDetails.instansi}>
                  {jabDetails.instansi}
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {hasEnoughPoints ? (
                      <span className="inline-flex items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-450">
                        Naik Gol. {rankInfo.next.golongan}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-900 px-2 py-0.5 text-slate-500 border border-slate-200 dark:border-slate-850/60">
                        {rankInfo.next ? `${rankInfo.next.points - asn.meritPoint} Pts Lagi` : "Pangkat Maks"}
                      </span>
                    )}
                    <button
                      onClick={() => onViewDetail(asn)}
                      className={`border text-[10px] px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${theme === "dark"
                          ? "bg-slate-900 border-slate-800 text-slate-350 hover:border-slate-700 hover:text-white"
                          : "bg-slate-50 border-slate-250 text-slate-650 hover:bg-slate-100 hover:text-slate-950"
                        }`}
                    >
                      Detail
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {asns.length === 0 && (
        <div className={`rounded-2xl border border-dashed py-10 text-center text-slate-500 ${theme === "dark" ? "border-slate-900" : "border-slate-200"}`}>
          Pegawai ASN tidak ditemukan.
        </div>
      )}
    </div>
  );
}

function EvaluatorList({ contractAddress, theme }) {
  const [evals, setEvals] = useState([]);

  useEffect(() => {
    const cached = JSON.parse(window.localStorage.getItem(`eval_cache_${contractAddress}`) || "[]");
    setEvals(cached);
  }, [contractAddress]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {evals.map((e, idx) => (
        <div key={e.wallet + idx} className={`rounded-2xl border p-4 text-left ${theme === "dark" ? "bg-slate-900/30 border-slate-900" : "bg-white border-slate-200 shadow-sm"
          }`}>
          <p className="font-bold text-sm">{e.name}</p>
          <p className="text-[10px] text-slate-500 mt-1">{e.email}</p>
          <p className="text-[10px] text-slate-450 mt-1.5 font-semibold">{e.unit}</p>
          <div className={`mt-3 pt-3 border-t flex items-center justify-between ${theme === "dark" ? "border-slate-900/60" : "border-slate-100"}`}>
            <span className="text-[9px] text-slate-500 font-mono tracking-tighter truncate max-w-40">{e.wallet}</span>
            <span className="text-[9px] uppercase font-bold text-sky-600 dark:text-sky-400">Evaluator</span>
          </div>
        </div>
      ))}
      {evals.length === 0 && (
        <div className={`sm:col-span-3 text-center py-6 text-slate-500 text-xs border border-dashed rounded-2xl ${theme === "dark" ? "border-slate-900" : "border-slate-200"
          }`}>
          Belum ada data evaluator yang terdaftar.
        </div>
      )}
    </div>
  );
}

function AuditList({ logs, onShowSk, asns, theme }) {
  const categoryColors = {
    SKP: "bg-sky-500/10 text-sky-600 dark:text-sky-450 border border-sky-500/20",
    Perilaku: "bg-indigo-500/10 text-indigo-650 dark:text-indigo-405 border border-indigo-500/20",
    Inovasi: "bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20",
  };

  return (
    <div className={`relative border-l ml-3 space-y-5 text-left ${theme === "dark" ? "border-slate-900" : "border-slate-200"}`}>
      {logs.map((log) => {
        const isPromotion = log.action === "Kenaikan Pangkat";

        return (
          <div key={log.id} className="relative pl-6">
            <span className={`absolute -left-1 top-1.5 h-2 w-2 rounded-full border bg-slate-950 ${theme === "dark" ? "border-sky-500" : "border-sky-600 bg-white"
              }`}></span>

            <div className={`rounded-2xl border p-4 transition-all ${theme === "dark" ? "bg-slate-950/40 border-slate-900 hover:border-slate-800" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
              }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold ${theme === "dark" ? "bg-slate-900 text-slate-350 border border-slate-800" : "bg-slate-50 text-slate-650 border border-slate-200"
                    }`}>
                    {log.action}
                  </span>
                  <span className={`inline-block rounded-lg px-2 py-0.5 text-[9px] font-bold ${categoryColors[log.category] || categoryColors.SKP}`}>
                    {log.category === "SKP" ? (subcategoryLabels[log.subcategory] || "SKP Utama") : log.category === "Perilaku" ? (subcategoryLabels[log.subcategory] || "Perilaku") : (subcategoryLabels[log.subcategory] || "Inovasi")}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Block #{log.block}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed font-medium">{log.detail}</p>

              <div className={`mt-3 flex items-center justify-between text-[10px] text-slate-500 border-t pt-2.5 gap-2 ${theme === "dark" ? "border-slate-900/60" : "border-slate-100"
                }`}>
                <span>Aktor: <b>{log.actor}</b></span>
                <div className="flex items-center gap-3">
                  {isPromotion && onShowSk && (
                    <button
                      onClick={() => {
                        const asnObj = asns.find((a) => a.wallet.toLowerCase() === log.wallet.toLowerCase());
                        if (asnObj) {
                          onShowSk(asnObj, log);
                        } else {
                          onShowSk({
                            nama: "Pegawai Negeri Sipil",
                            nip: "N/A",
                            jabatan: log.detail.split("ke: ")[1] || "N/A",
                            meritPoint: 0,
                            wallet: log.wallet,
                          }, log);
                        }
                      }}
                      className="text-amber-600 dark:text-amber-400 font-bold underline decoration-current/30 underline-offset-2 cursor-pointer flex items-center gap-1"
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>Lihat SK Resmi</span>
                    </button>
                  )}
                  {log.txHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${log.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 dark:text-sky-400 flex items-center gap-1.5 font-mono font-medium underline decoration-current/30 underline-offset-2"
                    >
                      Tx: {shortenAddress(log.txHash)}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {logs.length === 0 && (
        <div className="text-center py-10 text-slate-500 text-xs">
          Belum ada histori audit.
        </div>
      )}
    </div>
  );
}

function KartuPegawai({ asnData }) {
  const jabDetails = parseJabatan(asnData.jabatan);
  return (
    <div className="w-full max-w-sm mx-auto aspect-[1.58/1] rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-5 border border-indigo-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between text-left">
      <div className="absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-sky-500/10 blur-xl"></div>

      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-[#d4af37]" />
          <div>
            <h4 className="text-[9px] font-bold tracking-wider uppercase leading-none">Kartu Pegawai Elektronik</h4>
            <p className="text-[7px] text-sky-400 uppercase tracking-widest mt-0.5 font-bold">Badan Kepegawaian Negara</p>
          </div>
        </div>
        <span className="text-[8px] bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider">
          Web3 Active
        </span>
      </div>

      {/* Card Body */}
      <div className="flex items-center gap-4 my-2">
        <div className="h-16 w-12 bg-slate-950 rounded-lg flex items-center justify-center border border-white/15 relative overflow-hidden shrink-0">
          <svg className="w-10 h-10 text-slate-750" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold truncate tracking-tight">{asnData.nama}</h3>
          <p className="text-[9px] text-slate-405 font-mono mt-0.5 font-semibold">NIP. {asnData.nip}</p>
          <p className="text-[8px] text-slate-400 truncate mt-1.5 flex items-center gap-1">
            <Briefcase className="h-3 w-3 text-slate-500 shrink-0" />
            <span>{jabDetails.fungsional}</span>
          </p>
          <p className="text-[8px] text-slate-400 truncate flex items-center gap-1">
            <Building className="h-3 w-3 text-slate-500 shrink-0" />
            <span>{jabDetails.instansi}</span>
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-end justify-between border-t border-white/10 pt-2 text-[8px] text-slate-500">
        <div className="flex flex-col">
          <span>Golongan PNS</span>
          <span className="font-bold text-white text-[9px] mt-0.5">{jabDetails.pangkat} ({jabDetails.golongan})</span>
        </div>
        <div className="flex flex-col items-end">
          {/* Mock Barcode */}
          <div className="h-3 w-16 bg-white flex items-center justify-between p-0.5 mb-0.5 select-none rounded-[1px]">
            {[1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 2, 3, 1, 4, 2].map((h, i) => (
              <div key={i} className="bg-slate-950 w-[1px]" style={{ height: `${h * 25}%` }}></div>
            ))}
          </div>
          <span className="font-mono text-[6px] text-slate-500">KPE-{asnData.wallet.slice(2, 10).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

function ToastCard({ toast }) {
  const { title, message, type, txHash } = toast;
  let cardClass = "";
  let icon = null;

  if (type === "success") {
    cardClass = "border-emerald-500/30 bg-slate-900/95 text-emerald-400 dark:bg-slate-950/95";
    icon = <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
  } else if (type === "error") {
    cardClass = "border-rose-500/30 bg-slate-900/95 text-rose-400 dark:bg-slate-950/95";
    icon = <XCircle className="h-5 w-5 text-rose-500 shrink-0" />;
  } else if (type === "warning") {
    cardClass = "border-amber-500/30 bg-slate-900/95 text-amber-400 dark:bg-slate-950/95";
    icon = <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
  } else {
    cardClass = "border-sky-500/30 bg-slate-900/95 text-sky-400 dark:bg-slate-950/95";
    icon = <Info className="h-5 w-5 text-sky-500 shrink-0" />;
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl pointer-events-auto transition-all duration-300 animate-slide-in-right ${cardClass}`}>
      {icon}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-100 dark:text-slate-100">{title}</h4>
        <p className="text-[11px] text-slate-350 dark:text-slate-300 mt-1 leading-relaxed">{message}</p>
        {txHash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-colors hover:underline"
          >
            <span>Lihat di Etherscan</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function AsnRaporView({ asnData, isSelf, onPrint, onClose, theme }) {
  const jabDetails = parseJabatan(asnData.jabatan);
  const { skpPoints = 0, perilakuPoints = 0, inovasiPoints = 0 } = asnData.breakdown || {};

  const subCategories = {
    SKP: ["Utama", "Tambahan"],
    Perilaku: ["Pelayanan", "Akuntabel", "Kompeten", "Harmonis", "Loyal", "Adaptif", "Kolaboratif"],
    Inovasi: ["Inovasi", "Prestasi", "Diklat"]
  };

  const getSubcategoryPoints = (sub) => {
    return asnData.subcategoryPoints?.[sub] || 0;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Profile Header */}
      <div className={`p-6 rounded-2xl border ${theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200 shadow-sm"}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{asnData.nama}</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">NIP: {asnData.nip}</p>
            <p className="text-xs text-slate-500 mt-1">
              {jabDetails.fungsional} &bull; {jabDetails.pangkat} ({jabDetails.golongan})
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5 font-mono truncate max-w-xs sm:max-w-md md:max-w-lg">
              Wallet: {asnData.wallet}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onPrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md"
            >
              <Printer className="h-4 w-4" />
              Cetak Rapor
            </button>
            {!isSelf && onClose && (
              <button
                onClick={onClose}
                className={`flex-1 sm:flex-initial border font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${theme === "dark"
                    ? "bg-slate-950 border-slate-800 text-slate-450 hover:text-white"
                    : "bg-white border-slate-200 text-slate-650 hover:bg-slate-100"
                  }`}
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`p-4 rounded-xl border ${theme === "dark" ? "bg-slate-900/30 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SKP POINTS</span>
            <ClipboardList className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{skpPoints} <span className="text-xs font-normal text-slate-500">Pts</span></p>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-sky-500" style={{ width: `${Math.min(100, (skpPoints / 300) * 100)}%` }} />
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${theme === "dark" ? "bg-slate-900/30 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">BERAKHLAK POINTS</span>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{perilakuPoints} <span className="text-xs font-normal text-slate-500">Pts</span></p>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (perilakuPoints / 300) * 100)}%` }} />
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${theme === "dark" ? "bg-slate-900/30 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">INOVASI POINTS</span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{inovasiPoints} <span className="text-xs font-normal text-slate-500">Pts</span></p>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (inovasiPoints / 300) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Categories Details Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* SKP */}
        <div className={`p-5 rounded-2xl border ${theme === "dark" ? "bg-slate-900/20 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
          <h3 className="font-bold text-sm text-sky-500 dark:text-sky-400 border-b pb-2 mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Sasaran Kinerja Pegawai (SKP)
          </h3>
          <div className="space-y-3.5">
            {subCategories.SKP.map((sub) => (
              <div key={sub} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className={theme === "dark" ? "text-slate-400" : "text-slate-650"}>{subcategoryLabels[sub] || sub}</span>
                  <span className="text-sky-600 dark:text-sky-400 font-bold">{getSubcategoryPoints(sub)} Pts</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500" style={{ width: `${Math.min(100, (getSubcategoryPoints(sub) / 200) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Perilaku */}
        <div className={`p-5 rounded-2xl border ${theme === "dark" ? "bg-slate-900/20 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
          <h3 className="font-bold text-sm text-indigo-500 dark:text-indigo-400 border-b pb-2 mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Perilaku Kerja BerAKHLAK
          </h3>
          <div className="space-y-3.5">
            {subCategories.Perilaku.map((sub) => (
              <div key={sub} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className={theme === "dark" ? "text-slate-400" : "text-slate-650"}>{subcategoryLabels[sub] || sub}</span>
                  <span className="text-indigo-650 dark:text-indigo-400 font-bold">{getSubcategoryPoints(sub)} Pts</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (getSubcategoryPoints(sub) / 100) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inovasi */}
        <div className={`p-5 rounded-2xl border ${theme === "dark" ? "bg-slate-900/20 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
          <h3 className="font-bold text-sm text-amber-500 dark:text-amber-400 border-b pb-2 mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" /> Inovasi & Penghargaan
          </h3>
          <div className="space-y-3.5">
            {subCategories.Inovasi.map((sub) => (
              <div key={sub} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className={theme === "dark" ? "text-slate-400" : "text-slate-650"}>{subcategoryLabels[sub] || sub}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{getSubcategoryPoints(sub)} Pts</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (getSubcategoryPoints(sub) / 100) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintableRaporView({ asnData, onClose }) {
  const jabDetails = parseJabatan(asnData.jabatan);
  const { skpPoints = 0, perilakuPoints = 0, inovasiPoints = 0 } = asnData.breakdown || {};
  const totalPoints = asnData.meritPoint;

  let grade = "Cukup";
  let description = "Pegawai menunjukkan kinerja standar dan perlu peningkatan intensif.";
  if (totalPoints >= 1200) {
    grade = "Sangat Baik";
    description = "Pegawai menunjukkan kontribusi istimewa, inovasi konsisten, serta keteladanan perilaku.";
  } else if (totalPoints >= 600) {
    grade = "Baik";
    description = "Pegawai berkinerja secara andal, memenuhi sasaran kinerja dengan integritas perilaku baik.";
  }

  const printDocument = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const currentDateString = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="bg-white text-slate-900 p-6 sm:p-12 rounded-3xl shadow-2xl relative max-w-4xl w-full border border-slate-200 text-left font-sans">
      {/* Action Buttons (hidden in print) */}
      <div className="absolute top-4 right-4 flex gap-2 no-print">
        <button
          onClick={printDocument}
          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer shadow-sm transition-all"
        >
          <Printer className="h-3.5 w-3.5" />
          Cetak PDF / Printer
        </button>
        <button
          onClick={onClose}
          className="bg-slate-100 hover:bg-slate-200 text-slate-650 border border-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all"
        >
          Tutup
        </button>
      </div>

      {/* Document Header */}
      <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-5 mb-8">
        <h2 className="text-sm font-bold tracking-widest uppercase text-slate-700 leading-tight">Pemerintah Republik Indonesia</h2>
        <h1 className="text-lg font-extrabold tracking-wide uppercase text-slate-900">Badan Kepegawaian Negara</h1>
        <p className="text-[9px] text-slate-500 font-bold tracking-wider">SISTEM INFORMASI MANAJEMEN KEPEGAWAIAN (SIMPEG) - INTEGRASI WEB3 MERIT</p>
        <p className="text-xs font-bold border-2 border-slate-900 inline-block px-4 py-1.5 uppercase mt-3 tracking-widest bg-slate-50">
          Laporan Hasil Evaluasi Meritokrasi Pegawai Negeri Sipil
        </p>
      </div>

      {/* ASN Personal Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-8 border-b pb-6 border-slate-200">
        <table className="w-full">
          <tbody>
            <tr className="align-top">
              <td className="w-1/3 py-1 font-bold text-slate-500 uppercase">Nama PNS</td>
              <td className="w-4 py-1 text-center text-slate-400">:</td>
              <td className="py-1 font-bold text-slate-900">{asnData.nama}</td>
            </tr>
            <tr className="align-top">
              <td className="py-1 font-bold text-slate-500 uppercase">NIP</td>
              <td className="text-center text-slate-400">:</td>
              <td className="py-1 font-mono font-bold text-slate-800">{asnData.nip}</td>
            </tr>
            <tr className="align-top">
              <td className="py-1 font-bold text-slate-500 uppercase">Pangkat / Gol.</td>
              <td className="text-center text-slate-400">:</td>
              <td className="py-1 text-slate-900">{jabDetails.pangkat} ({jabDetails.golongan})</td>
            </tr>
          </tbody>
        </table>
        <table className="w-full">
          <tbody>
            <tr className="align-top">
              <td className="w-1/3 py-1 font-bold text-slate-500 uppercase">Jabatan</td>
              <td className="w-4 py-1 text-center text-slate-400">:</td>
              <td className="py-1 text-slate-900">{jabDetails.fungsional}</td>
            </tr>
            <tr className="align-top">
              <td className="py-1 font-bold text-slate-500 uppercase">Instansi Induk</td>
              <td className="text-center text-slate-400">:</td>
              <td className="py-1 text-slate-900">{jabDetails.instansi}</td>
            </tr>
            <tr className="align-top">
              <td className="py-1 font-bold text-slate-500 uppercase">Wallet Address</td>
              <td className="text-center text-slate-400">:</td>
              <td className="py-1 font-mono text-[9px] break-all text-slate-600">{asnData.wallet}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Scores Table */}
      <div className="border-2 border-slate-900 rounded-xl overflow-hidden mb-6 text-xs bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-slate-900 text-[9px] font-extrabold uppercase text-slate-700 tracking-wider">
              <th className="p-3 border-r border-slate-900 w-12 text-center">NO</th>
              <th className="p-3 border-r border-slate-900">ASPEK EVALUASI KINERJA</th>
              <th className="p-3 w-36 text-center">SKOR MERIT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-900">
              <td className="p-3 border-r border-slate-900 text-center font-bold text-slate-500">1</td>
              <td className="p-3 border-r border-slate-900">
                <p className="font-bold text-slate-800">Sasaran Kinerja Pegawai (SKP) Utama & Tambahan</p>
                <p className="text-[10px] text-slate-550 mt-0.5">Penilaian akuntabilitas target tugas kerja individu dan dinas penempatan.</p>
              </td>
              <td className="p-3 text-center font-bold text-slate-900 text-sm">{skpPoints} Pts</td>
            </tr>
            <tr className="border-b border-slate-900">
              <td className="p-3 border-r border-slate-900 text-center font-bold text-slate-500">2</td>
              <td className="p-3 border-r border-slate-900">
                <p className="font-bold text-slate-800">Perilaku Kerja (Core Values BerAKHLAK)</p>
                <p className="text-[10px] text-slate-550 mt-0.5">Orientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif.</p>
              </td>
              <td className="p-3 text-center font-bold text-slate-900 text-sm">{perilakuPoints} Pts</td>
            </tr>
            <tr className="border-b-2 border-slate-900">
              <td className="p-3 border-r border-slate-900 text-center font-bold text-slate-500">3</td>
              <td className="p-3 border-r border-slate-900">
                <p className="font-bold text-slate-800">Inovasi Kerja & Prestasi Khusus</p>
                <p className="text-[10px] text-slate-550 mt-0.5">Penghargaan resmi negara, karya inovasi, diklat tersertifikasi nasional/internasional.</p>
              </td>
              <td className="p-3 text-center font-bold text-slate-900 text-sm">{inovasiPoints} Pts</td>
            </tr>
            <tr className="bg-slate-50 font-bold">
              <td colSpan="2" className="p-3 border-r border-slate-900 text-right uppercase tracking-wider text-[9px]">TOTAL AKUMULASI POIN MERIT</td>
              <td className="p-3 text-center text-sm font-extrabold text-sky-800 bg-sky-50">{totalPoints} Pts</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Grade Predicate Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs mb-8 flex flex-col gap-1">
        <p className="font-bold uppercase tracking-wider text-slate-500 text-[9px]">Predikat Capaian Kinerja</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs font-extrabold text-sky-800 bg-sky-100/60 border border-sky-200 rounded px-2.5 py-1 uppercase">
            {grade}
          </span>
          <p className="text-slate-650 leading-relaxed font-semibold">{description}</p>
        </div>
      </div>

      {/* Sign-off / Verification Footnote */}
      <div className="grid grid-cols-2 gap-4 text-xs mt-12 pt-6 border-t border-slate-200">
        <div>
          <p className="font-bold text-slate-500 text-[9px] uppercase tracking-wider mb-2">VERIFIKASI INTEGRITAS DIGITAL</p>
          <div className="flex items-center gap-2.5">
            <QrCode className="h-16 w-16 text-slate-800 shrink-0 border border-slate-250 p-1 rounded bg-white shadow-xs" />
            <div className="font-mono text-[8px] text-slate-500 leading-tight space-y-0.5">
              <p>STATUS: <span className="text-emerald-600 font-bold">TERDAFTAR ON-CHAIN</span></p>
              <p className="truncate max-w-40">WALLETSIG: {asnData.wallet}</p>
              <p>NETWORK: Sepolia Chain (11155111)</p>
              <p className="text-[7px] font-sans mt-1 text-slate-400">Verifikasi tanda tangan digital on-chain valid.</p>
            </div>
          </div>
        </div>
        <div className="text-right flex flex-col justify-between items-end">
          <div className="space-y-1">
            <p className="text-slate-600">Jakarta, {currentDateString}</p>
            <p className="font-bold text-slate-900 uppercase">Kepala Badan Kepegawaian Negara</p>
          </div>
          <div className="pt-10">
            <p className="font-extrabold text-slate-900 uppercase underline decoration-slate-900">Dr. Ir. H. Bima Haria Wibisana, M.SIS.</p>
            <p className="text-slate-550 font-mono text-[9px] mt-0.5">NIP. 196107191989031001</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkDecreeView({ asnData, timestamp, txHash, blockNumber, onClose, isDraft = false }) {
  const jabDetails = parseJabatan(asnData.jabatan);
  const dateStr = timestamp
    ? new Date(Number(timestamp) * 1000).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
    : new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  return (
    <div className="bg-[#fffdf8] text-slate-900 p-6 sm:p-12 rounded-3xl shadow-2xl relative max-w-3xl w-full border-2 border-[#d4af37]/30 text-left font-serif leading-relaxed">
      {/* Control Actions */}
      <div className="absolute top-4 right-4 flex gap-2 no-print font-sans">
        {!isDraft && onClose && (
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-650 border border-slate-200 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-xs transition-all"
          >
            Tutup SK
          </button>
        )}
      </div>

      {/* Garuda emblem styled header */}
      <div className="text-center space-y-2 border-b-2 border-double border-slate-900 pb-5 mb-6">
        <div className="flex justify-center text-amber-700 mb-2">
          <Award className="h-12 w-12 text-[#b8860b]" />
        </div>
        <h1 className="text-md font-extrabold uppercase tracking-widest text-slate-900 leading-tight">BADAN KEPEGAWAIAN NEGARA</h1>
        <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700">KEPUTUSAN KEPALA BADAN KEPEGAWAIAN NEGARA</h2>
        <p className="text-[10px] font-mono text-slate-600">NOMOR: BKD-SKKP/Web3/{isDraft ? "DRAFT" : blockNumber}/{new Date().getFullYear()}</p>
        <p className="text-xs font-bold border-y border-slate-950 inline-block px-8 py-1.5 uppercase mt-3 tracking-widest leading-relaxed">
          TENTANG<br />KENAIKAN JABATAN DAN PANGKAT GOLONGAN PEGAWAI NEGERI SIPIL
        </p>
      </div>

      {/* Formal Wording Columns */}
      <div className="space-y-4 text-xs font-sans text-slate-800">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-2 font-bold text-slate-650 tracking-wider">MENIMBANG</div>
          <div className="col-span-1 text-center">:</div>
          <div className="col-span-9 leading-relaxed">
            Bahwa Pegawai Negeri Sipil tersebut di bawah ini telah mengumpulkan akumulasi Merit Points sejumlah <b>{asnData.meritPoint} Poin</b> yang tercatat permanen pada Ledger Smart Contract, memenuhi syarat kecukupan performa untuk kenaikan jenjang kepangkatan/golongan.
          </div>
        </div>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-2 font-bold text-slate-650 tracking-wider">MENGINGAT</div>
          <div className="col-span-1 text-center">:</div>
          <div className="col-span-9 leading-relaxed">
            Undang-Undang Nomor 20 Tahun 2023 tentang Aparatur Sipil Negara, Peraturan Pemerintah Nomor 17 Tahun 2020 tentang Manajemen Pegawai Negeri Sipil, serta Konsensus Validasi Blok Web3 Kinerja SIMPEG.
          </div>
        </div>

        <div className="border-t border-slate-900 my-4 text-center py-2 font-bold text-xs tracking-widest uppercase text-slate-900">
          MEMUTUSKAN:
        </div>

        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-2 font-bold text-slate-650 tracking-wider">MENETAPKAN</div>
          <div className="col-span-1 text-center">:</div>
          <div className="col-span-9 font-bold text-slate-900">
            Mempromosikan Pegawai Negeri Sipil yang bersangkutan pada pangkat/golongan baru sebagai berikut:
          </div>
        </div>
      </div>

      {/* Promotion Details Table Box */}
      <div className="my-6 p-5 border border-dashed border-[#d4af37]/60 bg-[#fffefc] rounded-xl text-xs font-sans">
        <table className="w-full">
          <tbody>
            <tr className="align-top">
              <td className="w-1/3 py-1.5 font-bold text-slate-500">NAMA PEGAWAI</td>
              <td className="w-4 py-1.5 text-center text-slate-400">:</td>
              <td className="py-1.5 font-bold text-slate-900 uppercase">{asnData.nama}</td>
            </tr>
            <tr className="align-top">
              <td className="py-1.5 font-bold text-slate-500">NIP</td>
              <td className="text-center text-slate-400">:</td>
              <td className="py-1.5 font-mono font-bold text-slate-900">{asnData.nip}</td>
            </tr>
            <tr className="align-top">
              <td className="py-1.5 font-bold text-slate-500">JABATAN FUNGSIONAL BARU</td>
              <td className="text-center text-slate-400">:</td>
              <td className="py-1.5 font-semibold text-slate-800">{jabDetails.fungsional}</td>
            </tr>
            <tr className="align-top">
              <td className="py-1.5 font-bold text-slate-500">PANGKAT (GOLONGAN) BARU</td>
              <td className="text-center text-slate-400">:</td>
              <td className="py-1.5 font-bold text-sky-850">{jabDetails.pangkat} ({jabDetails.golongan})</td>
            </tr>
            <tr className="align-top">
              <td className="py-1.5 font-bold text-slate-500">TERHITUNG MULAI TANGGAL</td>
              <td className="text-center text-slate-400">:</td>
              <td className="py-1.5 text-slate-700 font-bold">{dateStr}</td>
            </tr>
            <tr className="align-top">
              <td className="py-1.5 font-bold text-slate-500">TANDA TANGAN KRIPTOGRAFIS</td>
              <td className="text-center text-slate-400">:</td>
              <td className="py-1.5 font-mono text-[9px] break-all text-slate-500">{asnData.wallet}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature & Stamp Footnote */}
      <div className="grid grid-cols-2 gap-4 text-xs mt-8 font-sans">
        <div className="flex flex-col justify-end">
          <div className="border border-[#b8860b]/25 bg-amber-50/20 rounded-xl p-3.5 flex gap-3 items-center">
            <QrCode className="h-14 w-14 text-slate-800 border border-slate-200 p-0.5 bg-white shrink-0 shadow-xs" />
            <div className="font-mono text-[8px] text-slate-500 leading-tight space-y-0.5">
              <p className="font-bold text-[#b8860b] uppercase">Blockchain Certified SK</p>
              <p className="truncate max-w-36">TX: {txHash}</p>
              <p>BLOCK: #{blockNumber}</p>
              <p>CONSENSUS: Verified EVM</p>
            </div>
          </div>
        </div>
        <div className="text-right space-y-14 flex flex-col justify-between items-end">
          <div className="space-y-1">
            <p className="text-slate-600">Ditetapkan di: Jakarta</p>
            <p className="text-slate-600">Pada tanggal: {dateStr}</p>
            <p className="font-bold text-slate-900 mt-1 uppercase">Kepala Badan Kepegawaian Negara</p>
          </div>
          <div>
            <p className="font-extrabold text-slate-900 uppercase underline decoration-slate-900">Dr. Ir. H. Bima Haria Wibisana, M.SIS.</p>
            <p className="text-slate-550 font-mono text-[9px] mt-0.5">NIP. 196107191989031001</p>
          </div>
        </div>
      </div>
    </div>
  );
}

