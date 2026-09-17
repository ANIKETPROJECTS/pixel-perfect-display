export type Role = "admin" | "supervisor";
export type TaskStatus = "pending" | "completed" | "missed";
export type AttendanceStatus = "present" | "absent" | "half-day" | "leave";

export interface Department {
  id: string;
  name: string;
  zone: string;
}

export interface JobType {
  id: string;
  departmentId: string;
  title: string;
  scheduledTimes: string[];
}

export interface Shift {
  id: string;
  name: string;
  start: string;
  end: string;
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  jobTypeId: string;
  shiftId: string;
  phone: string;
  zone: string;
  joiningDate: string;
  status: "active" | "inactive";
}

export interface Supervisor {
  id: string;
  name: string;
  phone: string;
  departmentIds: string[];
}

export interface TaskLog {
  status: TaskStatus;
  markedBy?: string;
  markedAt?: string;
}

export interface AttendanceEntry {
  status: AttendanceStatus;
  markedBy?: string;
  markedAt?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  who: string;
  what: string;
}

export interface TrackerState {
  departments: Department[];
  jobTypes: JobType[];
  shifts: Shift[];
  employees: Employee[];
  supervisors: Supervisor[];
  taskLogs: Record<string, TaskLog>;
  attendance: Record<string, AttendanceEntry>;
  audit: AuditEntry[];
}

export const departments: Department[] = [
  { id: "d1", name: "Platform Sweeping", zone: "Platform 1" },
  { id: "d2", name: "Washroom Cleaning", zone: "Platform 2" },
  { id: "d3", name: "Garbage Collection", zone: "Platform 1-3" },
  { id: "d4", name: "Water Booth Maintenance", zone: "Platform 3" },
  { id: "d5", name: "Waiting Room Upkeep", zone: "AC Waiting Room" },
  { id: "d6", name: "Foot Overbridge (FOB) Cleaning", zone: "FOB 1-2" },
  { id: "d7", name: "Pest Control & Sanitization", zone: "All Platforms" },
];

export const jobTypes: JobType[] = [
  {
    id: "j1",
    departmentId: "d1",
    title: "Platform Sweeper",
    scheduledTimes: ["06:00", "10:00", "14:00", "18:00"],
  },
  {
    id: "j2",
    departmentId: "d2",
    title: "Washroom/Toilet Cleaner",
    scheduledTimes: ["05:30", "08:00", "11:00", "14:00", "17:00", "20:00"],
  },
  {
    id: "j3",
    departmentId: "d3",
    title: "Garbage Collector",
    scheduledTimes: ["07:00", "13:00", "19:00"],
  },
  {
    id: "j4",
    departmentId: "d4",
    title: "Water Point Attendant",
    scheduledTimes: ["09:00", "16:00"],
  },
  {
    id: "j5",
    departmentId: "d5",
    title: "Waiting Room Cleaner",
    scheduledTimes: ["07:30", "12:30", "17:30"],
  },
  { id: "j6", departmentId: "d6", title: "FOB Cleaner", scheduledTimes: ["08:30", "15:30"] },
  { id: "j7", departmentId: "d7", title: "Sanitization Worker", scheduledTimes: ["06:30"] },
];

export const shifts: Shift[] = [
  { id: "s1", name: "Morning", start: "06:00", end: "14:00" },
  { id: "s2", name: "Evening", start: "14:00", end: "22:00" },
  { id: "s3", name: "Night", start: "22:00", end: "06:00" },
];

export const employees: Employee[] = [
  { id: "e1", code: "EMP-101", name: "Ramesh Yadav", departmentId: "d1", jobTypeId: "j1", shiftId: "s1", phone: "98xxxxxx01", zone: "Platform 1", joiningDate: "2024-01-12", status: "active" },
  { id: "e2", code: "EMP-102", name: "Suresh Pawar", departmentId: "d1", jobTypeId: "j1", shiftId: "s2", phone: "98xxxxxx02", zone: "Platform 1", joiningDate: "2024-03-03", status: "active" },
  { id: "e3", code: "EMP-103", name: "Anita More", departmentId: "d2", jobTypeId: "j2", shiftId: "s1", phone: "98xxxxxx03", zone: "Platform 2", joiningDate: "2024-01-22", status: "active" },
  { id: "e4", code: "EMP-104", name: "Kavita Jadhav", departmentId: "d2", jobTypeId: "j2", shiftId: "s2", phone: "98xxxxxx04", zone: "Platform 2", joiningDate: "2024-02-15", status: "active" },
  { id: "e5", code: "EMP-105", name: "Santosh Gaikwad", departmentId: "d3", jobTypeId: "j3", shiftId: "s1", phone: "98xxxxxx05", zone: "Platform 1-3", joiningDate: "2024-04-01", status: "active" },
  { id: "e6", code: "EMP-106", name: "Vijay Shinde", departmentId: "d3", jobTypeId: "j3", shiftId: "s3", phone: "98xxxxxx06", zone: "Platform 1-3", joiningDate: "2024-05-10", status: "active" },
  { id: "e7", code: "EMP-107", name: "Meena Kamble", departmentId: "d4", jobTypeId: "j4", shiftId: "s1", phone: "98xxxxxx07", zone: "Platform 3", joiningDate: "2024-01-18", status: "active" },
  { id: "e8", code: "EMP-108", name: "Prakash Salve", departmentId: "d5", jobTypeId: "j5", shiftId: "s1", phone: "98xxxxxx08", zone: "AC Waiting Room", joiningDate: "2024-02-05", status: "active" },
  { id: "e9", code: "EMP-109", name: "Deepak Rane", departmentId: "d5", jobTypeId: "j5", shiftId: "s2", phone: "98xxxxxx09", zone: "AC Waiting Room", joiningDate: "2024-03-20", status: "active" },
  { id: "e10", code: "EMP-110", name: "Sunita Bhosale", departmentId: "d6", jobTypeId: "j6", shiftId: "s1", phone: "98xxxxxx10", zone: "FOB 1", joiningDate: "2024-04-11", status: "active" },
  { id: "e11", code: "EMP-111", name: "Ganesh Naik", departmentId: "d6", jobTypeId: "j6", shiftId: "s2", phone: "98xxxxxx11", zone: "FOB 2", joiningDate: "2024-01-25", status: "active" },
  { id: "e12", code: "EMP-112", name: "Rekha Chavan", departmentId: "d7", jobTypeId: "j7", shiftId: "s1", phone: "98xxxxxx12", zone: "All Platforms", joiningDate: "2024-06-08", status: "active" },
];

export const supervisors: Supervisor[] = [
  { id: "sup1", name: "R. Kulkarni", phone: "97xxxxxx11", departmentIds: ["d1", "d3", "d6"] },
  { id: "sup2", name: "S. Deshmukh", phone: "97xxxxxx22", departmentIds: ["d2", "d4", "d5", "d7"] },
];

/* ---------- helpers ---------- */

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const taskKey = (employeeId: string, date: string, time: string) =>
  `${employeeId}|${date}|${time}`;

export const attKey = (employeeId: string, date: string) => `${employeeId}|${date}`;

export const minutesOf = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** deterministic pseudo-random in [0,1) */
function rand(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function seedHistory(today: Date) {
  const taskLogs: Record<string, TaskLog> = {};
  const attendance: Record<string, AttendanceEntry> = {};
  const year = today.getFullYear();
  const month = today.getMonth();

  for (let day = 1; day < today.getDate(); day++) {
    const d = new Date(year, month, day);
    const date = dateKey(d);
    for (const emp of employees) {
      const job = jobTypes.find((j) => j.id === emp.jobTypeId)!;
      const sup = supervisors.find((s) => s.departmentIds.includes(emp.departmentId));
      const r = rand(emp.id + date);
      const attStatus: AttendanceStatus = r > 0.93 ? "absent" : r > 0.9 ? "leave" : "present";
      attendance[attKey(emp.id, date)] = {
        status: attStatus,
        markedBy: sup?.name,
        markedAt: "08:00",
      };
      if (attStatus !== "present") continue;
      for (const time of job.scheduledTimes) {
        const rr = rand(emp.id + date + time);
        const completed = rr > 0.14;
        taskLogs[taskKey(emp.id, date, time)] = completed
          ? { status: "completed", markedBy: sup?.name, markedAt: time }
          : { status: "missed" };
      }
    }
  }

  // Today: partial marking, matching the sample log
  const today_ = dateKey(today);
  const partial: Array<[string, string]> = [
    ["e1", "06:00"],
    ["e1", "10:00"],
    ["e3", "05:30"],
    ["e3", "08:00"],
    ["e3", "11:00"],
    ["e5", "07:00"],
    ["e7", "09:00"],
    ["e10", "08:30"],
  ];
  for (const [empId, time] of partial) {
    const emp = employees.find((e) => e.id === empId)!;
    const sup = supervisors.find((s) => s.departmentIds.includes(emp.departmentId));
    taskLogs[taskKey(empId, today_, time)] = {
      status: "completed",
      markedBy: sup?.name,
      markedAt: time,
    };
  }
  for (const emp of employees) {
    const sup = supervisors.find((s) => s.departmentIds.includes(emp.departmentId));
    attendance[attKey(emp.id, today_)] = {
      status: emp.id === "e6" ? "absent" : "present",
      markedBy: sup?.name,
      markedAt: "07:45",
    };
  }

  return { taskLogs, attendance };
}

export function createInitialState(today = new Date()): TrackerState {
  const { taskLogs, attendance } = seedHistory(today);
  return {
    departments,
    jobTypes,
    shifts,
    employees,
    supervisors,
    taskLogs,
    attendance,
    audit: [],
  };
}
