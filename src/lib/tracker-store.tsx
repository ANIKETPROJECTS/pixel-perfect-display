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

const STORAGE_KEY = "pwt-state-v5-registration-full-details";
const SECURE_KEY_DB = "pwt-secure-storage";
const SECURE_KEY_STORE = "keys";
let persistenceSequence = 0;

type EncryptedPayload = {
  format: "pwt-aes-gcm-v1";
  iv: string;
  data: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getStorageKey() {
  if (typeof window === "undefined" || !window.crypto?.subtle || !window.indexedDB) {
    throw new Error("Secure browser storage is unavailable.");
  }
  return new Promise<CryptoKey>((resolve, reject) => {
    const request = window.indexedDB.open(SECURE_KEY_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(SECURE_KEY_STORE);
    };
    request.onerror = () => reject(request.error ?? new Error("Could not open secure storage."));
    request.onsuccess = () => {
      const db = request.result;
      const lookup = db.transaction(SECURE_KEY_STORE, "readonly").objectStore(SECURE_KEY_STORE).get("state");
      lookup.onerror = () => {
        db.close();
        reject(lookup.error ?? new Error("Could not read secure storage key."));
      };
      lookup.onsuccess = async () => {
        if (lookup.result) {
          db.close();
          resolve(lookup.result as CryptoKey);
          return;
        }
        try {
          const key = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"],
          );
          const write = db.transaction(SECURE_KEY_STORE, "readwrite");
          write.objectStore(SECURE_KEY_STORE).put(key, "state");
          write.oncomplete = () => {
            db.close();
            resolve(key);
          };
          write.onerror = () => {
            db.close();
            reject(write.error ?? new Error("Could not save secure storage key."));
          };
        } catch (error) {
          db.close();
          reject(error);
        }
      };
    };
  });
}

async function encryptState(value: string) {
  const key = await getStorageKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const data = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(value),
  );
  const payload: EncryptedPayload = {
    format: "pwt-aes-gcm-v1",
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(data)),
  };
  return JSON.stringify(payload);
}

async function decryptState(raw: string) {
  let payload: EncryptedPayload;
  try {
    payload = JSON.parse(raw) as EncryptedPayload;
  } catch {
    return raw;
  }
  if (payload.format !== "pwt-aes-gcm-v1") return raw;
  const key = await getStorageKey();
  const data = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(payload.iv) },
    key,
    base64ToBytes(payload.data),
  );
  return new TextDecoder().decode(data);
}

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
  upsert: <
    K extends "departments" | "jobTypes" | "shifts" | "employees" | "supervisors" | "employeeDocuments"
  >(
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
  const [hydrated, setHydrated] = useState(false);
  const today = useMemo(() => dateKey(new Date()), []);

  // hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw && mounted) setState(hydrateState(await decryptState(raw)));
      } catch (error) {
        console.warn("Saved tracker data could not be decrypted; starting with the demo state.", error);
      } finally {
        if (mounted) setHydrated(true);
      }
    })();
    const d = new Date();
    setNow(d.getHours() * 60 + d.getMinutes());
    const t = setInterval(() => {
      const n = new Date();
      setNow(n.getHours() * 60 + n.getMinutes());
    }, 60000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const sequence = ++persistenceSequence;
    void encryptState(JSON.stringify(state))
      .then((encrypted) => {
        if (sequence === persistenceSequence) localStorage.setItem(STORAGE_KEY, encrypted);
      })
      .catch((error) => {
        console.warn("Tracker data was not persisted because secure storage is unavailable.", error);
      });
  }, [hydrated, state]);

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
