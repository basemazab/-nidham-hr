export enum Gender {
  male = "male",
  female = "female",
}

export enum MaritalStatus {
  single = "single",
  married = "married",
  divorced = "divorced",
  widowed = "widowed",
}

export enum MilitaryStatus {
  completed = "completed",
  exempted = "exempted",
  postponed = "postponed",
  not_required = "not_required",
}

export enum EducationLevel {
  primary = "primary",
  preparatory = "preparatory",
  secondary = "secondary",
  diploma = "diploma",
  bachelor = "bachelor",
  master = "master",
  phd = "phd",
}

export enum EmploymentType {
  permanent = "permanent",
  temporary = "temporary",
  contract = "contract",
  internship = "internship",
  consultant = "consultant",
  part_time = "part_time",
}

export enum ContractType {
  fixed_term = "fixed_term",
  unlimited = "unlimited",
}

export enum EmployeeStatus {
  active = "active",
  long_leave = "long_leave",
  suspended = "suspended",
  terminated = "terminated",
  resigned = "resigned",
  dismissed = "dismissed",
}

export enum LegalEntity {
  individual = "individual",
  partnership = "partnership",
  corporation = "corporation",
  other = "other",
}

export enum PositionGrade {
  manager = "manager",
  senior_manager = "senior_manager",
  head_of_dept = "head_of_dept",
  specialist = "specialist",
  technician = "technician",
  worker = "worker",
}

export enum WorkLocationType {
  factory = "factory",
  office = "office",
  branch = "branch",
  warehouse = "warehouse",
}

export interface Company {
  id: string;
  name_ar: string;
  name_en: string;
  commercial_register?: string;
  tax_card?: string;
  insurance_register?: string;
  activity?: string;
  establishment_date?: string;
  legal_entity?: LegalEntity;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Department {
  id: string;
  parent_id?: string;
  company_id?: string;
  name_ar: string;
  name_en?: string;
  code?: string;
  manager_id?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Position {
  id: string;
  department_id?: string;
  title_ar: string;
  title_en?: string;
  grade?: PositionGrade;
  job_description?: string;
  requirements?: string;
  salary_range_min?: string;
  salary_range_max?: string;
  is_active: boolean;
  created_at?: string;
}

export interface WorkLocation {
  id: string;
  company_id?: string;
  name: string;
  address?: string;
  location_type?: WorkLocationType;
  is_active: boolean;
  created_at?: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name_arabic?: string;
  full_name_english?: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: Gender;
  marital_status?: MaritalStatus;
  nationality?: string;
  religion?: string;
  blood_type?: string;
  military_status?: MilitaryStatus;
  governorate?: string;
  city?: string;
  address?: string;
  home_phone?: string;
  mobile_phone?: string;
  mobile_phone_2?: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  education_level?: EducationLevel;
  university?: string;
  faculty?: string;
  graduation_year?: number;
  grade_value?: string;
  job_title_arabic?: string;
  job_title_english?: string;
  department_id?: string;
  position_id?: string;
  direct_manager_id?: string;
  work_location_id?: string;
  employment_type?: EmploymentType;
  contract_type?: ContractType;
  hiring_date?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  probation_end_date?: string;
  actual_termination_date?: string;
  basic_salary?: string;
  housing_allowance?: string;
  transportation_allowance?: string;
  food_allowance?: string;
  other_allowances?: string;
  is_insured: boolean;
  insurance_number?: string;
  insurance_office?: string;
  insurance_start_date?: string;
  insurance_salary?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account_number?: string;
  status?: EmployeeStatus;
  photo_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  department_name?: string;
  position_name?: string;
  manager_name?: string;
}

export interface EmployeeListResponse {
  items: Employee[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface EmployeeStats {
  total_employees: number;
  active_employees: number;
  on_leave: number;
  new_this_month: number;
  male: number;
  female: number;
  avg_salary: string;
  total_payroll: string;
}

export const GENDER_LABELS: Record<Gender, string> = {
  male: "ذكر",
  female: "أنثى",
};

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  single: "أعزب",
  married: "متزوج",
  divorced: "مطلق",
  widowed: "أرمل",
};

export const MILITARY_STATUS_LABELS: Record<MilitaryStatus, string> = {
  completed: "أدى الخدمة",
  exempted: "معفي",
  postponed: "مؤجل",
  not_required: "غير مطلوب",
};

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  primary: "ابتدائي",
  preparatory: "إعدادي",
  secondary: "ثانوي",
  diploma: "دبلوم",
  bachelor: "بكالوريوس",
  master: "ماجستير",
  phd: "دكتوراه",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  permanent: "دائم",
  temporary: "مؤقت",
  contract: "عقد",
  internship: "تدريب",
  consultant: "استشاري",
  part_time: "دوام جزئي",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  fixed_term: "مدة محددة",
  unlimited: "مدة غير محددة",
};

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: "نشط",
  long_leave: "إجازة طويلة",
  suspended: "موقوف",
  terminated: "منهي خدمته",
  resigned: "مستقيل",
  dismissed: "مفصول",
};

export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  long_leave: "bg-amber-100 text-amber-800",
  suspended: "bg-red-100 text-red-800",
  terminated: "bg-gray-100 text-gray-800",
  resigned: "bg-orange-100 text-orange-800",
  dismissed: "bg-red-200 text-red-900",
};
