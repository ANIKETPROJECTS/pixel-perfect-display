import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Plus,
  Save,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  attKey,
  dateKey,
  type AttendanceStatus,
  type Employee,
  type EmployeeDocumentType,
  type EmploymentType,
  type Gender,
  type MaritalStatus,
  type MedicalFitnessStatus,
  type PoliceVerificationStatus,
  type TrackerState,
} from "@/lib/tracker-data";
import { useLookups, useTracker } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Platform Workforce Tracker" },
      {
        name: "description",
        content:
          "Manage departments, job schedules, shifts, employees and supervisors, edit attendance and review the audit trail.",
      },
      { property: "og:title", content: "Admin Panel — Platform Workforce Tracker" },
      {
        property: "og:description",
        content:
          "Manage departments, job schedules, shifts, employees and supervisors, edit attendance and review the audit trail.",
      },
    ],
  }),
  component: Admin,
});

const TABS = [
  "Employees",
  "Departments",
  "Job types",
  "Shifts",
  "Supervisors",
  "Attendance",
  "Audit",
] as const;

const ATT_CYCLE: AttendanceStatus[] = ["present", "absent", "half-day", "leave"];
const TAB_HASH: Record<(typeof TABS)[number], string> = {
  Employees: "employees",
  Departments: "departments",
  "Job types": "job-types",
  Shifts: "shifts",
  Supervisors: "supervisors",
  Attendance: "attendance",
  Audit: "audit",
};

function Admin() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Employees");
  const { reset, role } = useTracker();
  const supervisorOnly = role === "supervisor";
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const next = TABS.find((item) => TAB_HASH[item] === hash);
    if (supervisorOnly) setTab("Employees");
    else if (next) setTab(next);
  }, [supervisorOnly]);
  const changeTab = (next: (typeof TABS)[number]) => {
    setTab(next);
    if (typeof window !== "undefined") window.history.replaceState(null, "", `/admin#${TAB_HASH[next]}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {supervisorOnly ? "Supervisor" : "Administration"}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">
          {supervisorOnly ? "Employee registration" : "Manage workforce setup"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {supervisorOnly
            ? "Register and maintain employee onboarding and railway access records."
            : "Keep people, schedules, attendance, and accountability records current."}
        </p>
      </div>
      {!supervisorOnly && <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => changeTab(t)}
            id={TAB_HASH[t]}
            className={cn(
              "min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium",
              tab === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>}

      <section aria-live="polite">
        {tab === "Employees" && <Employees />}
        {tab === "Departments" && <Departments />}
        {tab === "Job types" && <JobTypes />}
        {tab === "Shifts" && <Shifts />}
        {tab === "Supervisors" && <Supervisors />}
        {tab === "Attendance" && <AttendanceGrid />}
        {tab === "Audit" && <Audit />}
      </section>

      {!supervisorOnly && (
        <button
          onClick={() => reset()}
          className="min-h-11 w-full rounded-md border border-danger/40 bg-danger-soft px-3 text-sm font-medium text-danger"
        >
          Reset demo data
        </button>
      )}
    </div>
  );
}

const inputCls = "min-h-11 w-full rounded-md border border-input bg-card px-3 text-sm";
const cardCls = "rounded-lg border border-border bg-card p-3 space-y-2";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-2 sm:grid-cols-2">{children}</div>;
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Delete"
      className="inline-flex size-11 items-center justify-center rounded-md border border-input text-danger"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function Employees() {
  const { state, upsert, remove, recordAudit, actorName } = useTracker();
  const lk = useLookups();
  const [draft, setDraft] = useState<Employee | null>(null);
  const [error, setError] = useState("");
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [screen, setScreen] = useState<"list" | "form" | "profile">("list");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const startNew = () => {
    setError("");
    setDraft(createEmployeeDraft(state));
    setScreen("form");
  };

  const startEdit = (employee: Employee) => {
    setError("");
    setDraft({ ...employee });
    setScreen("form");
  };

  const save = () => {
    if (!draft) return;
    const validation = validateEmployeeRegistration(draft, state.employeeDocuments);
    if (validation) {
      setError(validation);
      return;
    }
    upsert("employees", draft);
    recordAudit(`${state.employees.some((employee) => employee.id === draft.id) ? "Updated" : "Registered"} employee ${draft.name}`);
    setSelectedEmployeeId(draft.id);
    setDraft(null);
    setError("");
    setScreen("profile");
  };

  const toggleReveal = (employee: Employee) => {
    const next = revealedId === employee.id ? null : employee.id;
    setRevealedId(next);
    recordAudit(`${next ? "Viewed" : "Masked"} sensitive registration data for ${employee.name}`);
  };

  if (screen === "form" && draft) {
    return (
      <EmployeeRegistrationForm
        employee={draft}
        documents={state.employeeDocuments.filter((document) => document.employeeId === draft.id)}
        state={state}
        actorName={actorName}
        error={error}
        onChange={setDraft}
        onSave={save}
        onCancel={() => {
          setDraft(null);
          setError("");
          setScreen("list");
        }}
        upsertDocument={(document) => upsert("employeeDocuments", document)}
        removeDocument={(id) => remove("employeeDocuments", id)}
      />
    );
  }

  const selectedEmployee = state.employees.find((employee) => employee.id === selectedEmployeeId);
  if (screen === "profile" && selectedEmployee) {
    return (
      <EmployeeProfile
        employee={selectedEmployee}
        documents={state.employeeDocuments.filter((document) => document.employeeId === selectedEmployee.id)}
        state={state}
        actorName={actorName}
        onBack={() => setScreen("list")}
        onEdit={() => startEdit(selectedEmployee)}
        recordAudit={recordAudit}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Employee registration</h3>
          <p className="text-sm text-muted-foreground">
            Capture onboarding, railway access, statutory, and HRMS handoff details.
          </p>
        </div>
        <button
          onClick={startNew}
          className="inline-flex min-h-11 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          <UserPlus className="size-4" aria-hidden /> Register employee
        </button>
      </div>

      <div className="space-y-2">
        {state.employees.map((employee) => {
          const status = registrationCompleteness(
            employee,
            state.employeeDocuments.filter((document) => document.employeeId === employee.id),
          );
          const revealed = revealedId === employee.id;
          return (
            <div key={employee.id} className={cardCls}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {employee.code} · {employee.hrmsEmployeeId || "HRMS ID pending"} ·{" "}
                    {lk.dept(employee.departmentId)?.name ?? "Department pending"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <CompletenessBadge status={status} />
                  <button
                    onClick={() => {
                      setSelectedEmployeeId(employee.id);
                      setScreen("profile");
                    }}
                    className="min-h-10 rounded-md border border-primary/30 px-3 text-xs font-semibold text-primary"
                  >
                    View profile
                  </button>
                  <button
                    onClick={() => startEdit(employee)}
                    className="min-h-10 rounded-md border border-input px-3 text-xs font-semibold"
                  >
                    Edit registration
                  </button>
                  <DeleteBtn onClick={() => remove("employees", employee.id)} />
                </div>
              </div>
              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>Police: {employee.policeVerificationStatus ?? "Pending details"}</span>
                <span>Medical: {employee.medicalFitnessStatus === "yes" ? "Fit" : "Needs review"}</span>
                <span>Gate pass: {employee.gatePassNumber ? "Recorded" : "Missing"}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  Aadhaar: {revealed ? employee.aadhaarNumber || "Not recorded" : maskSensitive(employee.aadhaarNumber)}
                </span>
                <span className="text-muted-foreground">
                  Bank: {revealed ? employee.bankAccountNumber || "Not recorded" : maskSensitive(employee.bankAccountNumber)}
                </span>
                <button
                  onClick={() => toggleReveal(employee)}
                  className="inline-flex min-h-9 items-center gap-1 rounded-md border border-input px-2 font-medium"
                >
                  {revealed ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
                  {revealed ? "Mask sensitive data" : "Reveal sensitive data"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmployeeProfile({
  employee,
  documents,
  state,
  actorName,
  onBack,
  onEdit,
  recordAudit,
}: {
  employee: Employee;
  documents: Array<{
    id: string;
    employeeId: string;
    documentType: EmployeeDocumentType;
    fileUrl: string;
    uploadedAt: string;
    uploadedBy: string;
    expiryDate?: string;
  }>;
  state: TrackerState;
  actorName: string;
  onBack: () => void;
  onEdit: () => void;
  recordAudit: (what: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const lk = useLookups();
  const completeness = registrationCompleteness(employee, documents);
  const supervisor = state.supervisors.find((item) => item.id === employee.supervisorId)?.name ?? "—";
  const department = lk.dept(employee.departmentId)?.name ?? "—";
  const job = lk.job(employee.jobTypeId)?.title ?? "—";
  const shift = lk.shift(employee.shiftId);

  const toggleReveal = () => {
    const next = !revealed;
    setRevealed(next);
    recordAudit(`${next ? "Viewed" : "Masked"} sensitive profile data for ${employee.name}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <button onClick={onBack} className="mb-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary">
            <ArrowLeft className="size-4" aria-hidden /> Back to employee list
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Employee profile</p>
          <h3 className="mt-1 text-2xl font-bold">{employee.name}</h3>
          <p className="text-sm text-muted-foreground">{employee.code} · {employee.hrmsEmployeeId || "HRMS ID pending"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CompletenessBadge status={completeness} />
          <button onClick={onEdit} className="min-h-10 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
            Edit registration
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <ProfileSection title="A. Personal details">
            <ProfileValue label="Full name" value={employee.name} />
            <ProfileValue label="Father's / husband's name" value={employee.fatherOrHusbandName} />
            <ProfileValue label="Date of birth" value={employee.dateOfBirth} />
            <ProfileValue label="Gender" value={readable(employee.gender)} />
            <ProfileValue label="Blood group" value={employee.bloodGroup} />
            <ProfileValue label="Marital status" value={readable(employee.maritalStatus)} />
            <ProfileValue label="Photograph" value={employee.photographFileName} />
          </ProfileSection>

          <ProfileSection title="B. Contact details">
            <ProfileValue label="Mobile number" value={employee.mobileNumber ?? employee.phone} />
            <ProfileValue label="Alternate mobile" value={employee.alternateMobileNumber} />
            <ProfileValue label="Email" value={employee.email} />
            <ProfileValue label="Emergency contact" value={`${employee.emergencyContactName ?? "—"} · ${employee.emergencyContactNumber ?? "—"}`} />
            <ProfileValue label="Current address" value={employee.currentAddress} wide />
            <ProfileValue label="Permanent address" value={employee.permanentAddress} wide />
          </ProfileSection>

          <ProfileSection title="C. Identity & statutory compliance">
            <ProfileValue label="Aadhaar number" value={revealed ? employee.aadhaarNumber : maskSensitive(employee.aadhaarNumber)} />
            <ProfileValue label="PAN number" value={employee.panNumber} />
            <ProfileValue label="Voter ID" value={employee.voterId} />
            <ProfileValue label="Police verification" value={readable(employee.policeVerificationStatus)} />
            <ProfileValue label="Police certificate number" value={employee.policeVerificationCertificateNumber} />
            <ProfileValue label="Police verification date" value={employee.policeVerificationDate} />
            <ProfileValue label="Medical fitness" value={`${readable(employee.medicalFitnessStatus)}${employee.medicalFitnessDate ? ` · ${employee.medicalFitnessDate}` : ""}`} />
            <ProfileValue label="ESIC number" value={employee.esicNumber} />
            <ProfileValue label="PF / UAN number" value={employee.pfUanNumber} />
          </ProfileSection>

          <ProfileSection title="D. Employment details">
            <ProfileValue label="Employee code" value={employee.code} />
            <ProfileValue label="HRMS employee ID" value={employee.hrmsEmployeeId} />
            <ProfileValue label="Department" value={department} />
            <ProfileValue label="Job type" value={job} />
            <ProfileValue label="Shift" value={shift ? `${shift.name} (${shift.start}–${shift.end})` : "—"} />
            <ProfileValue label="Date of joining" value={employee.joiningDate} />
            <ProfileValue label="Employment type" value={readable(employee.employmentType)} />
            <ProfileValue label="Reporting supervisor" value={supervisor} />
            <ProfileValue label="Railway gate pass / ID card" value={employee.gatePassNumber} />
            <ProfileValue label="Uniform size" value={employee.uniformSize} />
            <ProfileValue label="Work zone" value={employee.zone} />
            <ProfileValue label="Status" value={readable(employee.status)} />
          </ProfileSection>

          <ProfileSection title="E. Bank details">
            <ProfileValue label="Bank account number" value={revealed ? employee.bankAccountNumber : maskSensitive(employee.bankAccountNumber)} />
            <ProfileValue label="IFSC code" value={employee.ifscCode} />
            <ProfileValue label="Bank name & branch" value={employee.bankNameAndBranch} />
            <ProfileValue label="Account holder name" value={employee.accountHolderName} />
            {employee.accountHolderName && employee.name && employee.accountHolderName.trim().toLowerCase() !== employee.name.trim().toLowerCase() && (
              <p className="text-xs text-warning-foreground">Warning: account holder name does not match the employee name.</p>
            )}
            <button onClick={toggleReveal} className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-md border border-input px-2 text-xs font-semibold">
              {revealed ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
              {revealed ? "Mask sensitive values" : `Reveal Aadhaar and bank account (${actorName})`}
            </button>
          </ProfileSection>
        </div>

        <section className="mt-4 border-t border-border pt-4">
          <h4 className="mb-3 font-semibold">F. Submitted documents</h4>
          <div className="grid gap-2 md:grid-cols-2">
            {documentTypes.map(({ type, label }) => {
              const document = documents.find((item) => item.documentType === type);
              return (
                <div key={type} className="flex items-start gap-2 rounded-md border border-border p-3">
                  <FileText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="truncate text-xs text-muted-foreground">{document?.fileUrl ?? "Not submitted"}</p>
                    {document && (
                      <p className="text-[11px] text-muted-foreground">
                        Uploaded {document.uploadedAt.slice(0, 10)} by {document.uploadedBy}
                        {document.expiryDate ? ` · Expires ${document.expiryDate}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border p-3">
      <h4 className="mb-3 font-semibold">{title}</h4>
      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ProfileValue({ label, value, wide = false }: { label: string; value?: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words text-sm">{value || "—"}</p>
    </div>
  );
}

function readable(value?: string) {
  return value ? value.replaceAll("_", " ").replaceAll("-", " ") : "—";
}

function createEmployeeDraft(state: TrackerState): Employee {
  const nextCode = Math.max(
    100,
    ...state.employees.map((employee) => Number(employee.code.replace(/\D/g, "")) || 0),
  ) + 1;
  const departmentId = state.departments[0]?.id ?? "";
  const jobTypeId = state.jobTypes.find((job) => job.departmentId === departmentId)?.id ?? "";
  return {
    id: newId("e"),
    code: `EMP-${nextCode}`,
    hrmsEmployeeId: "",
    name: "",
    departmentId,
    jobTypeId,
    shiftId: state.shifts[0]?.id ?? "",
    phone: "",
    zone: "",
    joiningDate: dateKey(new Date()),
    status: "active",
  };
}

function validateEmployeeRegistration(employee: Employee, documents: { employeeId: string; documentType: EmployeeDocumentType }[]) {
  if (!employee.name.trim() || !employee.fatherOrHusbandName?.trim() || !employee.dateOfBirth || !employee.gender) {
    return "Complete the required personal details before saving.";
  }
  if (!/^\d{10}$/.test(employee.mobileNumber ?? employee.phone.replace(/\D/g, ""))) {
    return "Mobile number must contain exactly 10 digits.";
  }
  if (!employee.emergencyContactName?.trim() || !/^\d{10}$/.test(employee.emergencyContactNumber ?? "")) {
    return "Emergency contact name and a valid 10-digit number are required.";
  }
  if (!employee.currentAddress?.trim()) return "Current address is required.";
  if (!/^\d{12}$/.test(employee.aadhaarNumber ?? "")) return "Aadhaar number must contain exactly 12 digits.";
  if (!employee.policeVerificationStatus) return "Police verification status is required.";
  if (
    employee.policeVerificationStatus === "verified" &&
    (!employee.policeVerificationCertificateNumber?.trim() || !employee.policeVerificationDate)
  ) {
    return "Police verification certificate number and date are required when verified.";
  }
  if (!employee.medicalFitnessStatus || (employee.medicalFitnessStatus === "yes" && !employee.medicalFitnessDate)) {
    return "Medical fitness status and date are required.";
  }
  if (
    !employee.departmentId ||
    !employee.jobTypeId ||
    !employee.shiftId ||
    !employee.joiningDate ||
    !employee.employmentType ||
    !employee.supervisorId ||
    !employee.gatePassNumber?.trim()
  ) {
    return "Complete the required employment and railway access details.";
  }
  const requiredDocuments: EmployeeDocumentType[] = [
    "aadhaar_front",
    "aadhaar_back",
    "police_verification",
    "medical_certificate",
    "address_proof",
  ];
  if (!employee.photographFileName) return "Photograph upload is required.";
  if (!requiredDocuments.every((type) => documents.some((document) => document.documentType === type))) {
    return "Upload all required onboarding documents before saving.";
  }
  return "";
}

function registrationCompleteness(
  employee: Employee,
  documents: { employeeId: string; documentType: EmployeeDocumentType }[],
) {
  const checks = [
    Boolean(employee.fatherOrHusbandName && employee.dateOfBirth && employee.gender && employee.photographFileName),
    Boolean(employee.mobileNumber && employee.emergencyContactName && employee.emergencyContactNumber),
    Boolean(employee.currentAddress),
    Boolean(employee.aadhaarNumber),
    Boolean(
      employee.policeVerificationStatus === "verified" &&
        employee.policeVerificationCertificateNumber &&
        employee.policeVerificationDate,
    ),
    Boolean(employee.medicalFitnessStatus === "yes" && employee.medicalFitnessDate),
    Boolean(employee.departmentId && employee.jobTypeId && employee.shiftId),
    Boolean(employee.joiningDate && employee.employmentType),
    Boolean(employee.supervisorId && employee.gatePassNumber),
    (["aadhaar_front", "aadhaar_back", "police_verification", "medical_certificate", "address_proof"] as const).every(
      (type) => documents.some((document) => document.documentType === type),
    ),
  ];
  return {
    completed: checks.filter(Boolean).length,
    total: checks.length,
    warning: employee.policeVerificationStatus !== "verified" || employee.medicalFitnessStatus !== "yes",
    rejected: employee.policeVerificationStatus === "rejected",
  };
}

function maskSensitive(value?: string) {
  if (!value) return "Not recorded";
  return `${"•".repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`;
}

function CompletenessBadge({
  status,
}: {
  status: ReturnType<typeof registrationCompleteness>;
}) {
  const complete = status.completed === status.total;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
        complete && "bg-success/15 text-success",
        !complete && !status.rejected && "bg-warning-soft text-warning-foreground",
        status.rejected && "bg-danger-soft text-danger",
      )}
    >
      {complete ? <CheckCircle2 className="size-3.5" aria-hidden /> : <AlertTriangle className="size-3.5" aria-hidden />}
      {status.completed}/{status.total} complete
    </span>
  );
}

const documentTypes: Array<{ type: EmployeeDocumentType; label: string; required: boolean }> = [
  { type: "aadhaar_front", label: "Aadhaar card — front", required: true },
  { type: "aadhaar_back", label: "Aadhaar card — back", required: true },
  { type: "police_verification", label: "Police verification certificate", required: true },
  { type: "medical_certificate", label: "Medical fitness certificate", required: true },
  { type: "address_proof", label: "Address proof", required: true },
  { type: "other", label: "Other supporting document", required: false },
];

function EmployeeRegistrationForm({
  employee,
  documents,
  state,
  actorName,
  error,
  onChange,
  onSave,
  onCancel,
  upsertDocument,
  removeDocument,
}: {
  employee: Employee;
  documents: Array<{
    id: string;
    employeeId: string;
    documentType: EmployeeDocumentType;
    fileUrl: string;
    uploadedAt: string;
    uploadedBy: string;
    expiryDate?: string;
  }>;
  state: ReturnType<typeof useTracker>["state"];
  actorName: string;
  error: string;
  onChange: (employee: Employee) => void;
  onSave: () => void;
  onCancel: () => void;
  upsertDocument: (document: (typeof documents)[number]) => void;
  removeDocument: (id: string) => void;
}) {
  const [sameAddress, setSameAddress] = useState(
    Boolean(employee.currentAddress && employee.currentAddress === employee.permanentAddress),
  );
  const jobTypes = state.jobTypes.filter((job) => job.departmentId === employee.departmentId);

  const setField = <K extends keyof Employee>(field: K, value: Employee[K]) => {
    const next = { ...employee, [field]: value };
    if (field === "departmentId") {
      next.jobTypeId = state.jobTypes.find((job) => job.departmentId === value)?.id ?? "";
    }
    if (field === "mobileNumber") next.phone = String(value);
    if (field === "currentAddress" && sameAddress) next.permanentAddress = String(value);
    onChange(next);
  };

  const uploadDocument = (type: EmployeeDocumentType, file?: File) => {
    if (!file) return;
    const existing = documents.find((document) => document.documentType === type);
    upsertDocument({
      id: existing?.id ?? newId("doc"),
      employeeId: employee.id,
      documentType: type,
      fileUrl: file.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: actorName,
      ...(existing?.expiryDate ? { expiryDate: existing.expiryDate } : {}),
    });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
      className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Employee registration</p>
          <h3 className="mt-1 text-lg font-bold">{employee.name || employee.code}</h3>
          <p className="text-xs text-muted-foreground">
            Required fields are validated before saving. Sensitive values are masked in the employee list.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="min-h-10 rounded-md border border-input px-3 text-sm font-semibold">
            Back to employee list
          </button>
          <button type="submit" className="inline-flex min-h-10 items-center gap-1 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
            <Save className="size-4" aria-hidden /> Save registration
          </button>
        </div>
      </div>
      {error && <p className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">{error}</p>}

      <details open className="rounded-lg border border-border bg-card">
        <summary className="cursor-pointer px-3 py-3 font-semibold">A. Personal details</summary>
        <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
          <FormField label="Full name" required>
            <input className={inputCls} value={employee.name} required onChange={(event) => setField("name", event.target.value)} />
          </FormField>
          <FormField label="Father's / husband's name" required>
            <input className={inputCls} value={employee.fatherOrHusbandName ?? ""} required onChange={(event) => setField("fatherOrHusbandName", event.target.value)} />
          </FormField>
          <FormField label="Date of birth" required>
            <input type="date" className={inputCls} value={employee.dateOfBirth ?? ""} required onChange={(event) => setField("dateOfBirth", event.target.value)} />
          </FormField>
          <FormField label="Gender" required>
            <select className={inputCls} value={employee.gender ?? ""} required onChange={(event) => setField("gender", event.target.value as Gender)}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <FormField label="Blood group">
            <input className={inputCls} value={employee.bloodGroup ?? ""} placeholder="e.g. B+" onChange={(event) => setField("bloodGroup", event.target.value)} />
          </FormField>
          <FormField label="Marital status">
            <select className={inputCls} value={employee.maritalStatus ?? ""} onChange={(event) => setField("maritalStatus", (event.target.value || undefined) as MaritalStatus | undefined)}>
              <option value="">Select status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="widowed">Widowed</option>
              <option value="divorced">Divorced</option>
            </select>
          </FormField>
          <FormField label="Photograph" required hint={employee.photographFileName ?? "Upload an image file"}>
            <input type="file" accept="image/*" className={inputCls} required={!employee.photographFileName} onChange={(event) => setField("photographFileName", event.target.files?.[0]?.name ?? employee.photographFileName)} />
          </FormField>
        </div>
      </details>

      <details open className="rounded-lg border border-border bg-card">
        <summary className="cursor-pointer px-3 py-3 font-semibold">B. Contact details</summary>
        <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
          <FormField label="Mobile number" required hint="10 digits">
            <input className={inputCls} inputMode="numeric" pattern="\d{10}" maxLength={10} value={employee.mobileNumber ?? employee.phone.replace(/\D/g, "")} required onChange={(event) => setField("mobileNumber", event.target.value.replace(/\D/g, ""))} />
          </FormField>
          <FormField label="Alternate mobile number">
            <input className={inputCls} inputMode="numeric" maxLength={10} value={employee.alternateMobileNumber ?? ""} onChange={(event) => setField("alternateMobileNumber", event.target.value.replace(/\D/g, ""))} />
          </FormField>
          <FormField label="Email">
            <input type="email" className={inputCls} value={employee.email ?? ""} onChange={(event) => setField("email", event.target.value)} />
          </FormField>
          <FormField label="Emergency contact name" required>
            <input className={inputCls} value={employee.emergencyContactName ?? ""} required onChange={(event) => setField("emergencyContactName", event.target.value)} />
          </FormField>
          <FormField label="Emergency contact number" required>
            <input className={inputCls} inputMode="numeric" pattern="\d{10}" maxLength={10} value={employee.emergencyContactNumber ?? ""} required onChange={(event) => setField("emergencyContactNumber", event.target.value.replace(/\D/g, ""))} />
          </FormField>
          <FormField label="Current address" required span>
            <textarea className={inputCls} rows={2} value={employee.currentAddress ?? ""} required onChange={(event) => setField("currentAddress", event.target.value)} />
          </FormField>
          <FormField label="Permanent address" hint="Optional — same as current can auto-fill" span>
            <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={sameAddress} onChange={(event) => {
                setSameAddress(event.target.checked);
                if (event.target.checked) setField("permanentAddress", employee.currentAddress ?? "");
              }} />
              Same as current address
            </label>
            <textarea className={inputCls} rows={2} value={employee.permanentAddress ?? ""} disabled={sameAddress} onChange={(event) => setField("permanentAddress", event.target.value)} />
          </FormField>
        </div>
      </details>

      <details open className="rounded-lg border border-border bg-card">
        <summary className="cursor-pointer px-3 py-3 font-semibold">C. Identity & statutory compliance</summary>
        <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
          <FormField label="Aadhaar number" required hint="12 digits; masked in list views">
            <input className={inputCls} inputMode="numeric" pattern="\d{12}" maxLength={12} value={employee.aadhaarNumber ?? ""} required onChange={(event) => setField("aadhaarNumber", event.target.value.replace(/\D/g, ""))} />
          </FormField>
          <FormField label="PAN number">
            <input className={inputCls} value={employee.panNumber ?? ""} onChange={(event) => setField("panNumber", event.target.value.toUpperCase())} />
          </FormField>
          <FormField label="Voter ID">
            <input className={inputCls} value={employee.voterId ?? ""} onChange={(event) => setField("voterId", event.target.value.toUpperCase())} />
          </FormField>
          <FormField label="Police verification status" required>
            <select className={inputCls} value={employee.policeVerificationStatus ?? ""} required onChange={(event) => setField("policeVerificationStatus", event.target.value as PoliceVerificationStatus)}>
              <option value="">Select status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </FormField>
          {employee.policeVerificationStatus === "verified" && (
            <>
              <FormField label="Police verification certificate number" required>
                <input className={inputCls} value={employee.policeVerificationCertificateNumber ?? ""} required onChange={(event) => setField("policeVerificationCertificateNumber", event.target.value)} />
              </FormField>
              <FormField label="Police verification date" required>
                <input type="date" className={inputCls} value={employee.policeVerificationDate ?? ""} required onChange={(event) => setField("policeVerificationDate", event.target.value)} />
              </FormField>
            </>
          )}
          <FormField label="Medical fitness status" required>
            <select className={inputCls} value={employee.medicalFitnessStatus ?? ""} required onChange={(event) => setField("medicalFitnessStatus", event.target.value as MedicalFitnessStatus)}>
              <option value="">Select status</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </FormField>
          {employee.medicalFitnessStatus === "yes" && (
            <FormField label="Medical fitness date" required>
              <input type="date" className={inputCls} value={employee.medicalFitnessDate ?? ""} required onChange={(event) => setField("medicalFitnessDate", event.target.value)} />
            </FormField>
          )}
          <FormField label="ESIC number">
            <input className={inputCls} value={employee.esicNumber ?? ""} onChange={(event) => setField("esicNumber", event.target.value)} />
          </FormField>
          <FormField label="PF / UAN number">
            <input className={inputCls} value={employee.pfUanNumber ?? ""} onChange={(event) => setField("pfUanNumber", event.target.value)} />
          </FormField>
        </div>
      </details>

      <details open className="rounded-lg border border-border bg-card">
        <summary className="cursor-pointer px-3 py-3 font-semibold">D. Employment details</summary>
        <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
          <FormField label="Employee code" required>
            <input className={cn(inputCls, "bg-muted")} value={employee.code} readOnly />
          </FormField>
          <FormField label="HRMS employee ID">
            <input className={inputCls} value={employee.hrmsEmployeeId} onChange={(event) => setField("hrmsEmployeeId", event.target.value)} />
          </FormField>
          <FormField label="Department" required>
            <select className={inputCls} value={employee.departmentId} required onChange={(event) => setField("departmentId", event.target.value)}>
              {state.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </FormField>
          <FormField label="Job type" required>
            <select className={inputCls} value={employee.jobTypeId} required onChange={(event) => setField("jobTypeId", event.target.value)}>
              {jobTypes.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
          </FormField>
          <FormField label="Shift" required>
            <select className={inputCls} value={employee.shiftId} required onChange={(event) => setField("shiftId", event.target.value)}>
              {state.shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.name} {shift.start}–{shift.end}</option>)}
            </select>
          </FormField>
          <FormField label="Date of joining" required>
            <input type="date" className={inputCls} value={employee.joiningDate} required onChange={(event) => setField("joiningDate", event.target.value)} />
          </FormField>
          <FormField label="Employment type" required>
            <select className={inputCls} value={employee.employmentType ?? ""} required onChange={(event) => setField("employmentType", event.target.value as EmploymentType)}>
              <option value="">Select type</option>
              <option value="permanent">Permanent</option>
              <option value="contract">Contract</option>
              <option value="daily-wage">Daily-Wage</option>
              <option value="temporary">Temporary</option>
            </select>
          </FormField>
          <FormField label="Reporting supervisor" required>
            <select className={inputCls} value={employee.supervisorId ?? ""} required onChange={(event) => setField("supervisorId", event.target.value)}>
              <option value="">Select supervisor</option>
              {state.supervisors.map((supervisor) => <option key={supervisor.id} value={supervisor.id}>{supervisor.name}</option>)}
            </select>
          </FormField>
          <FormField label="Railway gate pass / ID card number" required>
            <input className={inputCls} value={employee.gatePassNumber ?? ""} required onChange={(event) => setField("gatePassNumber", event.target.value)} />
          </FormField>
          <FormField label="Uniform size">
            <input className={inputCls} value={employee.uniformSize ?? ""} placeholder="S / M / L / XL" onChange={(event) => setField("uniformSize", event.target.value)} />
          </FormField>
          <FormField label="Work zone">
            <input className={inputCls} value={employee.zone} onChange={(event) => setField("zone", event.target.value)} />
          </FormField>
          <FormField label="Status" required>
            <select className={inputCls} value={employee.status} required onChange={(event) => setField("status", event.target.value as Employee["status"])}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </FormField>
        </div>
      </details>

      <details className="rounded-lg border border-border bg-card">
        <summary className="cursor-pointer px-3 py-3 font-semibold">E. Bank details</summary>
        <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
          <FormField label="Bank account number" hint="Masked in list views">
            <input className={inputCls} inputMode="numeric" value={employee.bankAccountNumber ?? ""} onChange={(event) => setField("bankAccountNumber", event.target.value.replace(/\D/g, ""))} />
          </FormField>
          <FormField label="IFSC code">
            <input className={inputCls} value={employee.ifscCode ?? ""} onChange={(event) => setField("ifscCode", event.target.value.toUpperCase())} />
          </FormField>
          <FormField label="Bank name & branch">
            <input className={inputCls} value={employee.bankNameAndBranch ?? ""} onChange={(event) => setField("bankNameAndBranch", event.target.value)} />
          </FormField>
          <FormField label="Account holder name">
            <input className={inputCls} value={employee.accountHolderName ?? ""} onChange={(event) => setField("accountHolderName", event.target.value)} />
            {employee.accountHolderName && employee.name && employee.accountHolderName.trim().toLowerCase() !== employee.name.trim().toLowerCase() && (
              <p className="mt-1 text-xs text-warning-foreground">Warning: account holder name does not match the employee name.</p>
            )}
          </FormField>
        </div>
      </details>

      <details open className="rounded-lg border border-border bg-card">
        <summary className="cursor-pointer px-3 py-3 font-semibold">F. Document uploads</summary>
        <div className="space-y-2 border-t border-border p-3">
          {documentTypes.map(({ type, label, required }) => {
            const document = documents.find((item) => item.documentType === type);
            return (
              <div key={type} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
                <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-medium">{label}{required ? " *" : ""}</p>
                  <p className="text-xs text-muted-foreground">{document?.fileUrl ?? "No file selected"}</p>
                </div>
                <input type="file" className="max-w-full text-xs" onChange={(event) => uploadDocument(type, event.target.files?.[0])} />
                {document?.expiryDate && <span className="text-xs text-muted-foreground">Expires {document.expiryDate}</span>}
                {document && <button type="button" onClick={() => removeDocument(document.id)} className="text-danger" aria-label={`Remove ${label}`}><Trash2 className="size-4" aria-hidden /></button>}
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Uploads are tracked with file metadata in this local workspace; connect production file storage before handling live identity documents.
          </p>
        </div>
      </details>
    </form>
  );
}

function FormField({
  label,
  required = false,
  hint,
  span = false,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  span?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", span && "sm:col-span-2")}>
      <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-foreground">
        {label}{required && <span className="text-danger">*</span>}
        {hint && <span className="font-normal text-muted-foreground">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Departments() {
  const { state, upsert, remove } = useTracker();
  return (
    <div className="space-y-2">
      <button
        onClick={() =>
          upsert("departments", {
            id: newId("d"),
            name: "New Department",
            zone: "",
            group: "station",
          })
        }
        className="inline-flex min-h-11 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        <Plus className="size-4" aria-hidden /> Add department
      </button>
      {state.departments.map((d) => (
        <div key={d.id} className={cardCls}>
          <div className="flex items-center gap-2">
            <input
              className={inputCls}
              value={d.name}
              onChange={(e) => upsert("departments", { ...d, name: e.target.value })}
            />
            <DeleteBtn onClick={() => remove("departments", d.id)} />
          </div>
          <input
            className={inputCls}
            value={d.zone}
            placeholder="Platform / zone"
            onChange={(e) => upsert("departments", { ...d, zone: e.target.value })}
          />
          <select
            className={inputCls}
            value={d.group}
            aria-label={`Department group for ${d.name}`}
            onChange={(e) =>
              upsert("departments", { ...d, group: e.target.value as "station" | "colony" })
            }
          >
            <option value="station">Station</option>
            <option value="colony">Colony</option>
          </select>
        </div>
      ))}
    </div>
  );
}

function JobTypes() {
  const { state, upsert, remove } = useTracker();
  return (
    <div className="space-y-2">
      <button
        onClick={() =>
          upsert("jobTypes", {
            id: newId("j"),
            departmentId: state.departments[0]?.id ?? "",
            title: "New Job Type",
            frequencyPerDay: 1,
            frequencyLabel: "1x/day",
            scheduledTimes: ["09:00"],
          })
        }
        className="inline-flex min-h-11 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        <Plus className="size-4" aria-hidden /> Add job type
      </button>
      {state.jobTypes.map((j) => (
        <div key={j.id} className={cardCls}>
          <div className="flex items-center gap-2">
            <input
              className={inputCls}
              value={j.title}
              onChange={(e) => upsert("jobTypes", { ...j, title: e.target.value })}
            />
            <DeleteBtn onClick={() => remove("jobTypes", j.id)} />
          </div>
          <select
            className={inputCls}
            value={j.departmentId}
            onChange={(e) => upsert("jobTypes", { ...j, departmentId: e.target.value })}
          >
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <Row>
            <input
              type="number"
              min="0"
              className={inputCls}
              value={j.frequencyPerDay}
              aria-label={`Frequency per day for ${j.title}`}
              onChange={(e) =>
                upsert("jobTypes", {
                  ...j,
                  frequencyPerDay: Number.parseInt(e.target.value, 10) || 0,
                })
              }
            />
            <input
              className={inputCls}
              value={j.frequencyLabel}
              placeholder="Frequency label, e.g. Weekly"
              aria-label={`Frequency label for ${j.title}`}
              onChange={(e) => upsert("jobTypes", { ...j, frequencyLabel: e.target.value })}
            />
          </Row>
          <div className="flex flex-wrap items-center gap-2">
            {j.scheduledTimes.map((t, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  type="time"
                  className="min-h-11 rounded-md border border-input bg-card px-2 text-sm"
                  value={t}
                  onChange={(e) => {
                    const times = [...j.scheduledTimes];
                    times[i] = e.target.value;
                    upsert("jobTypes", { ...j, scheduledTimes: times });
                  }}
                />
                <button
                  aria-label="Remove time"
                  className="text-danger"
                  onClick={() =>
                    upsert("jobTypes", {
                      ...j,
                      scheduledTimes: j.scheduledTimes.filter((_, k) => k !== i),
                    })
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                upsert("jobTypes", { ...j, scheduledTimes: [...j.scheduledTimes, "12:00"] })
              }
              className="min-h-11 rounded-md border border-input px-3 text-sm"
            >
              + time
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Frequency: {j.frequencyLabel} · {j.frequencyPerDay} per day metadata
          </p>
        </div>
      ))}
    </div>
  );
}

function Shifts() {
  const { state, upsert, remove } = useTracker();
  return (
    <div className="space-y-2">
      <button
        onClick={() =>
          upsert("shifts", { id: newId("s"), name: "New Shift", start: "09:00", end: "17:00" })
        }
        className="inline-flex min-h-11 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        <Plus className="size-4" aria-hidden /> Add shift
      </button>
      {state.shifts.map((s) => (
        <div key={s.id} className={cardCls}>
          <div className="flex items-center gap-2">
            <input
              className={inputCls}
              value={s.name}
              onChange={(e) => upsert("shifts", { ...s, name: e.target.value })}
            />
            <DeleteBtn onClick={() => remove("shifts", s.id)} />
          </div>
          <Row>
            <input
              type="time"
              className={inputCls}
              value={s.start}
              onChange={(e) => upsert("shifts", { ...s, start: e.target.value })}
            />
            <input
              type="time"
              className={inputCls}
              value={s.end}
              onChange={(e) => upsert("shifts", { ...s, end: e.target.value })}
            />
          </Row>
        </div>
      ))}
    </div>
  );
}

function Supervisors() {
  const { state, upsert, remove } = useTracker();
  return (
    <div className="space-y-2">
      <button
        onClick={() =>
          upsert("supervisors", {
            id: newId("sup"),
            name: "New Supervisor",
            phone: "",
            departmentIds: [],
          })
        }
        className="inline-flex min-h-11 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        <Plus className="size-4" aria-hidden /> Add supervisor
      </button>
      {state.supervisors.map((s) => (
        <div key={s.id} className={cardCls}>
          <div className="flex items-center gap-2">
            <input
              className={inputCls}
              value={s.name}
              onChange={(e) => upsert("supervisors", { ...s, name: e.target.value })}
            />
            <DeleteBtn onClick={() => remove("supervisors", s.id)} />
          </div>
          <input
            className={inputCls}
            value={s.phone}
            placeholder="Phone"
            onChange={(e) => upsert("supervisors", { ...s, phone: e.target.value })}
          />
          <div className="flex flex-wrap gap-2">
            {state.departments.map((d) => {
              const on = s.departmentIds.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() =>
                    upsert("supervisors", {
                      ...s,
                      departmentIds: on
                        ? s.departmentIds.filter((x) => x !== d.id)
                        : [...s.departmentIds, d.id],
                    })
                  }
                  className={cn(
                    "min-h-11 rounded-full border px-3 text-xs font-medium",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {d.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function AttendanceGrid() {
  const { state, setAttendance } = useTracker();
  const [empId, setEmpId] = useState(state.employees[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    dateKey(new Date(now.getFullYear(), now.getMonth(), i + 1)),
  );
  const present = days.filter(
    (d) => state.attendance[attKey(empId, d)]?.status === "present",
  ).length;
  const elapsed = now.getDate();

  return (
    <div className={cardCls}>
      <select className={inputCls} value={empId} onChange={(e) => setEmpId(e.target.value)}>
        {state.employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name} ({e.code})
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        {now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })} · attendance{" "}
        {elapsed ? Math.round((present / elapsed) * 1000) / 10 : 0}% · tap a day to change it
      </p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const st = state.attendance[attKey(empId, d)]?.status;
          const future = i + 1 > elapsed;
          return (
            <button
              key={d}
              disabled={future}
              onClick={() => {
                const next =
                  ATT_CYCLE[(ATT_CYCLE.indexOf(st ?? "leave") + 1) % ATT_CYCLE.length] ?? "present";
                setSelectedDate(d);
                setAttendance(empId, d, next, state.attendance[attKey(empId, d)]?.remarks);
              }}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center rounded text-xs font-medium disabled:opacity-30",
                st === "present" && "bg-success text-success-foreground",
                st === "absent" && "bg-danger text-danger-foreground",
                st === "half-day" && "bg-warning text-warning-foreground",
                st === "leave" && "bg-accent text-accent-foreground",
                !st && "bg-neutral-soft text-muted-foreground",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-xs font-semibold">
            {selectedDate} · {state.attendance[attKey(empId, selectedDate)]?.status ?? "not marked"}
          </p>
          <input
            className={cn(inputCls, "mt-2")}
            value={state.attendance[attKey(empId, selectedDate)]?.remarks ?? ""}
            placeholder="Optional reason, e.g. informed sick or left early"
            onChange={(event) =>
              setAttendance(
                empId,
                selectedDate,
                state.attendance[attKey(empId, selectedDate)]?.status ?? "present",
                event.target.value,
              )
            }
          />
        </div>
      )}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>Green = present</span>
        <span>Red = absent</span>
        <span>Amber = half-day</span>
        <span>Blue = leave</span>
      </div>
    </div>
  );
}

function Audit() {
  const { state } = useTracker();
  if (state.audit.length === 0)
    return (
      <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No changes recorded yet. Marking tasks or editing records will show up here.
      </p>
    );
  return (
    <ul className="space-y-1">
      {state.audit.map((a) => (
        <li key={a.id} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
          <span className="font-medium">{a.who}</span> — {a.what}
          <span className="block text-xs text-muted-foreground">
            {new Date(a.at).toLocaleString("en-IN")}
          </span>
        </li>
      ))}
    </ul>
  );
}
