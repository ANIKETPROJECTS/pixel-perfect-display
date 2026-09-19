import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  attKey,
  createInitialState,
  dateKey,
  type EmployeeDocument,
  employeeDocuments,
  minutesOf,
  taskKey,
  type AttendanceStatus,
  type Department,
  type Employee,
  type JobType,
  type Role,
  type Shift,
  type Supervisor,
  type TaskStatus,
  type TrackerState,
} from "./tracker-data";

const STORAGE_KEY = "pwt-state-v5-registration";

function hydrateState(raw: string): TrackerState {
  const parsed = JSON.parse(raw) as Partial<TrackerState>;
  const seed = createInitialState();
  const merged: TrackerState = {
    ...seed,
    ...parsed,
    taskLogs: { ...seed.taskLogs, ...(parsed.taskLogs ?? {}) },
    attendance: { ...seed.attendance, ...(parsed.attendance ?? {}) },
    employeeDocuments: parsed.employeeDocuments ?? seed.employeeDocuments,
    audit: parsed.audit ?? [],
  };

  return merged;
}

interface Ctx {
  state: TrackerState;
  role: Role;
  setRole: (r: Role) => void;
  supervisorId: string;
  setSupervisorId: (id: string) => void;
  actorName: string;
  today: string;
  now: number;
  toggleTask: (employeeId: string, date: string, time: string) => void;
  setTask: (
    employeeId: string,
    date: string,
    time: string,
    status: TaskStatus,
    remarks?: string,
  ) => void;
  setAttendance: (
    employeeId: string,
    date: string,
    status: AttendanceStatus,
    remarks?: string,
  ) => void;
  upsert: <K extends "departments" | "jobTypes" | "shifts" | "employees" | "supervisors">(
    key: K,
    item: TrackerState[K][number],
  ) => void;
  remove: (
    key: "departments" | "jobTypes" | "shifts" | "employees" | "supervisors" | "employeeDocuments",
    id: string,
  ) => void;
  recordAudit: (what: string) => void;
  reset: () => void;
}

const TrackerContext = createContext<Ctx | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TrackerState>(() => createInitialState());
  const [role, setRole] = useState<Role>("supervisor");
  const [supervisorId, setSupervisorId] = useState("sup1");
  const [now, setNow] = useState(0);
  const today = useMemo(() => dateKey(new Date()), []);

  // hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(hydrateState(raw));
    } catch {
      /* ignore */
    }
    const d = new Date();
    setNow(d.getHours() * 60 + d.getMinutes());
    const t = setInterval(() => {
      const n = new Date();
      setNow(n.getHours() * 60 + n.getMinutes());
    }, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const actorName =
    role === "admin"
      ? "Admin"
      : (state.supervisors.find((s) => s.id === supervisorId)?.name ?? "Supervisor");

  const log = useCallback(
    (s: TrackerState, what: string): TrackerState => ({
      ...s,
      audit: [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          at: new Date().toISOString(),
          who: actorName,
          what,
        },
        ...s.audit,
      ].slice(0, 200),
    }),
    [actorName],
  );

  const setTask = useCallback(
    (
      employeeId: string,
      date: string,
      time: string,
      status: TaskStatus,
      remarks = "",
    ) => {
      setState((s) => {
        const emp = s.employees.find((e) => e.id === employeeId);
        const next = {
          ...s,
          taskLogs: {
            ...s.taskLogs,
            [taskKey(employeeId, date, time)]: {
              status,
              ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
              ...(status !== "pending"
                ? {
                    markedBy: actorName,
                    markedAt: new Date().toTimeString().slice(0, 5),
                  }
                : {}),
            },
          },
        };
        return log(
          next,
          `Task ${time} for ${emp?.name ?? employeeId} set to ${status}${
            remarks.trim() ? " with a remark" : ""
          }`,
        );
      });
    },
    [actorName, log],
  );

  const toggleTask = useCallback(
    (employeeId: string, date: string, time: string) => {
      setState((s) => {
        const current = s.taskLogs[taskKey(employeeId, date, time)]?.status;
        const emp = s.employees.find((e) => e.id === employeeId);
        const nextStatus: TaskStatus = current === "completed" ? "pending" : "completed";
        const next = {
          ...s,
          taskLogs: {
            ...s.taskLogs,
            [taskKey(employeeId, date, time)]: {
              status: nextStatus,
              ...(nextStatus === "completed"
                ? {
                    markedBy: actorName,
                    markedAt: new Date().toTimeString().slice(0, 5),
                  }
                : {}),
            },
          },
        };
        return log(next, `Task ${time} for ${emp?.name ?? employeeId} marked ${nextStatus}`);
      });
    },
    [actorName, log],
  );

  const setAttendance = useCallback(
    (employeeId: string, date: string, status: AttendanceStatus, remarks = "") => {
      setState((s) => {
        const emp = s.employees.find((e) => e.id === employeeId);
        const next = {
          ...s,
          attendance: {
            ...s.attendance,
            [attKey(employeeId, date)]: {
              status,
              ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
              markedBy: actorName,
              markedAt: new Date().toTimeString().slice(0, 5),
            },
          },
        };
        return log(next, `Attendance ${date} for ${emp?.name ?? employeeId} set to ${status}`);
      });
    },
    [actorName, log],
  );

  const upsert = useCallback<Ctx["upsert"]>(
    (key, item) => {
      setState((s) => {
        const list = s[key] as Array<{ id: string }>;
        const exists = list.some((x) => x.id === item.id);
        const nextList = exists
          ? list.map((x) => (x.id === item.id ? item : x))
          : [...list, item];
        return log({ ...s, [key]: nextList } as TrackerState, `${exists ? "Updated" : "Created"} ${key} record`);
      });
    },
    [log],
  );

  const remove = useCallback<Ctx["remove"]>(
    (key, id) => {
      setState((s) => {
        const list = s[key] as Array<{ id: string }>;
        return log(
          { ...s, [key]: list.filter((x) => x.id !== id) } as TrackerState,
          `Deleted ${key} record`,
        );
      });
    },
    [log],
  );

  const recordAudit = useCallback(
    (what: string) => {
      setState((s) => log(s, what));
    },
    [log],
  );

  const reset = useCallback(() => setState(createInitialState()), []);

  const value: Ctx = {
    state,
    role,
    setRole,
    supervisorId,
    setSupervisorId,
    actorName,
    today,
    now,
    toggleTask,
    setTask,
    setAttendance,
    upsert,
    remove,
    recordAudit,
    reset,
  };

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error("useTracker must be used inside TrackerProvider");
  return ctx;
}

/* ---------- derived helpers ---------- */

export function effectiveTaskStatus(
  logStatus: TaskStatus | undefined,
  time: string,
  isToday: boolean,
  now: number,
): TaskStatus | "upcoming" {
  if (logStatus === "completed") return "completed";
  if (logStatus === "missed") return "missed";
  if (logStatus === "needs_redo") return "needs_redo";
  if (!isToday) return logStatus ?? "missed";
  return minutesOf(time) + 30 < now ? "missed" : "pending";
}

export function useLookups() {
  const { state } = useTracker();
  return useMemo(
    () => ({
      dept: (id: string): Department | undefined => state.departments.find((d) => d.id === id),
      job: (id: string): JobType | undefined => state.jobTypes.find((j) => j.id === id),
      shift: (id: string): Shift | undefined => state.shifts.find((s) => s.id === id),
      employee: (id: string): Employee | undefined => state.employees.find((e) => e.id === id),
      supervisor: (id: string): Supervisor | undefined =>
        state.supervisors.find((s) => s.id === id),
    }),
    [state],
  );
}
