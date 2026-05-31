"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { NodePanel } from "@/components/node-engine";
import {
  Camera,
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Moon,
  Sun,
  Eye,
  EyeOff,
  ChevronRight,
  Check,
  Lock,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

const TIER_STYLES: Record<string, string> = {
  CORE: "bg-white/10 text-white border border-white/10",
  GOLD: "bg-white/[0.05] text-white/50 border border-white/[0.10]",
  BLACK: "bg-white/[0.06] text-white/60 border border-white/[0.10]",
};

export default function SettingsPage() {
  const { user, updateUser, changePassword, theme, setTheme } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saved, setSaved] = useState(false);

  // Notification preferences (local state)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [tradeNotifs, setTradeNotifs] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(false);

  // Security
  const [showPassword, setShowPassword] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMessage, setPwMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    setPwMessage(null);
    if (!currentPw) {
      setPwMessage({ type: "error", text: "Enter your current password." });
      return;
    }
    if (newPw.length < 6) {
      setPwMessage({
        type: "error",
        text: "New password must be at least 6 characters.",
      });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    setPwLoading(true);
    try {
      const result = await changePassword(currentPw, newPw);
      if (result.success) {
        setPwMessage({
          type: "success",
          text: "Password changed successfully.",
        });
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        setPwMessage({
          type: "error",
          text: result.error || "Failed to change password.",
        });
      }
    } finally {
      setPwLoading(false);
    }
  };

  const handleProfilePicture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      updateUser({ profilePicture: result });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    updateUser({ firstName, lastName, phone: phone || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account">
      <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
        {/* Profile Picture */}
        <NodePanel title="Profile" scanLine={false}>
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center overflow-hidden ring-2 ring-white/10">
                {user.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-white text-2xl font-black">
                    {user.firstName?.[0] ?? ""}
                    {user.lastName?.[0] ?? ""}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleProfilePicture}
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-white font-bold text-lg">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xc-muted text-sm">{user.email}</p>
              <span
                className={cn(
                  "inline-block text-xs px-2 py-0.5 rounded-full font-mono font-bold mt-1",
                  TIER_STYLES[user.tier],
                )}
              >
                {user.tier} Tier
              </span>
            </div>
          </div>
        </NodePanel>

        {/* Personal Info */}
        <section className="bg-xc-card border border-white/[0.08] rounded-2xl p-4 md:p-6">
          <h2 className="text-base font-bold text-white mb-5">
            Personal Information
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-xc-muted mb-1.5 block">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:ring-1 focus:ring-xc-purple/50 focus:border-xc-purple/30 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-xc-muted mb-1.5 block">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:ring-1 focus:ring-xc-purple/50 focus:border-xc-purple/30 transition-all"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-xc-muted mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-xc-muted cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-xc-muted mb-1.5 block">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(optional)"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:ring-1 focus:ring-xc-purple/50 focus:border-xc-purple/30 transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              className={cn(
                "w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-bold transition-all",
                saved
                  ? "bg-xc-green/20 text-xc-green"
                  : "bg-gradient-to-r from-white/20 to-white/5 text-white hover:opacity-90",
              )}
            >
              {saved ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Saved
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-xc-card border border-white/[0.08] rounded-2xl p-4 md:p-6">
          <h2 className="text-base font-bold text-white mb-5">Notifications</h2>
          <div className="space-y-3">
            <ToggleRow
              label="Email notifications"
              description="Receive updates via email"
              checked={emailNotifs}
              onChange={setEmailNotifs}
            />
            <ToggleRow
              label="Push notifications"
              description="Browser push alerts"
              checked={pushNotifs}
              onChange={setPushNotifs}
            />
            <ToggleRow
              label="Trade confirmations"
              description="Get notified on every trade"
              checked={tradeNotifs}
              onChange={setTradeNotifs}
            />
            <ToggleRow
              label="Price alerts"
              description="Alert when assets hit target price"
              checked={priceAlerts}
              onChange={setPriceAlerts}
            />
          </div>
        </section>

        {/* Security */}
        <section className="bg-xc-card border border-white/[0.08] rounded-2xl p-4 md:p-6">
          <h2 className="text-base font-bold text-white mb-5">Security</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-xc-muted mb-1.5 block">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:ring-1 focus:ring-xc-purple/50 focus:border-xc-purple/30 transition-all"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xc-muted hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-xc-muted mb-1.5 block">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:ring-1 focus:ring-xc-purple/50 focus:border-xc-purple/30 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-xc-muted mb-1.5 block">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:ring-1 focus:ring-xc-purple/50 focus:border-xc-purple/30 transition-all"
                />
              </div>
            </div>
            {pwMessage && (
              <div
                className={cn(
                  "text-xs px-3 py-2 rounded-xl border flex items-center gap-2",
                  pwMessage.type === "success"
                    ? "bg-green-950/30 border-green-700/40 text-green-400"
                    : "bg-red-950/30 border-red-700/40 text-red-400",
                )}
              >
                {pwMessage.type === "success" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Shield className="w-3.5 h-3.5" />
                )}
                {pwMessage.text}
              </div>
            )}
            <button
              onClick={handleChangePassword}
              disabled={pwLoading}
              className={cn(
                "w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-bold transition-all",
                "bg-gradient-to-r from-white/20 to-white/5 text-white hover:opacity-90 disabled:opacity-50",
              )}
            >
              {pwLoading ? "Updating..." : "Update Password"}
            </button>
            <div className="pt-2">
              <ToggleRow
                label="Two-factor authentication"
                description="Add an extra layer of security"
                checked={twoFA}
                onChange={setTwoFA}
              />
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-xc-card border border-white/[0.08] rounded-2xl p-4 md:p-6">
          <h2 className="text-base font-bold text-white mb-5">Appearance</h2>
          <p className="text-xs text-xc-muted mb-4">
            Choose your preferred theme for the entire platform.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme("black")}
              className={cn(
                "relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all",
                theme === "black"
                  ? "border-white bg-white/[0.06]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/20",
              )}
            >
              <div className="w-12 h-12 rounded-full bg-black border-2 border-white/20 flex items-center justify-center">
                <Moon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Pure Black</div>
                <div className="text-xs text-xc-muted">Default dark theme</div>
              </div>
              {theme === "black" && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <Check className="w-3 h-3 text-black" />
                </div>
              )}
            </button>
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all",
                theme === "light"
                  ? "border-white bg-white/[0.06]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/20",
              )}
            >
              <div className="w-12 h-12 rounded-full bg-white border-2 border-black/10 flex items-center justify-center">
                <Sun className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Light Mode</div>
                <div className="text-xs text-xc-muted">Clean & bright</div>
              </div>
              {theme === "light" && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <Check className="w-3 h-3 text-black" />
                </div>
              )}
            </button>
          </div>
        </section>

        {/* Account Info */}
        <section className="bg-xc-card border border-white/[0.08] rounded-2xl p-4 md:p-6">
          <h2 className="text-base font-bold text-white mb-5">Account</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs text-xc-muted">KYC Status</p>
                <p
                  className={`text-sm font-semibold mt-0.5 ${
                    user.kycStatus === "APPROVED"
                      ? "text-emerald-400"
                      : user.kycStatus === "PENDING"
                        ? "text-amber-400"
                        : user.kycStatus === "REJECTED"
                          ? "text-red-400"
                          : "text-white/60"
                  }`}
                >
                  {user.kycStatus.replace(/_/g, " ")}
                </p>
              </div>
              {user.kycStatus !== "APPROVED" && (
                <Link
                  href="/settings/kyc"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  {user.kycStatus === "PENDING" ? "View Status" : "Verify Now"}
                </Link>
              )}
            </div>
            <InfoRow
              label="Accreditation"
              value={user.accreditationStatus.replace(/_/g, " ")}
            />
            <InfoRow
              label="Member since"
              value={new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-xc-muted">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors",
          checked ? "bg-xc-purple" : "bg-white/10",
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.08] last:border-0">
      <span className="text-sm text-xc-muted">{label}</span>
      <span className="text-sm font-medium text-white capitalize">
        {value.toLowerCase()}
      </span>
    </div>
  );
}
