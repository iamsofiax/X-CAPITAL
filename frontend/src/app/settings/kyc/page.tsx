"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useStore, type KYCSubmission } from "@/store/useStore";
import { useSessionUser } from "@/hooks/useSessionUser";
import { cn } from "@/lib/utils";
import {
  Shield,
  Upload,
  Camera,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  X,
  Eye,
  EyeOff,
  ChevronRight,
  User,
  CreditCard,
  FileCheck,
} from "lucide-react";

/* ═════════════════════════════════════════════════════════════════════════════
   KYC VERIFICATION — /settings/kyc
   Multi-step identity verification form:
   Step 1: Personal Information
   Step 2: Identity Document (SSN + ID upload)
   Step 3: Selfie Verification
   Step 4: Review & Submit
   ═════════════════════════════════════════════════════════════════════════════ */

const uid = () => Math.random().toString(36).slice(2, 10);

type Step = 1 | 2 | 3 | 4;

const ID_TYPES = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID Card" },
] as const;

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Singapore",
  "Switzerland",
  "Netherlands",
  "Ireland",
  "Sweden",
  "Norway",
  "Denmark",
  "New Zealand",
  "Hong Kong",
  "South Korea",
  "India",
  "Brazil",
  "Mexico",
  "UAE",
  "Saudi Arabia",
  "Other",
];

export default function KYCPage() {
  const router = useRouter();
  const { submitKYC, kycSubmissions, addAuditEntry } = useStore();
  const user = useSessionUser();

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSSN, setShowSSN] = useState(false);

  // Form data
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [maidenName, setMaidenName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state_, setState_] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState(user?.country || "United States");

  const [ssn, setSSN] = useState("");
  const [idType, setIdType] =
    useState<KYCSubmission["idType"]>("drivers_license");
  const [idNumber, setIdNumber] = useState("");
  const [idFrontImage, setIdFrontImage] = useState("");
  const [idBackImage, setIdBackImage] = useState("");
  const [selfieImage, setSelfieImage] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const matchesUser = (s: KYCSubmission) =>
    !!user &&
    (s.userId === user.id ||
      s.userEmail.toLowerCase() === user.email.toLowerCase());

  const existingSubmission = kycSubmissions.find(
    (s) =>
      matchesUser(s) &&
      (s.status === "PENDING" || s.status === "APPROVED"),
  );

  const kycApproved = user?.kycStatus === "APPROVED";

  const handleFileUpload = useCallback(
    (setter: (v: string) => void) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          setErrors((prev) => ({ ...prev, file: "File must be under 5MB" }));
          return;
        }
        if (!file.type.startsWith("image/")) {
          setErrors((prev) => ({
            ...prev,
            file: "Only image files are accepted",
          }));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          setter(reader.result as string);
          setErrors((prev) => {
            const next = { ...prev };
            delete next.file;
            return next;
          });
        };
        reader.readAsDataURL(file);
      },
    [],
  );

  const validateStep = (s: Step): boolean => {
    const errs: Record<string, string> = {};

    if (s === 1) {
      if (!firstName.trim()) errs.firstName = "Required";
      if (!lastName.trim()) errs.lastName = "Required";
      if (!dateOfBirth) errs.dateOfBirth = "Required";
      if (!nationality.trim()) errs.nationality = "Required";
      if (!phone.trim()) errs.phone = "Required";
      if (!address.trim()) errs.address = "Required";
      if (!city.trim()) errs.city = "Required";
      if (!state_.trim()) errs.state = "Required";
      if (!zipCode.trim()) errs.zipCode = "Required";
      if (!country) errs.country = "Required";
    }

    if (s === 2) {
      if (!ssn.trim() || ssn.replace(/\D/g, "").length !== 9)
        errs.ssn = "Enter a valid 9-digit SSN";
      if (!idNumber.trim()) errs.idNumber = "Required";
      if (!idFrontImage) errs.idFront = "Upload front of your ID";
      if (idType === "drivers_license" && !idBackImage)
        errs.idBack = "Upload back of your ID";
    }

    if (s === 3) {
      if (!selfieImage) errs.selfie = "Upload a selfie for verification";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 4) as Step);
    }
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const submission: KYCSubmission = {
      id: `kyc-${uid()}`,
      userId: user.id,
      userEmail: user.email,
      userName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      maidenName,
      dateOfBirth,
      nationality,
      phone,
      address,
      city,
      state: state_,
      zipCode,
      country,
      ssn,
      idType,
      idNumber,
      idFrontImage,
      idBackImage: idBackImage || undefined,
      selfieImage,
      status: "PENDING",
      submittedAt: new Date().toISOString(),
    };

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 1200));

    submitKYC(submission);

    addAuditEntry({
      id: uid(),
      time: new Date().toISOString(),
      actor: user.email,
      action: "KYC_SUBMITTED",
      target: `User ${user.email} submitted KYC verification`,
      level: "info",
    });

    setSubmitting(false);
    setSubmitted(true);
  };

  // ── Already submitted or cleared by admin ───────────────────────────────
  if (kycApproved || existingSubmission || submitted) {
    const status = kycApproved
      ? "APPROVED"
      : submitted
        ? "PENDING"
        : existingSubmission!.status;
    return (
      <DashboardLayout
        title="KYC Verification"
        subtitle="Identity verification"
      >
        <div className="max-w-lg mx-auto mt-12">
          <div className="bg-xc-card border border-white/[0.08] rounded-2xl p-5 md:p-8 text-center">
            {status === "PENDING" && (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Verification Pending
                </h2>
                <p className="text-xc-muted text-sm leading-relaxed mb-6">
                  Your KYC documents have been submitted and are under review by
                  our compliance team. This typically takes 1–2 business days.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-300">
                  Submission ID:{" "}
                  <span className="font-mono font-bold">
                    {submitted ? "Processing…" : existingSubmission!.id}
                  </span>
                </div>
              </>
            )}
            {status === "APPROVED" && (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Identity Verified
                </h2>
                <p className="text-xc-muted text-sm leading-relaxed">
                  Your identity has been verified. You have full access to all
                  platform features.
                </p>
              </>
            )}
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 px-6 py-2.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white text-sm font-medium transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Rejected — allow resubmit ────────────────────────────────────────────
  const rejectedSubmission = kycSubmissions.find(
    (s) => matchesUser(s) && s.status === "REJECTED",
  );

  return (
    <DashboardLayout
      title="KYC Verification"
      subtitle="Verify your identity to unlock full platform access"
    >
      <div className="max-w-2xl mx-auto">
        {/* Rejected banner */}
        {rejectedSubmission && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-300">
                Previous submission rejected
              </p>
              <p className="text-xs text-red-400/80 mt-1">
                Reason:{" "}
                {rejectedSubmission.rejectionReason || "Documents not accepted"}
              </p>
              <p className="text-xs text-xc-muted mt-1">
                Please resubmit with corrected information.
              </p>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: "Personal Info", icon: User },
            { n: 2, label: "Identity", icon: CreditCard },
            { n: 3, label: "Selfie", icon: Camera },
            { n: 4, label: "Review", icon: FileCheck },
          ].map(({ n, label, icon: Icon }, i) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => (n < step ? setStep(n as Step) : undefined)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full",
                  n === step
                    ? "bg-white/[0.10] text-white border border-white/[0.15]"
                    : n < step
                      ? "bg-emerald-500/10 text-emerald-400 cursor-pointer hover:bg-emerald-500/20"
                      : "bg-white/[0.03] text-gray-500",
                )}
              >
                {n < step ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Icon className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{n}</span>
              </button>
              {i < 3 && (
                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        <div className="bg-xc-card border border-white/[0.08] rounded-2xl overflow-hidden">
          {/* ═══ Step 1: Personal Information ═══ */}
          {step === 1 && (
            <div className="p-4 md:p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-white/40" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Personal Information
                  </h3>
                  <p className="text-xs text-xc-muted">
                    Legal name as it appears on your government-issued ID
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name *" error={errors.firstName}>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="form-input"
                    placeholder="John"
                  />
                </Field>
                <Field label="Last Name *" error={errors.lastName}>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="form-input"
                    placeholder="Smith"
                  />
                </Field>
              </div>

              <Field label="Maiden Name (if applicable)">
                <input
                  value={maidenName}
                  onChange={(e) => setMaidenName(e.target.value)}
                  className="form-input"
                  placeholder="Previous legal surname"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Date of Birth *" error={errors.dateOfBirth}>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="form-input"
                    max={
                      new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split("T")[0]
                    }
                  />
                </Field>
                <Field label="Nationality *" error={errors.nationality}>
                  <input
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="form-input"
                    placeholder="American"
                  />
                </Field>
              </div>

              <Field label="Phone Number *" error={errors.phone}>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  placeholder="+1 (555) 123-4567"
                />
              </Field>

              <Field label="Street Address *" error={errors.address}>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="form-input"
                  placeholder="123 Main Street, Apt 4B"
                />
              </Field>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="City *" error={errors.city}>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                    placeholder="New York"
                  />
                </Field>
                <Field label="State *" error={errors.state}>
                  <input
                    value={state_}
                    onChange={(e) => setState_(e.target.value)}
                    className="form-input"
                    placeholder="NY"
                  />
                </Field>
                <Field label="ZIP *" error={errors.zipCode}>
                  <input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="form-input"
                    placeholder="10001"
                  />
                </Field>
                <Field label="Country *" error={errors.country}>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* ═══ Step 2: Identity Documents ═══ */}
          {step === 2 && (
            <div className="p-4 md:p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-5 h-5 text-white/40" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Identity Verification
                  </h3>
                  <p className="text-xs text-xc-muted">
                    Social security number and government-issued photo ID
                  </p>
                </div>
              </div>

              <Field label="Social Security Number (SSN) *" error={errors.ssn}>
                <div className="relative">
                  <input
                    type={showSSN ? "text" : "password"}
                    value={ssn}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 9);
                      const formatted =
                        v.length > 5
                          ? `${v.slice(0, 3)}-${v.slice(3, 5)}-${v.slice(5)}`
                          : v.length > 3
                            ? `${v.slice(0, 3)}-${v.slice(3)}`
                            : v;
                      setSSN(formatted);
                    }}
                    className="form-input pr-10"
                    placeholder="XXX-XX-XXXX"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSSN(!showSSN)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showSSN ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Encrypted & securely stored. Required by federal regulation
                  for investment accounts.
                </p>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="ID Type *">
                  <select
                    value={idType}
                    onChange={(e) =>
                      setIdType(e.target.value as KYCSubmission["idType"])
                    }
                    className="form-input"
                  >
                    {ID_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="ID Number *" error={errors.idNumber}>
                  <input
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="form-input"
                    placeholder={
                      idType === "drivers_license" ? "D12345678" : "AB1234567"
                    }
                  />
                </Field>
              </div>

              {/* Front of ID */}
              <Field
                label={`Front of ${ID_TYPES.find((t) => t.value === idType)?.label} *`}
                error={errors.idFront}
              >
                <ImageUpload
                  image={idFrontImage}
                  onClear={() => setIdFrontImage("")}
                  onClick={() => idFrontRef.current?.click()}
                  label="Upload front side"
                />
                <input
                  ref={idFrontRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload(setIdFrontImage)}
                />
              </Field>

              {/* Back of ID (for driver's license) */}
              {idType === "drivers_license" && (
                <Field label="Back of Driver's License *" error={errors.idBack}>
                  <ImageUpload
                    image={idBackImage}
                    onClear={() => setIdBackImage("")}
                    onClick={() => idBackRef.current?.click()}
                    label="Upload back side"
                  />
                  <input
                    ref={idBackRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload(setIdBackImage)}
                  />
                </Field>
              )}

              {errors.file && (
                <p className="text-xs text-red-400">{errors.file}</p>
              )}
            </div>
          )}

          {/* ═══ Step 3: Selfie ═══ */}
          {step === 3 && (
            <div className="p-4 md:p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <Camera className="w-5 h-5 text-white/40" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Selfie Verification
                  </h3>
                  <p className="text-xs text-xc-muted">
                    Upload a clear photo of yourself holding your ID document
                  </p>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Photo requirements:
                </h4>
                <ul className="text-xs text-xc-muted space-y-1.5">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Face clearly visible, well-lit, no sunglasses or hats
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Hold your ID document next to your face
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    ID text and photo must be readable
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Maximum file size: 5MB (JPG, PNG)
                  </li>
                </ul>
              </div>

              <Field label="Selfie with ID *" error={errors.selfie}>
                <ImageUpload
                  image={selfieImage}
                  onClear={() => setSelfieImage("")}
                  onClick={() => selfieRef.current?.click()}
                  label="Upload selfie photo"
                  tall
                />
                <input
                  ref={selfieRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload(setSelfieImage)}
                />
              </Field>
            </div>
          )}

          {/* ═══ Step 4: Review ═══ */}
          {step === 4 && (
            <div className="p-4 md:p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <FileCheck className="w-5 h-5 text-white/40" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Review & Submit
                  </h3>
                  <p className="text-xs text-xc-muted">
                    Please verify all information is correct before submitting
                  </p>
                </div>
              </div>

              {/* Personal */}
              <ReviewSection
                title="Personal Information"
                onEdit={() => setStep(1)}
              >
                <ReviewRow
                  label="Full Name"
                  value={`${firstName} ${lastName}`}
                />
                {maidenName && (
                  <ReviewRow label="Maiden Name" value={maidenName} />
                )}
                <ReviewRow label="Date of Birth" value={dateOfBirth} />
                <ReviewRow label="Nationality" value={nationality} />
                <ReviewRow label="Phone" value={phone} />
                <ReviewRow
                  label="Address"
                  value={`${address}, ${city}, ${state_} ${zipCode}, ${country}`}
                />
              </ReviewSection>

              {/* Identity */}
              <ReviewSection
                title="Identity Documents"
                onEdit={() => setStep(2)}
              >
                <ReviewRow
                  label="SSN"
                  value={`***-**-${ssn.replace(/\D/g, "").slice(-4)}`}
                />
                <ReviewRow
                  label="ID Type"
                  value={
                    ID_TYPES.find((t) => t.value === idType)?.label || idType
                  }
                />
                <ReviewRow label="ID Number" value={idNumber} />
                <div className="flex gap-3 mt-2">
                  {idFrontImage && (
                    <div className="w-24 h-16 rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={idFrontImage}
                        alt="ID Front"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {idBackImage && (
                    <div className="w-24 h-16 rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={idBackImage}
                        alt="ID Back"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </ReviewSection>

              {/* Selfie */}
              <ReviewSection
                title="Selfie Verification"
                onEdit={() => setStep(3)}
              >
                {selfieImage && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={selfieImage}
                      alt="Selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </ReviewSection>

              {/* Disclaimer */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-xs text-xc-muted leading-relaxed">
                <p className="font-semibold text-white/60 mb-1">
                  By submitting, you confirm:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>All information provided is accurate and truthful.</li>
                  <li>The uploaded documents are authentic and not altered.</li>
                  <li>
                    You authorize X-Capital to verify your identity with
                    third-party services.
                  </li>
                  <li>
                    You understand that providing false information may result
                    in account termination.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ═══ Footer navigation ═══ */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-white/[0.02]">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-xc-muted hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <button
                onClick={() => router.push("/settings")}
                className="flex items-center gap-2 text-sm text-xc-muted hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Settings
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-lg bg-white text-black text-sm font-bold hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.08)]"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                  submitting
                    ? "bg-white/20 text-white/40 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)]",
                )}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Submit Verification
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form input styles */}
      <style jsx global>{`
        .form-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          border-color: rgba(255, 255, 255, 0.25);
        }
        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }
        .form-input option {
          background: #1a1a2e;
          color: white;
        }
      `}</style>
    </DashboardLayout>
  );
}

// ── Reusable components ─────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function ImageUpload({
  image,
  onClear,
  onClick,
  label,
  tall,
}: {
  image: string;
  onClear: () => void;
  onClick: () => void;
  label: string;
  tall?: boolean;
}) {
  if (image) {
    return (
      <div
        className={cn(
          "relative rounded-xl overflow-hidden border border-white/10",
          tall ? "h-48" : "h-36",
        )}
      >
        <img src={image} alt={label} className="w-full h-full object-cover" />
        <button
          onClick={onClear}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
          <p className="text-xs text-white/80 font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            Uploaded
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col items-center justify-center gap-2",
        tall ? "h-48" : "h-36",
      )}
    >
      <Upload className="w-6 h-6 text-gray-500" />
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-[10px] text-gray-600">JPG, PNG — max 5MB</span>
    </button>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <button
          onClick={onEdit}
          className="text-xs text-blue-400 hover:text-blue-300 transition"
        >
          Edit
        </button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-white/80 font-medium text-right max-w-[60%] truncate">
        {value}
      </span>
    </div>
  );
}
