export const SEPOLIA_CHAIN_ID = 11155111;

export const DEFAULT_SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.trim() ?? "";

export const SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL?.trim() || DEFAULT_SEPOLIA_RPC;

export const START_BLOCK = Number(
  process.env.NEXT_PUBLIC_SEPOLIA_START_BLOCK?.trim() ?? 0
);

export const ASN_MERIT_CONTRACT_ABI = [
  "function bkdAdmin() view returns (address)",
  "function registrasiASN(address _walletASN, string _nama, string _nip, string _jabatanAwal)",
  "function tambahPenilai(address _penilai)",
  "function inputKinerja(address _walletASN, uint256 _poin, string _keterangan)",
  "function promosiJabatan(address _walletASN, string _jabatanBaru, uint256 _syaratPoin)",
  "function lihatProfilASN(address _walletASN) view returns (string, string, uint256, string)",
  "function authorizedEvaluators(address) view returns (bool)",
  "function dataASN(address) view returns (string nama, string nip, string jabatan, uint256 meritPoint, bool isActive, uint256 lastPromoted)",
  "event ASNTerdaftar(address indexed asnWallet, string nama, string nip)",
  "event PoinDitambahkan(address indexed asnWallet, uint256 poin, string alasan, address penilai)",
  "event PromosiJabatan(address indexed asnWallet, string jabatanBaru, uint256 timestamp)",
];
