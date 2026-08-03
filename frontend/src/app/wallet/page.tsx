"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/Card";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import SubmitButton from "@/components/system/SubmitButton";
import TransactionReceipt from "@/components/system/TransactionReceipt";
import { walletAPI } from "@/lib/api";
import { emitCapitalSignal } from "@/lib/capitalSignal";
import {
  NodeStat,
} from "@/components/node-engine";
import {
  MissionPanel,
  YieldGrowthVisualizer,
} from "@/components/x-engine";
import { CompoundingHeroGlobe3D } from "@/components/x-engine";
import { ENGINE_COPY } from "@/lib/xEngine";
import { useXEngine } from "@/hooks/useXEngine";
import {
  NODE_LABELS,
} from "@/lib/nodeCopy";
import { formatCurrency, cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Building2,
  CreditCard,
  Wallet,
  ShieldCheck,
  Zap,
  TrendingUp,
  Activity,
  ChevronRight,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import type { WalletTransaction } from "@/types";
import { useStore, type PendingTransaction } from "@/store/useStore";
import { useStableBalance } from "@/hooks/useStableBalance";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import Retirement401kConnect from "@/components/retirement/Retirement401kConnect";

type ModalType = "deposit" | "withdraw" | null;
type DepositTab = "wire" | "crypto" | "card";
type DepositStep = 1 | 2 | 3 | 4;
type WithdrawStep = 1 | 2 | 3;

// ─── Supported cryptocurrencies ───────────────────────────────────────────────
const CRYPTOS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    network: "Bitcoin Network",
    grad: "from-orange-500 to-amber-400",
    text: "text-orange-400",
    ring: "ring-orange-500/40",
    rate: 68420,
    min: "0.001 BTC",
    confs: 3,
    time: "~30 min",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    tag: "",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    network: "Ethereum (ERC-20)",
    grad: "from-white/20 to-white/10",
    text: "text-white/70",
    ring: "ring-white/20",
    rate: 3840,
    min: "0.01 ETH",
    confs: 12,
    time: "~5 min",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7cd9E7B3C0",
    tag: "",
  },
  {
    symbol: "USDT",
    name: "Tether",
    network: "TRON (TRC-20)",
    grad: "from-emerald-500 to-green-400",
    text: "text-emerald-400",
    ring: "ring-emerald-500/40",
    rate: 1.0,
    min: "10 USDT",
    confs: 20,
    time: "~3 min",
    address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
    tag: "",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    network: "Ethereum (ERC-20)",
    grad: "from-blue-400 to-white/5",
    text: "text-white/50",
    ring: "ring-white/15/40",
    rate: 1.0,
    min: "10 USDC",
    confs: 12,
    time: "~3 min",
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFtb21eF9e0c8d27Ef",
    tag: "",
  },
  {
    symbol: "SOL",
    name: "Solana",
    network: "Solana Network",
    grad: "from-white/20 to-white/10",
    text: "text-white/60",
    ring: "ring-white/15",
    rate: 182,
    min: "0.1 SOL",
    confs: 1,
    time: "<1 min",
    address: "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
    tag: "",
  },
  {
    symbol: "BNB",
    name: "BNB",
    network: "BNB Chain (BEP-20)",
    grad: "from-yellow-500 to-amber-400",
    text: "text-yellow-400",
    ring: "ring-yellow-500/40",
    rate: 428,
    min: "0.05 BNB",
    confs: 15,
    time: "~2 min",
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFtb21eF9e0c2d47Ab",
    tag: "",
  },
  {
    symbol: "XRP",
    name: "XRP",
    network: "XRP Ledger",
    grad: "from-slate-400 to-slate-300",
    text: "text-slate-300",
    ring: "ring-slate-400/40",
    rate: 0.62,
    min: "20 XRP",
    confs: 1,
    time: "<30 sec",
    address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    tag: "2847361",
  },
];

const EXCHANGES = [
  {
    name: "Coinbase",
    tagline: "Best for beginners · US-regulated · FDIC insured fiat",
    badge: "RECOMMENDED",
    badgeClass: "text-emerald-400 bg-emerald-950/60 border-emerald-700/40",
    fee: "0.5 – 4.5%",
    link: "https://coinbase.com",
    coins: ["BTC", "ETH", "USDT", "USDC", "SOL", "XRP"],
  },
  {
    name: "Binance",
    tagline: "World's largest exchange · Industry-lowest maker fees",
    badge: "MOST VOLUME",
    badgeClass: "text-white/50 bg-white/[0.03] border-white/[0.10]",
    fee: "0.10%",
    link: "https://binance.com",
    coins: ["BTC", "ETH", "USDT", "USDC", "SOL", "BNB", "XRP"],
  },
  {
    name: "Kraken",
    tagline: "Institutional-grade security · SOC 2 Type II certified",
    badge: "INSTITUTIONAL",
    badgeClass: "text-white/60 bg-white/[0.02] border-white/[0.10]",
    fee: "0.16 – 0.26%",
    link: "https://kraken.com",
    coins: ["BTC", "ETH", "USDT", "SOL", "XRP"],
  },
  {
    name: "OKX",
    tagline: "Advanced trading · High limits · 100+ countries",
    badge: "HIGH LIMITS",
    badgeClass: "text-blue-400 bg-blue-950/60 border-blue-700/40",
    fee: "0.08%",
    link: "https://okx.com",
    coins: ["BTC", "ETH", "USDT", "USDC", "SOL", "BNB", "XRP"],
  },
  {
    name: "Gemini",
    tagline: "NY-licensed · SOC 1/2 · Zero fees on Active Trader",
    badge: "MOST SECURE",
    badgeClass: "text-white/50 bg-white/[0.02] border-white/[0.08]",
    fee: "0.03%",
    link: "https://gemini.com",
    coins: ["BTC", "ETH", "USDT", "USDC", "SOL", "XRP"],
  },
];

const TX_ICONS: Record<string, JSX.Element> = {
  DEPOSIT: <ArrowDownLeft className="w-4 h-4 text-xc-green" />,
  WITHDRAWAL: <ArrowUpRight className="w-4 h-4 text-xc-red" />,
  TRADE: <BarChart3 className="w-4 h-4 text-white/70" />,
  FUND_INVESTMENT: <BarChart3 className="w-4 h-4 text-white/50" />,
  FUND_REDEMPTION: <ArrowDownLeft className="w-4 h-4 text-xc-green" />,
  FEE: <ArrowUpRight className="w-4 h-4 text-xc-muted" />,
};

const TX_COLOR: Record<string, string> = {
  DEPOSIT: "text-xc-green",
  WITHDRAWAL: "text-xc-red",
  FUND_REDEMPTION: "text-xc-green",
};

const uid = () => Math.random().toString(36).slice(2, 10);

export default function WalletPage() {
  const {
    wallet,
    setWallet,
    user,
    addPendingTransaction,
    addAdminAlert,
    pendingTransactions,
  } = useStore();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [depositTab, setDepositTab] = useState<DepositTab>("crypto");
  const [depositStep, setDepositStep] = useState<DepositStep>(1);
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>(1);
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTOS[0]);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [previewAlertSent, setPreviewAlertSent] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [showCvc, setShowCvc] = useState(false);

  // Wire fields
  const [wireSenderBank, setWireSenderBank] = useState("");
  const [wireSenderName, setWireSenderName] = useState("");

  // Withdraw fields
  const [withdrawMethod, setWithdrawMethod] = useState<"wire" | "crypto">(
    "wire",
  );
  const [withdrawCrypto, setWithdrawCrypto] = useState(CRYPTOS[0]);
  const [withdrawAddress, setWithdrawAddress] = useState("");

  const wireRef = useMemo(() => "XCAP-" + uid().toUpperCase(), []);
  const withdrawRef = useMemo(() => "XCW-" + uid().toUpperCase(), []);

  // Live crypto prices from CoinGecko
  const { prices: livePrices } = useMarketPrices({
    stocks: false,
    etfs: false,
    refreshInterval: 120_000,
  });

  // Overlay live rates onto the CRYPTOS array
  const liveCryptos = useMemo(
    () =>
      CRYPTOS.map((c) => {
        const live = livePrices[c.symbol];
        return live ? { ...c, rate: live.price } : c;
      }),
    [livePrices],
  );

  // Keep selectedCrypto / withdrawCrypto in sync with live rates
  useEffect(() => {
    const updated = liveCryptos.find((c) => c.symbol === selectedCrypto.symbol);
    if (updated && updated.rate !== selectedCrypto.rate)
      setSelectedCrypto(updated);
  }, [liveCryptos, selectedCrypto.symbol, selectedCrypto.rate]);

  useEffect(() => {
    const updated = liveCryptos.find((c) => c.symbol === withdrawCrypto.symbol);
    if (updated && updated.rate !== withdrawCrypto.rate)
      setWithdrawCrypto(updated);
  }, [liveCryptos, withdrawCrypto.symbol, withdrawCrypto.rate]);

  // My pending txns
  const myPending = useMemo(
    () =>
      pendingTransactions.filter(
        (t) => t.userId === user?.id && t.status === "PENDING",
      ),
    [pendingTransactions, user],
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [walletRes, txRes] = await Promise.allSettled([
          walletAPI.getWallet(),
          walletAPI.getTransactions({ limit: 20 }),
        ]);
        if (walletRes.status === "fulfilled")
          setWallet(walletRes.value.data.data);
        else if (!wallet) {
          setWallet({
            id: "local",
            fiatBalance: user?.balance ?? 0,
            cryptoBalance: 0,
            lockedBalance: 0,
          });
        }
        if (txRes.status === "fulfilled") {
          const txs = txRes.value.data.data.transactions ?? [];
          setTransactions(txs);
        } else {
          setTransactions([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setWallet]);

  const openModal = (type: ModalType, tab: DepositTab = "wire") => {
    setModal(type);
    setDepositTab(tab);
    setDepositStep(1);
    setWithdrawStep(1);
    setAmount("");
    setMessage(null);
    setCopied(false);
    setCardNumber("");
    setCardExpiry("");
    setCardCvc("");
    setCardName("");
    setWireSenderBank("");
    setWireSenderName("");
    setWithdrawAddress("");
    setPreviewAlertSent(false);
  };

  const onAmountBlur = () => {
    if (previewAlertSent || modal !== "deposit") return;
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !user) return;
    addAdminAlert({
      type: "DEPOSIT",
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      amount: parsed,
      method: depositTab,
      priority: "HIGH",
      metadata: { stage: "DETECTED", note: "Amount entered — awaiting confirmation" },
    });
    setPreviewAlertSent(true);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(selectedCrypto.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const submitDeposit = async () => {
    if (processing) return;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    setProcessing(true);

    const details: Record<string, string> = {};
    let method: PendingTransaction["method"] = "wire";

    if (depositTab === "wire") {
      method = "wire";
      details.senderBank = wireSenderBank || "Not specified";
      details.senderName =
        wireSenderName || user?.firstName + " " + user?.lastName;
      details.reference = wireRef;
    } else if (depositTab === "crypto") {
      method = "crypto";
      details.coin = selectedCrypto.symbol;
      details.network = selectedCrypto.network;
      details.depositAddress = selectedCrypto.address;
      details.estimatedUSD = formatCurrency(parsedAmount);
    } else {
      method = "card";
      details.cardLast4 = cardNumber.replace(/\s/g, "").slice(-4);
      details.cardName = cardName;
    }

    const tx: PendingTransaction = {
      id: `ptx-${uid()}`,
      userId: user?.id || "unknown",
      userEmail: user?.email || "unknown",
      userName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      type: "DEPOSIT",
      method,
      amount: parsedAmount,
      currency: depositTab === "crypto" ? selectedCrypto.symbol : "USD",
      details,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    await emitCapitalSignal({
      tx,
      addPendingTransaction,
      addAdminAlert,
      skipAlert: previewAlertSent,
    });
    setMessage({
      type: "success",
      text: NODE_LABELS.signalRouted + ". " + NODE_LABELS.adminClearance,
    });
    setDepositStep(4);
  };

  const submitWithdraw = async () => {
    if (processing) return;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    setProcessing(true);

    const details: Record<string, string> = {};

    if (withdrawMethod === "wire") {
      details.destinationBank = "JPMorgan Chase  ····  8291";
      details.swift = "CHASUS33";
    } else {
      details.coin = withdrawCrypto.symbol;
      details.network = withdrawCrypto.network;
      details.withdrawAddress = withdrawAddress;
    }

    const tx: PendingTransaction = {
      id: `ptx-${uid()}`,
      userId: user?.id || "unknown",
      userEmail: user?.email || "unknown",
      userName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      type: "WITHDRAWAL",
      method: withdrawMethod,
      amount: parsedAmount,
      currency: withdrawMethod === "crypto" ? withdrawCrypto.symbol : "USD",
      details,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    await emitCapitalSignal({ tx, addPendingTransaction, addAdminAlert });
    setWithdrawStep(3);
  };

  const cash = useStableBalance();
  const locked = Number(wallet?.lockedBalance ?? 0);
  const displayTx = transactions;
  const { phaseLabel, isArmed } = useXEngine();
  const isUnfunded = cash <= 0 && myPending.length === 0;

  const balanceHistory = useMemo(() => {
    const data = [];
    let v = cash * 0.4;
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      v *= 1 + (Math.random() - 0.42) * 0.04;
      data.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        balance: Math.round(v),
      });
    }
    return data;
  }, [cash]);

  const flowData = useMemo(() => {
    const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    return months.map((m) => ({
      month: m,
      inflow: Math.round(Math.random() * 80000 + 20000),
      outflow: Math.round(Math.random() * 40000 + 5000),
    }));
  }, []);

  const txBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    displayTx.forEach((tx) => {
      counts[tx.type] = (counts[tx.type] || 0) + Number(tx.amount);
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value: Math.round(value),
    }));
  }, [displayTx]);

  const TX_PIE_COLORS = [
    "#10b981",
    "#ef4444",
    "#7c3aed",
    "#d97706",
    "#06b6d4",
    "#a78bfa",
  ];

  // ─── Step indicator component ─────────────────────────────────────────────
  const StepIndicator = ({
    current,
    total,
    labels,
  }: {
    current: number;
    total: number;
    labels: string[];
  }) => (
    <div className="flex items-center gap-2 mb-5">
      {labels.map((label, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all",
                isDone
                  ? "bg-emerald-500 border-emerald-500 text-black"
                  : isActive
                    ? "bg-white border-white text-black"
                    : "bg-transparent border-white/20 text-white/30",
              )}
            >
              {isDone ? <Check className="w-3.5 h-3.5" /> : step}
            </div>
            <span
              className={cn(
                "text-xs font-medium hidden sm:inline",
                isActive
                  ? "text-white"
                  : isDone
                    ? "text-emerald-400"
                    : "text-white/30",
              )}
            >
              {label}
            </span>
            {i < labels.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px",
                  isDone ? "bg-emerald-500" : "bg-white/10",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // Format card number with spaces
  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + " / " + digits.slice(2);
    return digits;
  };

  return (
    <DashboardLayout
      title="Uplink"
      subtitle="Capital injection · withdrawal · loadout"
    >
      <div className="space-y-8">
        {isUnfunded && (
          <MissionPanel title={ENGINE_COPY.nodeCold} code="UPL-00">
            <p className="text-sm text-white/55 mb-6 leading-relaxed max-w-xl">{ENGINE_COPY.groundHold}</p>
            <a
              href="#deposit-methods"
              className="inline-flex px-6 py-3 bg-white text-black text-sm font-bold rounded-full"
            >
              {ENGINE_COPY.uplink}
            </a>
          </MissionPanel>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
          <NodeStat label="Available cash" value={formatCurrency(cash)} variant="signal" />
          <NodeStat label="Total deposited" value={formatCurrency(cash + locked)} variant="authority" />
          <NodeStat label="Locked in orders" value={formatCurrency(locked)} variant="locked" sub="In active positions" />
          <NodeStat label="Loadout status" value={phaseLabel} variant={isArmed ? "signal" : "locked"} />
        </div>

        {/* ── Pending Transactions Banner ── */}
        {myPending.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-400">
                {NODE_LABELS.depositPending}
              </h3>
              <Badge variant="warning" size="sm">
                {myPending.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {myPending.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-black/20 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm gap-2 sm:gap-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        tx.type === "DEPOSIT" ? "bg-emerald-400" : "bg-red-400",
                      )}
                    />
                    <span className="text-white font-medium">
                      {tx.type === "DEPOSIT" ? "Deposit" : "Withdrawal"}
                    </span>
                    <span className="text-white/40 text-xs">
                      {tx.method.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-mono font-bold">
                      {tx.currency === "USD"
                        ? formatCurrency(tx.amount)
                        : `${tx.amount} ${tx.currency}`}
                    </span>
                    <Badge variant="warning" size="sm">
                      PENDING
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CAPITAL ENGINE CENTERPIECE — same 3D core as the first page ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.32em] text-white/40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Capital Engine · Real-Time Compounding
              </p>
              <p className="text-xs text-xc-muted mt-1">
                A = P(1 + r)<sup>t</sup> — your balance grows every tick, live in 3D
              </p>
            </div>
          </div>
          <CompoundingHeroGlobe3D
            balance={cash}
            dailyRate={0.015}
            isArmed={isArmed && cash > 0}
            nodeId={user?.id}
            className="w-full"
          />
        </div>

        {/* ── COMPACT PROJECTION STRIP (2D) ── */}
        <YieldGrowthVisualizer
          balance={cash}
          dailyRate={0.015}
          tier="Node"
          isArmed={isArmed && cash > 0}
          compact
        />

        {/* ── Balance History + Tx Breakdown Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          <div className="lg:col-span-2 bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white/60" />
                <h3 className="font-black text-white text-base">
                  Balance History
                </h3>
              </div>
              <span className="text-xs text-xc-muted">30 days</span>
            </div>
            <div className="h-[180px] md:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={balanceHistory}
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                >
                  <defs>
                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#ffffff"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      `$${(Number(v ?? 0) / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0a0a0a",
                      border: "1px solid #222",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [
                      formatCurrency(Number(v ?? 0)),
                      "Balance",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fill="url(#balGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4 md:mb-5">
              <Activity className="w-4 h-4 text-white/50" />
              <h3 className="font-black text-white text-base">Tx Breakdown</h3>
            </div>
            <div className="h-[130px] md:h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={txBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {txBreakdown.map((_, i) => (
                      <Cell
                        key={i}
                        fill={TX_PIE_COLORS[i % TX_PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0a0a0a",
                      border: "1px solid #222",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(v: number) => [formatCurrency(Number(v ?? 0))]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-3">
              {txBreakdown.map((item, i) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: TX_PIE_COLORS[i % TX_PIE_COLORS.length],
                      }}
                    />
                    <span className="text-xc-muted capitalize">
                      {item.name.toLowerCase()}
                    </span>
                  </div>
                  <span className="font-mono text-white">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Monthly Cash Flow ── */}
        <div className="bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-black text-white text-base">
                Monthly Cash Flow
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xc-muted">Inflow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xc-muted">Outflow</span>
              </div>
            </div>
          </div>
          <div className="h-[160px] md:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={flowData}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    `$${(Number(v ?? 0) / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a0a0a",
                    border: "1px solid #222",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [formatCurrency(Number(v ?? 0))]}
                />
                <Bar
                  dataKey="inflow"
                  fill="#10b981"
                  opacity={0.7}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="outflow"
                  fill="#ef4444"
                  opacity={0.7}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Funding Methods ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div
            className="bg-xc-card border border-white/[0.10] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/20 transition-colors cursor-pointer group relative overflow-hidden"
            onClick={() => openModal("deposit", "crypto")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
            <div className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              RECOMMENDED
            </div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white/50" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full border text-white/50 bg-white/[0.03] border-white/[0.10] flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> INSTANT
              </span>
            </div>
            <div>
              <div className="font-bold text-white group-hover:text-white/80 transition-colors">
                Cryptocurrency
              </div>
              <div className="text-xs text-xc-muted mt-1">
                BTC · ETH · USDT · USDC · SOL · BNB · XRP — swift confirmation ·
                no conversion fee
              </div>
            </div>
          </div>

          <div
            className="bg-xc-card border border-xc-border rounded-2xl p-5 flex flex-col gap-4 hover:border-white/[0.10] transition-colors cursor-pointer group"
            onClick={() => openModal("deposit", "wire")}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white/60" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full border text-white/60 bg-white/[0.02] border-white/[0.10]">
                WIRE TRANSFER
              </span>
            </div>
            <div>
              <div className="font-bold text-white group-hover:text-white/80 transition-colors">
                Bank / Wire Transfer
              </div>
              <div className="text-xs text-xc-muted mt-1">
                SWIFT · SEPA · ACH — $10 min · 1–3 business days · No fee above
                $10k
              </div>
            </div>
          </div>

          <div
            className="bg-xc-card border border-xc-border rounded-2xl p-5 flex flex-col gap-4 hover:border-white/[0.10] transition-colors cursor-pointer group"
            onClick={() => openModal("deposit", "card")}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white/50" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full border text-white/60 bg-white/[0.02] border-white/[0.10]">
                DEBIT / CREDIT
              </span>
            </div>
            <div>
              <div className="font-bold text-white group-hover:text-white/80 transition-colors">
                Debit / Credit Card
              </div>
              <div className="text-xs text-xc-muted mt-1">
                Visa · Mastercard — instant · 2.9% fee · $50k daily limit
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => openModal("deposit", "crypto")}
            icon={<ArrowDownLeft className="w-4 h-4" />}
          >
            Deposit Funds
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => openModal("withdraw")}
            icon={<ArrowUpRight className="w-4 h-4" />}
          >
            Withdraw
          </Button>
        </div>

        {/* ── 401(k) Connect — senior-friendly ── */}
        <Retirement401kConnect />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DEPOSIT MODAL — Multi-Step
          ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={modal === "deposit"}
        onClose={() => setModal(null)}
        title={depositStep === 4 ? "Transaction Submitted" : "Deposit Funds"}
        subtitle={
          depositStep === 4
            ? "Awaiting admin approval"
            : "Choose your preferred funding method"
        }
        size="xl"
      >
        <div className="space-y-5">
          {depositStep < 4 && (
            <>
              {/* Tab switcher */}
              <div className="flex gap-2 bg-xc-dark/60 p-1 rounded-xl border border-xc-border">
                {[
                  {
                    key: "wire" as const,
                    icon: Building2,
                    label: "Bank / Wire",
                  },
                  { key: "crypto" as const, icon: Wallet, label: "Crypto" },
                  {
                    key: "card" as const,
                    icon: CreditCard,
                    label: "Debit Card",
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setDepositTab(tab.key);
                      setDepositStep(1);
                      setAmount("");
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                      depositTab === tab.key
                        ? "bg-white/[0.08] text-white shadow-lg"
                        : "text-xc-muted hover:text-white",
                    )}
                  >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
                ))}
              </div>

              {/* ── WIRE TRANSFER STEPS ── */}
              {depositTab === "wire" && (
                <>
                  <StepIndicator
                    current={depositStep}
                    total={3}
                    labels={["Amount", "Details", "Confirm"]}
                  />

                  {depositStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-xc-muted mb-1.5">
                          Amount (USD)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xc-muted font-mono">
                            $
                          </span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onBlur={onAmountBlur}
                            placeholder="0.00"
                            autoFocus
                            className="w-full bg-xc-dark/60 border border-xc-border rounded-xl pl-7 pr-4 py-3 text-sm font-mono text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-white/30"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {[10000, 25000, 50000, 100000].map((v) => (
                          <button
                            key={v}
                            onClick={() => setAmount(String(v))}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-xc-muted hover:text-white transition-all"
                          >
                            {formatCurrency(v)}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() =>
                          parseFloat(amount) > 0 && setDepositStep(2)
                        }
                        disabled={
                          !parseFloat(amount) || parseFloat(amount) <= 0
                        }
                        icon={<ChevronRight className="w-4 h-4" />}
                      >
                        Continue
                      </Button>
                    </div>
                  )}

                  {depositStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-xc-muted mb-1.5">
                          Your Bank Name
                        </label>
                        <input
                          type="text"
                          value={wireSenderBank}
                          onChange={(e) => setWireSenderBank(e.target.value)}
                          placeholder="e.g. Chase, Bank of America"
                          className="w-full bg-xc-dark/60 border border-xc-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-xc-muted mb-1.5">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          value={wireSenderName}
                          onChange={(e) => setWireSenderName(e.target.value)}
                          placeholder={`${user?.firstName || ""} ${user?.lastName || ""}`}
                          className="w-full bg-xc-dark/60 border border-xc-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-white/30"
                        />
                      </div>
                      <div className="bg-xc-dark/60 border border-xc-border rounded-xl p-5 space-y-3">
                        <div className="text-xs font-bold text-xc-muted uppercase tracking-wider mb-3">
                          Wire Instructions — Send To
                        </div>
                        {(
                          [
                            ["Bank Name", "JPMorgan Chase Bank, N.A."],
                            ["Account Name", "X-Capital Management LLC"],
                            ["Account Number", "4782910385627"],
                            ["Routing (ABA)", "021000021"],
                            ["SWIFT / BIC", "CHASUS33"],
                            [
                              "Bank Address",
                              "383 Madison Ave, New York, NY 10017",
                            ],
                            ["Reference", wireRef],
                          ] as [string, string][]
                        ).map(([label, value]) => (
                          <div
                            key={label}
                            className="flex justify-between text-xs gap-4"
                          >
                            <span className="text-xc-muted shrink-0">
                              {label}
                            </span>
                            <span className="text-white font-mono text-right">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        Include your reference code{" "}
                        <span className="font-mono font-bold">
                          {wireRef}
                        </span>{" "}
                        in the wire memo.
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => setDepositStep(2)}
                          icon={<ArrowLeft className="w-4 h-4" />}
                        >
                          Back
                        </Button>
                        <SubmitButton
                          fullWidth
                          loading={processing}
                          loadingLabel="Routing Signal…"
                          onClick={submitDeposit}
                          icon={<ShieldCheck className="w-4 h-4" />}
                        >
                          Submit Deposit Request
                        </SubmitButton>
                      </div>
                    </div>
                  )}

                  {depositStep === 3 && (
                    <div className="space-y-4">
                      <div className="bg-xc-dark/60 border border-xc-border rounded-xl p-5 space-y-3">
                        <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                          Deposit Summary
                        </div>
                        {(
                          [
                            ["Method", "Bank / Wire Transfer"],
                            ["Amount", formatCurrency(parseFloat(amount))],
                            ["Your Bank", wireSenderBank || "Not specified"],
                            [
                              "Account Holder",
                              wireSenderName ||
                                `${user?.firstName || ""} ${user?.lastName || ""}`,
                            ],
                            ["Reference", wireRef],
                            [
                              "Processing",
                              "1–3 business days (after admin approval)",
                            ],
                            [
                              "Fee",
                              parseFloat(amount) >= 10000
                                ? "None"
                                : "$25 wire fee",
                            ],
                          ] as [string, string][]
                        ).map(([l, v]) => (
                          <div
                            key={l}
                            className="flex justify-between text-xs gap-4"
                          >
                            <span className="text-xc-muted">{l}</span>
                            <span className="text-white font-medium text-right">
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start gap-2 text-xs text-white/50 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2">
                        <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        Your deposit will be held for admin verification before
                        funds are credited to your account.
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => setDepositStep(2)}
                          icon={<ArrowLeft className="w-4 h-4" />}
                        >
                          Back
                        </Button>
                        <SubmitButton
                          fullWidth
                          loading={processing}
                          loadingLabel="Routing Signal…"
                          onClick={submitDeposit}
                          icon={<ShieldCheck className="w-4 h-4" />}
                        >
                          Submit Deposit Request
                        </SubmitButton>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── CRYPTO DEPOSIT STEPS ── */}
              {depositTab === "crypto" && (
                <>
                  <StepIndicator
                    current={depositStep}
                    total={3}
                    labels={["Select Coin", "Send Funds", "Confirm"]}
                  />

                  {depositStep === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-7 gap-2">
                        {liveCryptos.map((c) => (
                          <button
                            key={c.symbol}
                            onClick={() => {
                              setSelectedCrypto(c);
                              setCopied(false);
                            }}
                            className={cn(
                              "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-bold transition-all",
                              selectedCrypto.symbol === c.symbol
                                ? `bg-gradient-to-br ${c.grad} border-transparent text-white shadow-lg scale-105`
                                : "bg-white/5 border-xc-border text-xc-muted hover:text-white hover:border-white/20",
                            )}
                          >
                            {c.symbol}
                          </button>
                        ))}
                      </div>

                      <div
                        className={cn(
                          "rounded-2xl border p-4 space-y-4 transition-all",
                          selectedCrypto.ring,
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={cn(
                                "text-lg font-black",
                                selectedCrypto.text,
                              )}
                            >
                              {selectedCrypto.name}
                            </div>
                            <div className="text-xs text-xc-muted">
                              {selectedCrypto.network}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-xc-muted uppercase tracking-wider">
                              Current Rate
                            </div>
                            <div className="text-sm font-mono font-bold text-white">
                              {selectedCrypto.rate >= 1
                                ? formatCurrency(selectedCrypto.rate)
                                : `$${selectedCrypto.rate}`}{" "}
                              / {selectedCrypto.symbol}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {(
                            [
                              ["Min Deposit", selectedCrypto.min],
                              ["Confirmations", String(selectedCrypto.confs)],
                              ["Est. Time", selectedCrypto.time],
                              [
                                "Network",
                                selectedCrypto.network.split(" (")[0],
                              ],
                            ] as [string, string][]
                          ).map(([label, val]) => (
                            <div
                              key={label}
                              className="bg-xc-dark/60 rounded-xl p-2.5 text-center"
                            >
                              <div className="text-xs text-xc-muted mb-1">
                                {label}
                              </div>
                              <div className="text-xs font-semibold text-white">
                                {val}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-xc-muted mb-1.5">
                          Amount ({selectedCrypto.symbol})
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-xc-dark/60 border border-xc-border rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-white/30"
                        />
                        {amount && parseFloat(amount) > 0 && (
                          <div className="text-xs text-xc-muted mt-1">
                            ≈{" "}
                            {formatCurrency(
                              parseFloat(amount) * selectedCrypto.rate,
                            )}{" "}
                            USD
                          </div>
                        )}
                      </div>

                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() =>
                          parseFloat(amount) > 0 && setDepositStep(2)
                        }
                        disabled={
                          !parseFloat(amount) || parseFloat(amount) <= 0
                        }
                        icon={<ChevronRight className="w-4 h-4" />}
                      >
                        Continue — Get Address
                      </Button>
                    </div>
                  )}

                  {depositStep === 2 && (
                    <div className="space-y-4">
                      <div
                        className={cn(
                          "rounded-2xl border p-4 space-y-4",
                          selectedCrypto.ring,
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={cn(
                              "text-lg font-black",
                              selectedCrypto.text,
                            )}
                          >
                            {selectedCrypto.name}
                          </div>
                          <div className="text-sm font-mono text-white">
                            {amount} {selectedCrypto.symbol}
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="text-xs text-xc-muted font-semibold uppercase tracking-wider">
                              Deposit Address
                            </div>
                            <div className="bg-xc-dark/80 border border-xc-border rounded-xl p-3 font-mono text-xs text-white break-all leading-relaxed select-all">
                              {selectedCrypto.address}
                            </div>
                            {selectedCrypto.tag && (
                              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                                <span className="text-xs text-white/50 font-semibold">
                                  MEMO / TAG Required
                                </span>
                                <span className="font-mono text-xs text-white font-bold">
                                  {selectedCrypto.tag}
                                </span>
                              </div>
                            )}
                            <button
                              onClick={copyAddress}
                              className={cn(
                                "w-full py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2",
                                copied
                                  ? "bg-emerald-950/40 border-emerald-700/40 text-emerald-400"
                                  : "bg-white/5 border-xc-border text-xc-muted hover:text-white hover:border-white/20",
                              )}
                            >
                              {copied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Address
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" /> Copy Address
                                </>
                              )}
                            </button>
                          </div>
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <div className="text-xs text-xc-muted">
                              Scan to Deposit
                            </div>
                            <div className="bg-white p-2 rounded-xl">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(selectedCrypto.address)}`}
                                alt={`${selectedCrypto.symbol} QR code`}
                                width={120}
                                height={120}
                                className="rounded block"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          Send exactly{" "}
                          <span className="font-mono font-bold">
                            {amount} {selectedCrypto.symbol}
                          </span>{" "}
                          to the address above. Sending any other asset will
                          result in permanent loss.
                        </div>
                      </div>

                      {/* Where to buy */}
                      <div>
                        <div className="text-xs font-bold text-xc-muted uppercase tracking-wider mb-2.5">
                          Where to Buy {selectedCrypto.symbol}
                        </div>
                        <div className="space-y-2">
                          {EXCHANGES.filter((ex) =>
                            ex.coins.includes(selectedCrypto.symbol),
                          )
                            .slice(0, 3)
                            .map((ex) => (
                              <a
                                key={ex.name}
                                href={ex.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-xc-dark/60 border border-xc-border hover:border-white/20 rounded-xl px-4 py-3 transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-black text-white">
                                    {ex.name.charAt(0)}
                                  </div>
                                  <div>
                                    <span className="text-sm font-bold text-white">
                                      {ex.name}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-xs font-bold px-1.5 py-0.5 rounded-full border ml-2",
                                        ex.badgeClass,
                                      )}
                                    >
                                      {ex.badge}
                                    </span>
                                  </div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-xc-muted group-hover:text-white transition-colors" />
                              </a>
                            ))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => setDepositStep(1)}
                          icon={<ArrowLeft className="w-4 h-4" />}
                        >
                          Back
                        </Button>
                        <Button
                          variant="primary"
                          className="flex-1"
                          onClick={() => setDepositStep(3)}
                          icon={<ChevronRight className="w-4 h-4" />}
                        >
                          I&apos;ve Sent the Funds
                        </Button>
                      </div>
                    </div>
                  )}

                  {depositStep === 3 && (
                    <div className="space-y-4">
                      <div className="bg-xc-dark/60 border border-xc-border rounded-xl p-5 space-y-3">
                        <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                          Deposit Summary
                        </div>
                        {(
                          [
                            [
                              "Coin",
                              `${selectedCrypto.name} (${selectedCrypto.symbol})`,
                            ],
                            ["Amount", `${amount} ${selectedCrypto.symbol}`],
                            [
                              "USD Value",
                              formatCurrency(
                                parseFloat(amount || "0") * selectedCrypto.rate,
                              ),
                            ],
                            ["Network", selectedCrypto.network],
                            [
                              "Confirmations Required",
                              String(selectedCrypto.confs),
                            ],
                            [
                              "Est. Time",
                              selectedCrypto.time + " (after admin approval)",
                            ],
                          ] as [string, string][]
                        ).map(([l, v]) => (
                          <div
                            key={l}
                            className="flex justify-between text-xs gap-4"
                          >
                            <span className="text-xc-muted">{l}</span>
                            <span className="text-white font-medium text-right">
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start gap-2 text-xs text-white/50 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2">
                        <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        Your deposit will be verified by our admin team before
                        funds are credited.
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => setDepositStep(2)}
                          icon={<ArrowLeft className="w-4 h-4" />}
                        >
                          Back
                        </Button>
                        <SubmitButton
                          fullWidth
                          loading={processing}
                          loadingLabel="Routing Signal…"
                          onClick={submitDeposit}
                          icon={<ShieldCheck className="w-4 h-4" />}
                        >
                          Submit for Approval
                        </SubmitButton>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── DEBIT CARD STEPS ── */}
              {depositTab === "card" && (
                <>
                  <StepIndicator
                    current={depositStep}
                    total={3}
                    labels={["Card Info", "Amount", "Confirm"]}
                  />

                  {depositStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-xc-muted mb-1.5">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Name on card"
                          className="w-full bg-xc-dark/60 border border-xc-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-xc-muted mb-1.5">
                          Card Number
                        </label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) =>
                              setCardNumber(formatCardNumber(e.target.value))
                            }
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            className="w-full bg-xc-dark/60 border border-xc-border rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-white/30 tracking-wider"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-xc-muted mb-1.5">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) =>
                              setCardExpiry(formatExpiry(e.target.value))
                            }
                            placeholder="MM / YY"
                            maxLength={7}
                            className="w-full bg-xc-dark/60 border border-xc-border rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-white/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-xc-muted mb-1.5">
                            CVC
                          </label>
                          <div className="relative">
                            <input
                              type={showCvc ? "text" : "password"}
                              value={cardCvc}
                              onChange={(e) =>
                                setCardCvc(
                                  e.target.value.replace(/\D/g, "").slice(0, 4),
                                )
                              }
                              placeholder="···"
                              maxLength={4}
                              className="w-full bg-xc-dark/60 border border-xc-border rounded-xl px-4 pr-10 py-3 text-sm font-mono text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-white/30"
                            />
                            <button
                              onClick={() => setShowCvc(!showCvc)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-xc-muted hover:text-white"
                            >
                              {showCvc ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-white/40 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2">
                        <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        Your card details are encrypted end-to-end. We never
                        store full card numbers.
                      </div>
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() =>
                          cardNumber.replace(/\s/g, "").length >= 15 &&
                          cardExpiry.length >= 5 &&
                          cardCvc.length >= 3 &&
                          cardName.length > 0 &&
                          setDepositStep(2)
                        }
                        disabled={
                          cardNumber.replace(/\s/g, "").length < 15 ||
                          cardExpiry.length < 5 ||
                          cardCvc.length < 3 ||
                          !cardName
                        }
                        icon={<ChevronRight className="w-4 h-4" />}
                      >
                        Continue
                      </Button>
                    </div>
                  )}

                  {depositStep === 2 && (
                    <div className="space-y-4">
                      <div className="bg-xc-dark/60 border border-xc-border rounded-xl px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-white/40" />
                          <span className="text-sm text-white font-mono">
                            ···· ···· ····{" "}
                            {cardNumber.replace(/\s/g, "").slice(-4)}
                          </span>
                        </div>
                        <button
                          onClick={() => setDepositStep(1)}
                          className="text-xs text-white/40 hover:text-white"
                        >
                          Change
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-xc-muted mb-1.5">
                          Amount (USD)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xc-muted font-mono">
                            $
                          </span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onBlur={onAmountBlur}
                            placeholder="0.00"
                            autoFocus
                            className="w-full bg-xc-dark/60 border border-xc-border rounded-xl pl-7 pr-4 py-3 text-sm font-mono text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-white/30"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {[1000, 5000, 10000, 25000].map((v) => (
                          <button
                            key={v}
                            onClick={() => setAmount(String(v))}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-xc-muted hover:text-white transition-all"
                          >
                            {formatCurrency(v)}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-xc-muted bg-xc-dark/40 rounded-xl px-3 py-2">
                        <span>Processing fee (2.9%)</span>
                        <span className="text-white font-mono">
                          {formatCurrency(parseFloat(amount || "0") * 0.029)}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => setDepositStep(1)}
                          icon={<ArrowLeft className="w-4 h-4" />}
                        >
                          Back
                        </Button>
                        <Button
                          variant="primary"
                          className="flex-1"
                          onClick={() =>
                            parseFloat(amount) > 0 && setDepositStep(3)
                          }
                          disabled={
                            !parseFloat(amount) || parseFloat(amount) <= 0
                          }
                          icon={<ChevronRight className="w-4 h-4" />}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  )}

                  {depositStep === 3 && (
                    <div className="space-y-4">
                      <div className="bg-xc-dark/60 border border-xc-border rounded-xl p-5 space-y-3">
                        <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                          Deposit Summary
                        </div>
                        {(
                          [
                            ["Method", "Debit / Credit Card"],
                            [
                              "Card",
                              `····  ${cardNumber.replace(/\s/g, "").slice(-4)}`,
                            ],
                            ["Cardholder", cardName],
                            [
                              "Deposit Amount",
                              formatCurrency(parseFloat(amount)),
                            ],
                            [
                              "Processing Fee",
                              formatCurrency(parseFloat(amount || "0") * 0.029),
                            ],
                            [
                              "Total Charged",
                              formatCurrency(parseFloat(amount || "0") * 1.029),
                            ],
                            ["Processing", "Instant (after admin approval)"],
                          ] as [string, string][]
                        ).map(([l, v]) => (
                          <div
                            key={l}
                            className="flex justify-between text-xs gap-4"
                          >
                            <span className="text-xc-muted">{l}</span>
                            <span className="text-white font-medium text-right">
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start gap-2 text-xs text-white/50 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2">
                        <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        Your deposit will be held for admin verification before
                        funds are credited to your account.
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => setDepositStep(2)}
                          icon={<ArrowLeft className="w-4 h-4" />}
                        >
                          Back
                        </Button>
                        <SubmitButton
                          fullWidth
                          loading={processing}
                          loadingLabel="Routing Signal…"
                          onClick={submitDeposit}
                          icon={<ShieldCheck className="w-4 h-4" />}
                        >
                          Submit Deposit Request
                        </SubmitButton>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── SUCCESS / PENDING SCREEN + PRINTABLE RECEIPT ── */}
          {depositStep === 4 && (
            <div className="space-y-4">
              <div className="text-center pt-4 space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                  <Clock className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Deposit Submitted
                  </h3>
                  <p className="text-sm text-xc-muted mt-1">
                    Your deposit request has been routed for admin clearance.
                  </p>
                </div>
              </div>
              <TransactionReceipt
                title="Deposit Signal Routed"
                subtitle="Capital Injection"
                reference={wireRef}
                createdAt={new Date().toISOString()}
                amountLabel="Deposit Amount"
                amountValue={
                  depositTab === "crypto"
                    ? `${amount} ${selectedCrypto.symbol}`
                    : formatCurrency(parseFloat(amount || "0"))
                }
                status="PENDING"
                items={[
                  {
                    label: "Method",
                    value:
                      depositTab === "wire"
                        ? "Bank / Wire Transfer"
                        : depositTab === "crypto"
                          ? `${selectedCrypto.name} (${selectedCrypto.symbol})`
                          : `Debit Card ···· ${cardNumber.replace(/\s/g, "").slice(-4)}`,
                  },
                  {
                    label: "USD Value",
                    value:
                      depositTab === "crypto"
                        ? formatCurrency(
                            parseFloat(amount || "0") * selectedCrypto.rate,
                          )
                        : formatCurrency(parseFloat(amount || "0")),
                    mono: true,
                  },
                  ...(depositTab === "wire"
                    ? [
                        {
                          label: "Sender Bank",
                          value: wireSenderBank || "Not specified",
                        },
                        { label: "Reference", value: wireRef, mono: true },
                      ]
                    : depositTab === "crypto"
                      ? [
                          { label: "Network", value: selectedCrypto.network },
                          {
                            label: "Confirmations",
                            value: String(selectedCrypto.confs),
                          },
                        ]
                      : [{ label: "Fee", value: "$0 · waived" }]),
                  { label: "Status", value: "PENDING ADMIN APPROVAL" },
                ]}
              />
              <p className="text-xs text-xc-muted text-center pt-1">
                You will be notified once an admin approves your transaction.
              </p>
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setModal(null)}>
            {depositStep === 4 ? "Done" : "Close"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          WITHDRAW MODAL — Multi-Step
          ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={modal === "withdraw"}
        onClose={() => setModal(null)}
        title={withdrawStep === 3 ? "Withdrawal Submitted" : "Withdraw Funds"}
        subtitle={
          withdrawStep === 3
            ? "Awaiting admin approval"
            : "Transfer funds to your bank or wallet"
        }
      >
        <div className="space-y-4">
          {withdrawStep < 3 && (
            <StepIndicator
              current={withdrawStep}
              total={2}
              labels={["Details", "Confirm"]}
            />
          )}

          {withdrawStep === 1 && (
            <div className="space-y-4">
              {/* Method toggle */}
              <div className="flex gap-2 bg-xc-dark/60 p-1 rounded-xl border border-xc-border">
                <button
                  onClick={() => setWithdrawMethod("wire")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                    withdrawMethod === "wire"
                      ? "bg-white/[0.08] text-white"
                      : "text-xc-muted hover:text-white",
                  )}
                >
                  <Building2 className="w-4 h-4" /> Bank Wire
                </button>
                <button
                  onClick={() => setWithdrawMethod("crypto")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                    withdrawMethod === "crypto"
                      ? "bg-white/[0.08] text-white"
                      : "text-xc-muted hover:text-white",
                  )}
                >
                  <Wallet className="w-4 h-4" /> Crypto
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-xc-muted mb-1.5">
                  Amount (
                  {withdrawMethod === "crypto" ? withdrawCrypto.symbol : "USD"})
                </label>
                <div className="relative">
                  {withdrawMethod === "wire" && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xc-muted font-mono">
                      $
                    </span>
                  )}
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className={cn(
                      "w-full bg-xc-dark/60 border border-xc-border rounded-xl pr-4 py-3 text-sm font-mono text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-white/30",
                      withdrawMethod === "wire" ? "pl-7" : "pl-4",
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {(withdrawMethod === "wire"
                  ? [5000, 10000, 25000, 50000]
                  : [0.1, 0.5, 1, 5]
                ).map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-xc-muted hover:text-white transition-all"
                  >
                    {withdrawMethod === "wire" ? formatCurrency(v) : v}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs bg-xc-dark/40 border border-xc-border/60 rounded-xl p-3">
                <span className="text-xc-muted">Available balance</span>
                <span className="text-white font-semibold font-mono">
                  {formatCurrency(cash)}
                </span>
              </div>

              {withdrawMethod === "wire" ? (
                <div className="bg-xc-dark/40 border border-xc-border/60 rounded-xl p-5 space-y-2">
                  <div className="text-xs font-bold text-xc-muted uppercase tracking-wider mb-2">
                    Destination Account
                  </div>
                  {(
                    [
                      ["Bank", "JPMorgan Chase  ····  8291"],
                      ["Processing Time", "1–2 business days"],
                      ["Fee", "None (GOLD tier benefit)"],
                      ["SWIFT", "CHASUS33"],
                    ] as [string, string][]
                  ).map(([l, v]) => (
                    <div key={l} className="flex justify-between text-xs">
                      <span className="text-xc-muted">{l}</span>
                      <span className="text-white font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {liveCryptos.slice(0, 4).map((c) => (
                      <button
                        key={c.symbol}
                        onClick={() => setWithdrawCrypto(c)}
                        className={cn(
                          "py-2 rounded-xl border text-xs font-bold transition-all text-center",
                          withdrawCrypto.symbol === c.symbol
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-white/5 border-xc-border text-xc-muted hover:text-white",
                        )}
                      >
                        {c.symbol}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-xc-muted mb-1.5">
                      Destination Address
                    </label>
                    <input
                      type="text"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder={`${withdrawCrypto.symbol} wallet address`}
                      className="w-full bg-xc-dark/60 border border-xc-border rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  if (
                    parseFloat(amount) > 0 &&
                    (withdrawMethod === "wire" || withdrawAddress.length > 10)
                  )
                    setWithdrawStep(2);
                }}
                disabled={
                  !parseFloat(amount) ||
                  parseFloat(amount) <= 0 ||
                  (withdrawMethod === "crypto" && withdrawAddress.length < 10)
                }
                icon={<ChevronRight className="w-4 h-4" />}
              >
                Review Withdrawal
              </Button>
            </div>
          )}

          {withdrawStep === 2 && (
            <div className="space-y-4">
              <div className="bg-xc-dark/60 border border-xc-border rounded-xl p-5 space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                  Withdrawal Summary
                </div>
                {withdrawMethod === "wire" ? (
                  <>
                    {(
                      [
                        ["Method", "Bank Wire (ACH)"],
                        ["Amount", formatCurrency(parseFloat(amount))],
                        ["Destination", "JPMorgan Chase  ····  8291"],
                        ["Fee", "None"],
                        [
                          "Processing",
                          "1–2 business days (after admin approval)",
                        ],
                      ] as [string, string][]
                    ).map(([l, v]) => (
                      <div
                        key={l}
                        className="flex justify-between text-xs gap-4"
                      >
                        <span className="text-xc-muted">{l}</span>
                        <span className="text-white font-medium text-right">
                          {v}
                        </span>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {(
                      [
                        [
                          "Method",
                          `${withdrawCrypto.name} (${withdrawCrypto.symbol})`,
                        ],
                        ["Amount", `${amount} ${withdrawCrypto.symbol}`],
                        [
                          "USD Value",
                          formatCurrency(
                            parseFloat(amount || "0") * withdrawCrypto.rate,
                          ),
                        ],
                        [
                          "Address",
                          withdrawAddress.slice(0, 12) +
                            "···" +
                            withdrawAddress.slice(-6),
                        ],
                        ["Network", withdrawCrypto.network],
                        [
                          "Processing",
                          `${withdrawCrypto.time} (after admin approval)`,
                        ],
                      ] as [string, string][]
                    ).map(([l, v]) => (
                      <div
                        key={l}
                        className="flex justify-between text-xs gap-4"
                      >
                        <span className="text-xc-muted">{l}</span>
                        <span className="text-white font-medium text-right">
                          {v}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="flex items-start gap-2 text-xs text-white/50 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2">
                <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Your withdrawal requires admin approval before processing. This
                is for your security.
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setWithdrawStep(1)}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                <SubmitButton
                  fullWidth
                  loading={processing}
                  loadingLabel="Processing Withdrawal…"
                  onClick={submitWithdraw}
                  icon={<ShieldCheck className="w-4 h-4" />}
                >
                  Submit Withdrawal
                </SubmitButton>
              </div>
            </div>
          )}

          {withdrawStep === 3 && (
            <div className="space-y-4">
              <div className="text-center pt-4 space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                  <Clock className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Withdrawal Submitted
                  </h3>
                  <p className="text-sm text-xc-muted mt-1">
                    Your withdrawal request has been routed for admin clearance.
                  </p>
                </div>
              </div>
              <TransactionReceipt
                title="Withdrawal Signal Routed"
                subtitle="Capital Withdrawal"
                reference={withdrawRef}
                createdAt={new Date().toISOString()}
                amountLabel="Withdrawal Amount"
                amountValue={
                  withdrawMethod === "wire"
                    ? formatCurrency(parseFloat(amount || "0"))
                    : `${amount} ${withdrawCrypto.symbol}`
                }
                status="PENDING"
                items={[
                  {
                    label: "Method",
                    value:
                      withdrawMethod === "wire"
                        ? "Bank Wire (ACH)"
                        : `${withdrawCrypto.name} (${withdrawCrypto.symbol})`,
                  },
                  ...(withdrawMethod === "wire"
                    ? [
                        { label: "Destination", value: "JPMorgan Chase ···· 8291" },
                        { label: "SWIFT", value: "CHASUS33", mono: true },
                        {
                          label: "USD Value",
                          value: formatCurrency(parseFloat(amount || "0")),
                          mono: true,
                        },
                      ]
                    : [
                        {
                          label: "Network",
                          value: withdrawCrypto.network,
                        },
                        {
                          label: "Address",
                          value:
                            withdrawAddress.slice(0, 10) +
                            "···" +
                            withdrawAddress.slice(-6),
                          mono: true,
                        },
                        {
                          label: "USD Value",
                          value: formatCurrency(
                            parseFloat(amount || "0") * withdrawCrypto.rate,
                          ),
                          mono: true,
                        },
                      ]),
                  { label: "Status", value: "PENDING ADMIN APPROVAL" },
                ]}
              />
              <p className="text-xs text-xc-muted text-center pt-1">
                You will be notified once an admin approves your withdrawal.
              </p>
            </div>
          )}

          {withdrawStep === 3 && (
            <ModalFooter>
              <Button variant="ghost" onClick={() => setModal(null)}>
                Done
              </Button>
            </ModalFooter>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}

const D = { userId: "demo-user", walletId: "demo-wallet" };
const DEMO_TRANSACTIONS: WalletTransaction[] = [
  {
    ...D,
    id: "1",
    type: "DEPOSIT",
    amount: 50000,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    reference: "WIRE-2026-001",
    metadata: { description: "Wire transfer — JPMorgan Chase" },
  },
  {
    ...D,
    id: "2",
    type: "DEPOSIT",
    amount: 24850,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    reference: "CRYPTO-BTC-002",
    metadata: { description: "Bitcoin deposit — 0.3634 BTC" },
  },
  {
    ...D,
    id: "3",
    type: "TRADE",
    amount: 8750,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    reference: "TRD-003",
    metadata: { description: "BUY 35× NVDA @ $875.39" },
  },
  {
    ...D,
    id: "4",
    type: "FUND_INVESTMENT",
    amount: 25000,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    reference: "FND-004",
    metadata: { description: "Quantum Alpha Fund — subscription" },
  },
  {
    ...D,
    id: "5",
    type: "TRADE",
    amount: 4320,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    reference: "TRD-005",
    metadata: { description: "BUY 10× TSLA @ $432.10" },
  },
  {
    ...D,
    id: "6",
    type: "WITHDRAWAL",
    amount: 15000,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 518400000).toISOString(),
    reference: "WDR-006",
    metadata: { description: "ACH withdrawal — Chase ····8291" },
  },
  {
    ...D,
    id: "7",
    type: "DEPOSIT",
    amount: 100000,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    reference: "WIRE-2026-007",
    metadata: { description: "Wire transfer — Morgan Stanley" },
  },
  {
    ...D,
    id: "8",
    type: "TRADE",
    amount: 1252,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 691200000).toISOString(),
    reference: "TRD-008",
    metadata: { description: "SELL 5× AAPL @ $250.42" },
  },
  {
    ...D,
    id: "9",
    type: "FUND_REDEMPTION",
    amount: 8400,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 777600000).toISOString(),
    reference: "FND-009",
    metadata: { description: "Orbital Income Fund — redemption +12.4%" },
  },
  {
    ...D,
    id: "10",
    type: "FEE",
    amount: 200,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 864000000).toISOString(),
    reference: "FEE-010",
    metadata: { description: "Monthly platform fee — GOLD tier" },
  },
  {
    ...D,
    id: "11",
    type: "DEPOSIT",
    amount: 5000,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 950400000).toISOString(),
    reference: "CRYPTO-ETH-011",
    metadata: { description: "Ethereum deposit — 1.302 ETH" },
  },
  {
    ...D,
    id: "12",
    type: "TRADE",
    amount: 6240,
    status: "PENDING",
    createdAt: new Date(Date.now() - 36000000).toISOString(),
    reference: "TRD-012",
    metadata: { description: "BUY 200× SPY @ $624.00 — pending" },
  },
];
