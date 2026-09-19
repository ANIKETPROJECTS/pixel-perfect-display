export type Role = "admin" | "supervisor";
export type TaskStatus = "pending" | "completed" | "missed" | "needs_redo";
export type AttendanceStatus = "present" | "absent" | "half-day" | "leave";
export type DepartmentGroup = "station" | "colony";
export type Gender = "male" | "female" | "other";
export type MaritalStatus = "single" | "married" | "widowed" | "divorced";
export type PoliceVerificationStatus = "pending" | "verified" | "rejected";
export type MedicalFitnessStatus = "yes" | "no";
export type EmploymentType = "permanent" | "contract" | "daily-wage" | "temporary";
export type EmployeeStatus = "active" | "inactive" | "on_leave" | "terminated";
export type EmployeeDocumentType =
  | "aadhaar_front"
  | "aadhaar_back"
  | "police_verification"
  | "medical_certificate"
  | "address_proof"
  | "other";

export interface Department {
  id: string;
  name: string;
  zone: string;
  group: DepartmentGroup;
}

export interface JobType {
  id: string;
  departmentId: string;
  title: string;
  frequencyPerDay: number;
  frequencyLabel: string;
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
  hrmsEmployeeId: string;
  name: string;
  departmentId: string;
  jobTypeId: string;
  shiftId: string;
  phone: string;
  zone: string;
  joiningDate: string;
  status: EmployeeStatus;
  fatherOrHusbandName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: string;
  maritalStatus?: MaritalStatus;
  photographFileName?: string;
  mobileNumber?: string;
  alternateMobileNumber?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  currentAddress?: string;
  permanentAddress?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  voterId?: string;
  policeVerificationStatus?: PoliceVerificationStatus;
  policeVerificationCertificateNumber?: string;
  policeVerificationDate?: string;
  medicalFitnessStatus?: MedicalFitnessStatus;
  medicalFitnessDate?: string;
  esicNumber?: string;
  pfUanNumber?: string;
  employmentType?: EmploymentType;
  supervisorId?: string;
  gatePassNumber?: string;
  uniformSize?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  bankNameAndBranch?: string;
  accountHolderName?: string;
}

export interface Supervisor {
  id: string;
  name: string;
  phone: string;
  departmentIds: string[];
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: EmployeeDocumentType;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  expiryDate?: string;
}

export interface TaskLog {
  status: TaskStatus;
  remarks?: string;
  markedBy?: string;
  markedAt?: string;
}

export interface AttendanceEntry {
  status: AttendanceStatus;
  remarks?: string;
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
  employeeDocuments: EmployeeDocument[];
  taskLogs: Record<string, TaskLog>;
  attendance: Record<string, AttendanceEntry>;
  audit: AuditEntry[];
}

export const departments: Department[] = [
  { id: "d1", name: "Platforms", zone: "Platforms 1–7", group: "station" },
  { id: "d2", name: "Tracks", zone: "Tracks 1–7", group: "station" },
  { id: "d3", name: "Foot Over Bridges (FOB)", zone: "FOB 4 Nos.", group: "station" },
  {
    id: "d4",
    name: "Waiting Halls & Retiring Rooms",
    zone: "Waiting halls and retiring rooms",
    group: "station",
  },
  { id: "d5", name: "Concourse & Offices", zone: "New building and booking offices", group: "station" },
  { id: "d6", name: "Circulating Area", zone: "Station circulating area", group: "station" },
  { id: "d7", name: "Cobweb & Dusting", zone: "Roofs, FOBs and electricals", group: "station" },
  { id: "d8", name: "Sanitary Amenities & Drains", zone: "Sanitary amenities and five open drains", group: "station" },
  { id: "d9", name: "Garbage & Waste Management", zone: "Station waste collection", group: "station" },
  { id: "d10", name: "Pest & Rodent Control", zone: "Station pest control", group: "station" },
  { id: "d11", name: "Periodic & Specialized", zone: "Periodic assets and specialist work", group: "station" },
  {
    id: "d12",
    name: "Colony Roads & Open Areas",
    zone: "North and South railway colony roads and open areas",
    group: "colony",
  },
  { id: "d13", name: "Colony Garbage & Waste", zone: "Railway colony waste collection", group: "colony" },
  { id: "d14", name: "Colony Drains", zone: "Railway colony drains", group: "colony" },
  {
    id: "d15",
    name: "Colony Pest & Vector Control",
    zone: "Railway colony vector control and fogging",
    group: "colony",
  },
];

export const jobTypes: JobType[] = [
  {
    id: "j1",
    departmentId: "d1",
    title: "Platform Sweeping/Mopping/Scrubbing",
    frequencyPerDay: 5,
    frequencyLabel: "5x/day",
    scheduledTimes: ["05:30", "08:30", "11:30", "15:30", "19:30"],
  },
  {
    id: "j2",
    departmentId: "d1",
    title: "Tap Booths & Pedestal Washing",
    frequencyPerDay: 1,
    frequencyLabel: "1x/day",
    scheduledTimes: ["07:00"],
  },
  {
    id: "j3",
    departmentId: "d1",
    title: "Columns with Dadoos Cleaning",
    frequencyPerDay: 1,
    frequencyLabel: "1x/day",
    scheduledTimes: ["10:00"],
  },
  {
    id: "j4",
    departmentId: "d2",
    title: "Track Sweeping & Apron Washing",
    frequencyPerDay: 3,
    frequencyLabel: "3x/day",
    scheduledTimes: ["06:00", "12:00", "18:00"],
  },
  {
    id: "j5",
    departmentId: "d3",
    title: "FOB Sweeping, Dusting, Staircases",
    frequencyPerDay: 2,
    frequencyLabel: "2x/day",
    scheduledTimes: ["08:00", "16:00"],
  },
  {
    id: "j6",
    departmentId: "d4",
    title: "Sweeping, Mopping, Spot Washing",
    frequencyPerDay: 5,
    frequencyLabel: "5x/day",
    scheduledTimes: ["06:00", "09:00", "12:00", "15:00", "18:00"],
  },
  {
    id: "j7",
    departmentId: "d5",
    title: "Concourse Area Cleaning",
    frequencyPerDay: 2,
    frequencyLabel: "2x/day",
    scheduledTimes: ["07:00", "17:00"],
  },
  {
    id: "j8",
    departmentId: "d5",
    title: "Office Sweeping/Mopping/Sanitary",
    frequencyPerDay: 2,
    frequencyLabel: "2x/day",
    scheduledTimes: ["08:00", "16:00"],
  },
  {
    id: "j9",
    departmentId: "d5",
    title: "Wall Cladding Cleaning",
    frequencyPerDay: 1,
    frequencyLabel: "1x/day",
    scheduledTimes: ["11:00"],
  },
  {
    id: "j10",
    departmentId: "d6",
    title: "Sweeping & Garbage Collection",
    frequencyPerDay: 2,
    frequencyLabel: "2x/day",
    scheduledTimes: ["07:00", "17:00"],
  },
  {
    id: "j11",
    departmentId: "d7",
    title: "Cobweb Removal",
    frequencyPerDay: 0,
    frequencyLabel: "Weekly",
    scheduledTimes: ["09:00"],
  },
  {
    id: "j12",
    departmentId: "d8",
    title: "Sanitary Amenities Cleaning",
    frequencyPerDay: 6,
    frequencyLabel: "6x/day",
    scheduledTimes: ["05:30", "08:00", "11:00", "14:00", "17:00", "20:00"],
  },
  {
    id: "j13",
    departmentId: "d8",
    title: "Drains Cleaning",
    frequencyPerDay: 1,
    frequencyLabel: "1x/day",
    scheduledTimes: ["10:00"],
  },
  {
    id: "j14",
    departmentId: "d8",
    title: "Dustbin Cleaning + Biodegradable Covers",
    frequencyPerDay: 3,
    frequencyLabel: "3x/day",
    scheduledTimes: ["07:00", "13:00", "19:00"],
  },
  {
    id: "j15",
    departmentId: "d9",
    title: "Garbage Collection & Disposal",
    frequencyPerDay: 3,
    frequencyLabel: "3x/day (trips)",
    scheduledTimes: ["07:00", "13:00", "19:00"],
  },
  {
    id: "j16",
    departmentId: "d10",
    title: "Pest Control Activity",
    frequencyPerDay: 2,
    frequencyLabel: "2x/day",
    scheduledTimes: ["06:30", "18:30"],
  },
  {
    id: "j17",
    departmentId: "d10",
    title: "Rodent Control Activity",
    frequencyPerDay: 0,
    frequencyLabel: "Fortnightly",
    scheduledTimes: ["10:30"],
  },
  {
    id: "j18",
    departmentId: "d11",
    title: "Glass Cleaning",
    frequencyPerDay: 0,
    frequencyLabel: "Once/4 months",
    scheduledTimes: ["09:00"],
  },
  {
    id: "j19",
    departmentId: "d11",
    title: "SS Dustbin Stand Provision",
    frequencyPerDay: 0,
    frequencyLabel: "As-needed asset",
    scheduledTimes: ["10:00"],
  },
  {
    id: "j20",
    departmentId: "d12",
    title: "Road Sweeping (North & South colony)",
    frequencyPerDay: 1,
    frequencyLabel: "1x/day",
    scheduledTimes: ["07:00"],
  },
  {
    id: "j21",
    departmentId: "d12",
    title: "Open Area Sweeping (either side of roads)",
    frequencyPerDay: 1,
    frequencyLabel: "1x/day",
    scheduledTimes: ["10:00"],
  },
  {
    id: "j22",
    departmentId: "d13",
    title: "Garbage Collection, Segregation & Disposal",
    frequencyPerDay: 1,
    frequencyLabel: "Daily",
    scheduledTimes: ["09:00"],
  },
  {
    id: "j23",
    departmentId: "d14",
    title: "Drains Cleaning (papers/plastics removal)",
    frequencyPerDay: 1,
    frequencyLabel: "1x/day",
    scheduledTimes: ["08:00"],
  },
  {
    id: "j24",
    departmentId: "d14",
    title: "Drains Desilting",
    frequencyPerDay: 0,
    frequencyLabel: "Weekly",
    scheduledTimes: ["10:00"],
  },
  {
    id: "j25",
    departmentId: "d15",
    title: "Vector Control (Anti-larval/mosquito spraying)",
    frequencyPerDay: 0,
    frequencyLabel: "Weekly",
    scheduledTimes: ["11:00"],
  },
  {
    id: "j26",
    departmentId: "d15",
    title: "Fogging Activities (Malathion + Diesel)",
    frequencyPerDay: 0,
    frequencyLabel: "Weekly (per tender: once/fortnight for full road area)",
    scheduledTimes: ["18:00"],
  },
];

export const shifts: Shift[] = [
  { id: "s1", name: "Morning", start: "06:00", end: "14:00" },
  { id: "s2", name: "Evening", start: "14:00", end: "22:00" },
  { id: "s3", name: "Night", start: "22:00", end: "06:00" },
];

export const employees: Employee[] = [
  { id: "e1", code: "EMP-101", hrmsEmployeeId: "HR-8801", name: "Ramesh Yadav", departmentId: "d1", jobTypeId: "j1", shiftId: "s1", phone: "98xxxxxx01", zone: "Platforms 1–7", joiningDate: "2024-01-12", status: "active" },
  { id: "e2", code: "EMP-102", hrmsEmployeeId: "HR-8802", name: "Suresh Pawar", departmentId: "d1", jobTypeId: "j2", shiftId: "s2", phone: "98xxxxxx02", zone: "Platforms 1–7", joiningDate: "2024-03-03", status: "active" },
  { id: "e3", code: "EMP-103", hrmsEmployeeId: "HR-8803", name: "Anita More", departmentId: "d8", jobTypeId: "j12", shiftId: "s1", phone: "98xxxxxx03", zone: "Sanitary amenities", joiningDate: "2024-01-22", status: "active" },
  { id: "e4", code: "EMP-104", hrmsEmployeeId: "HR-8804", name: "Kavita Jadhav", departmentId: "d8", jobTypeId: "j13", shiftId: "s2", phone: "98xxxxxx04", zone: "Open drains", joiningDate: "2024-02-15", status: "active" },
  { id: "e5", code: "EMP-105", hrmsEmployeeId: "HR-8805", name: "Santosh Gaikwad", departmentId: "d9", jobTypeId: "j15", shiftId: "s1", phone: "98xxxxxx05", zone: "Station waste area", joiningDate: "2024-04-01", status: "active" },
  { id: "e6", code: "EMP-106", hrmsEmployeeId: "HR-8806", name: "Vijay Shinde", departmentId: "d9", jobTypeId: "j15", shiftId: "s3", phone: "98xxxxxx06", zone: "Station waste area", joiningDate: "2024-05-10", status: "active" },
  { id: "e7", code: "EMP-107", hrmsEmployeeId: "HR-8807", name: "Meena Kamble", departmentId: "d2", jobTypeId: "j4", shiftId: "s1", phone: "98xxxxxx07", zone: "Tracks 1–7", joiningDate: "2024-01-18", status: "active" },
  { id: "e8", code: "EMP-108", hrmsEmployeeId: "HR-8808", name: "Prakash Salve", departmentId: "d4", jobTypeId: "j6", shiftId: "s1", phone: "98xxxxxx08", zone: "Waiting halls", joiningDate: "2024-02-05", status: "active" },
  { id: "e9", code: "EMP-109", hrmsEmployeeId: "HR-8809", name: "Deepak Rane", departmentId: "d4", jobTypeId: "j6", shiftId: "s2", phone: "98xxxxxx09", zone: "Retiring rooms", joiningDate: "2024-03-20", status: "active" },
  { id: "e10", code: "EMP-110", hrmsEmployeeId: "HR-8810", name: "Sunita Bhosale", departmentId: "d3", jobTypeId: "j5", shiftId: "s1", phone: "98xxxxxx10", zone: "FOB 1–4", joiningDate: "2024-04-11", status: "active" },
  { id: "e11", code: "EMP-111", hrmsEmployeeId: "HR-8811", name: "Ganesh Naik", departmentId: "d5", jobTypeId: "j8", shiftId: "s2", phone: "98xxxxxx11", zone: "Offices", joiningDate: "2024-01-25", status: "active" },
  { id: "e12", code: "EMP-112", hrmsEmployeeId: "HR-8812", name: "Rekha Chavan", departmentId: "d10", jobTypeId: "j16", shiftId: "s1", phone: "98xxxxxx12", zone: "All station areas", joiningDate: "2024-06-08", status: "active" },
  { id: "e13", code: "EMP-113", hrmsEmployeeId: "HR-8813", name: "Manoj Thorat", departmentId: "d6", jobTypeId: "j10", shiftId: "s1", phone: "98xxxxxx13", zone: "Circulating area", joiningDate: "2024-06-15", status: "active" },
  { id: "e14", code: "EMP-114", hrmsEmployeeId: "HR-8814", name: "Sneha Karpe", departmentId: "d7", jobTypeId: "j11", shiftId: "s1", phone: "98xxxxxx14", zone: "Station roofs and FOBs", joiningDate: "2024-07-01", status: "active" },
  { id: "e15", code: "EMP-115", hrmsEmployeeId: "HR-8815", name: "Ajay Pandit", departmentId: "d12", jobTypeId: "j20", shiftId: "s1", phone: "98xxxxxx15", zone: "North and South colony roads", joiningDate: "2024-07-12", status: "active" },
  { id: "e16", code: "EMP-116", hrmsEmployeeId: "HR-8816", name: "Poonam Khedkar", departmentId: "d13", jobTypeId: "j22", shiftId: "s1", phone: "98xxxxxx16", zone: "Railway colony waste area", joiningDate: "2024-07-20", status: "active" },
  { id: "e17", code: "EMP-117", hrmsEmployeeId: "HR-8817", name: "Nitin Salunkhe", departmentId: "d14", jobTypeId: "j23", shiftId: "s1", phone: "98xxxxxx17", zone: "Railway colony drains", joiningDate: "2024-08-02", status: "active" },
  { id: "e18", code: "EMP-118", hrmsEmployeeId: "HR-8818", name: "Sarika Pol", departmentId: "d15", jobTypeId: "j25", shiftId: "s1", phone: "98xxxxxx18", zone: "Railway colony vector control", joiningDate: "2024-08-16", status: "active" },
];

const completeRegistrationProfile: Partial<Employee> = {
  fatherOrHusbandName: "Baban Yadav",
  dateOfBirth: "1992-06-14",
  gender: "male",
  bloodGroup: "B+",
  maritalStatus: "married",
  photographFileName: "ramesh-yadav.jpg",
  mobileNumber: "9876543201",
  emergencyContactName: "Sunita Yadav (Spouse)",
  emergencyContactNumber: "9876543221",
  currentAddress: "Near Bus Stand, Guntakal, Andhra Pradesh",
  permanentAddress: "Near Bus Stand, Guntakal, Andhra Pradesh",
  aadhaarNumber: "123412344821",
  policeVerificationStatus: "verified",
  policeVerificationCertificateNumber: "PV/GTL/2024/0187",
  policeVerificationDate: "2024-01-05",
  medicalFitnessStatus: "yes",
  medicalFitnessDate: "2024-01-10",
  esicNumber: "1102345678901",
  pfUanNumber: "101234567890",
  employmentType: "contract",
  supervisorId: "sup1",
  gatePassNumber: "GTL-GP-0456",
  uniformSize: "L",
  bankAccountNumber: "123456783210",
  ifscCode: "SBIN0001234",
  bankNameAndBranch: "State Bank of India, Guntakal Branch",
  accountHolderName: "Ramesh Yadav",
};

const dummyFirstNames = ["Ramesh", "Suresh", "Anita", "Kavita", "Mohan", "Sunita"];
const dummyGenders: Gender[] = ["male", "male", "female", "female", "male", "female"];
const dummyBloodGroups = ["B+", "O+", "A+", "AB+", "B-", "O-"];

function employeeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const employeeRegistrationProfiles: Record<string, Partial<Employee>> = Object.fromEntries(
  employees.map((employee, index) => {
    const serial = index + 1;
    const month = String((index % 9) + 1).padStart(2, "0");
    const day = String((index % 20) + 1).padStart(2, "0");
    const mobileSerial = String(3201 + index);
    const emergencySerial = String(5201 + index);
    return [
      employee.id,
      {
        ...completeRegistrationProfile,
        fatherOrHusbandName: `${dummyFirstNames[index % dummyFirstNames.length]} Family`,
        dateOfBirth: `199${index % 5}-${month}-${day}`,
        gender: dummyGenders[index % dummyGenders.length],
        bloodGroup: dummyBloodGroups[index % dummyBloodGroups.length],
        maritalStatus: serial % 3 === 0 ? "single" : "married",
        photographFileName: `${employeeSlug(employee.name)}.jpg`,
        mobileNumber: `987654${mobileSerial}`,
        emergencyContactName: `${dummyFirstNames[(index + 2) % dummyFirstNames.length]} Emergency`,
        emergencyContactNumber: `987654${emergencySerial}`,
        currentAddress: `Railway quarters, Block ${String((index % 6) + 1)}, Guntakal`,
        permanentAddress: `Railway quarters, Block ${String((index % 6) + 1)}, Guntakal`,
        aadhaarNumber: `12341234${String(4821 + index)}`,
        policeVerificationCertificateNumber: `PV/GTL/2024/${String(180 + index).padStart(4, "0")}`,
        gatePassNumber: `GTL-GP-${String(4501 + index).padStart(4, "0")}`,
        esicNumber: `110234567${String(8901 + index)}`,
        pfUanNumber: `101234567${String(8901 + index)}`,
        bankAccountNumber: `12345678${String(3210 + index)}`,
        accountHolderName: employee.name,
        bankNameAndBranch: "State Bank of India, Guntakal Branch",
      },
    ];
  }),
) as Record<string, Partial<Employee>>;

export const employeeDocuments: EmployeeDocument[] = employees.flatMap((employee) =>
  (["aadhaar_front", "aadhaar_back", "police_verification", "medical_certificate", "address_proof"] as const).map(
    (documentType) => ({
      id: `doc-${employee.id}-${documentType}`,
      employeeId: employee.id,
      documentType,
      fileUrl: `${employeeSlug(employee.name)}-${documentType}.pdf`,
      uploadedAt: `${employee.joiningDate}T09:00:00.000Z`,
      uploadedBy: "Admin",
    }),
  ),
);

export const supervisors: Supervisor[] = [
  {
    id: "sup1",
    name: "R. Kulkarni",
    phone: "97xxxxxx11",
    departmentIds: [
      "d1",
      "d2",
      "d3",
      "d4",
      "d5",
      "d6",
      "d7",
      "d8",
      "d9",
      "d10",
      "d11",
      "d12",
      "d13",
      "d14",
      "d15",
    ],
  },
];

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const taskKey = (employeeId: string, date: string, time: string) =>
  `${employeeId}|${date}|${time}`;

export const attKey = (employeeId: string, date: string) => `${employeeId}|${date}`;

export const minutesOf = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

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
    const date = dateKey(new Date(year, month, day));
    for (const emp of employees) {
      const job = jobTypes.find((j) => j.id === emp.jobTypeId)!;
      const sup = supervisors.find((s) => s.departmentIds.includes(emp.departmentId));
      const r = rand(emp.id + date);
      const attStatus: AttendanceStatus = r > 0.93 ? "absent" : r > 0.9 ? "leave" : "present";
      attendance[attKey(emp.id, date)] = {
        status: attStatus,
        ...(sup ? { markedBy: sup.name } : {}),
        markedAt: "08:00",
      };
      if (attStatus !== "present") continue;
      for (const time of job.scheduledTimes) {
        const completed = rand(emp.id + date + time) > 0.14;
        taskLogs[taskKey(emp.id, date, time)] = completed
          ? { status: "completed", ...(sup ? { markedBy: sup.name } : {}), markedAt: time }
          : {
              status: "missed",
              remarks: "Task was not completed during the scheduled round.",
              ...(sup ? { markedBy: sup.name } : {}),
              markedAt: time,
            };
      }
    }
  }

  const todayKey = dateKey(today);
  const partial: Array<[string, string, TaskStatus, string?]> = [
    ["e1", "05:30", "completed"],
    ["e3", "08:00", "needs_redo", "Floor still wet near urinals, sent back."],
    ["e5", "13:00", "missed", "Bin not emptied, no worker response."],
    ["e7", "12:00", "completed"],
    ["e12", "06:30", "completed"],
    ["e14", "09:00", "completed", "Done for this week's cycle."],
    ["e15", "07:00", "completed"],
    ["e16", "09:00", "missed", "Truck delayed, collection pending."],
    ["e17", "08:00", "completed"],
    ["e18", "11:00", "completed", "Spraying done for this week's cycle."],
  ];
  for (const [empId, time, status, remarks] of partial) {
    const emp = employees.find((e) => e.id === empId)!;
    const sup = supervisors.find((s) => s.departmentIds.includes(emp.departmentId));
    taskLogs[taskKey(empId, todayKey, time)] = {
      status,
      ...(remarks ? { remarks } : {}),
      ...(sup ? { markedBy: sup.name } : {}),
      markedAt: time,
    };
  }

  for (const emp of employees) {
    const sup = supervisors.find((s) => s.departmentIds.includes(emp.departmentId));
    attendance[attKey(emp.id, todayKey)] = {
      status: emp.id === "e6" ? "absent" : "present",
      ...(emp.id === "e6" ? { remarks: "Informed sick via phone." } : {}),
      ...(sup ? { markedBy: sup.name } : {}),
      markedAt: "07:45",
    };
  }
  const sampleAttendanceDate = dateKey(new Date(year, month, 10));
  attendance[attKey("e9", sampleAttendanceDate)] = {
    status: "half-day",
    remarks: "Left early — family emergency.",
    markedBy: "S. Deshmukh",
    markedAt: "13:00",
  };

  return { taskLogs, attendance };
}

export function createInitialState(today = new Date()): TrackerState {
  const { taskLogs, attendance } = seedHistory(today);
  return {
    departments,
    jobTypes,
    shifts,
    employees: employees.map((employee) => ({
      ...employee,
      ...(employeeRegistrationProfiles[employee.id] ?? {}),
    })),
    supervisors,
    employeeDocuments,
    taskLogs,
    attendance,
    audit: [],
  };
}