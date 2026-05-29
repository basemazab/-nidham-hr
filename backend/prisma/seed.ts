import { PrismaClient, EmployeeCategory, ContractType, MaritalStatus, ShiftType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏭 Seeding HRMS Database — WPC Doors / Al-Ittihad Group...');

  // ===== Companies =====
  const company1 = await prisma.company.create({
    data: {
      nameAr: 'مجموعة الاتحاد للصناعات',
      nameEn: 'Al-Ittihad Industrial Group',
      taxId: '123-456-789',
      socialInsuranceNumber: 'SI-2024-001',
      address: '10th of Ramadan City, Industrial Zone',
      phone: '+20-2-1234567',
      email: 'info@alittihad-group.com',
      workDaysPerWeek: 6,
    },
  });

  const company2 = await prisma.company.create({
    data: {
      nameAr: 'أبواب WPC للصناعات الخشبية',
      nameEn: 'WPC Doors Manufacturing',
      taxId: '987-654-321',
      socialInsuranceNumber: 'SI-2024-002',
      address: '6th of October City, Industrial Zone',
      phone: '+20-2-7654321',
      email: 'info@wpc-doors.com',
      workDaysPerWeek: 6,
    },
  });

  // ===== Factories =====
  const factory1 = await prisma.factory.create({
    data: { nameAr: 'مصنع الإنتاج الرئيسي', nameEn: 'Main Production Factory', companyId: company1.id, address: '10th of Ramadan' },
  });
  const factory2 = await prisma.factory.create({
    data: { nameAr: 'مصنع التشطيبات', nameEn: 'Finishing Factory', companyId: company1.id, address: '10th of Ramadan - Zone B' },
  });
  const factory3 = await prisma.factory.create({
    data: { nameAr: 'مصنع أبواب WPC', nameEn: 'WPC Doors Factory', companyId: company2.id, address: '6th of October City' },
  });

  // ===== Departments =====
  const deptNames = [
    { ar: 'الإنتاج', en: 'Production' },
    { ar: 'المبيعات', en: 'Sales' },
    { ar: 'المخازن', en: 'Warehouse' },
    { ar: 'الإدارة', en: 'Administration' },
    { ar: 'الموارد البشرية', en: 'Human Resources' },
    { ar: 'الصيانة', en: 'Maintenance' },
    { ar: 'الجودة', en: 'Quality Control' },
  ];

  const departments1: any[] = [];
  const departments2: any[] = [];
  for (const d of deptNames) {
    departments1.push(await prisma.department.create({ data: { nameAr: d.ar, nameEn: d.en, companyId: company1.id } }));
    departments2.push(await prisma.department.create({ data: { nameAr: d.ar, nameEn: d.en, companyId: company2.id } }));
  }

  // ===== Positions =====
  const positionNames = [
    { ar: 'عامل إنتاج', en: 'Production Worker' },
    { ar: 'مشرف إنتاج', en: 'Production Supervisor' },
    { ar: 'فني صيانة', en: 'Maintenance Technician' },
    { ar: 'أمين مخزن', en: 'Warehouse Keeper' },
    { ar: 'مندوب مبيعات', en: 'Sales Representative' },
    { ar: 'محاسب', en: 'Accountant' },
    { ar: 'مسؤول موارد بشرية', en: 'HR Officer' },
    { ar: 'مدير إنتاج', en: 'Production Manager' },
    { ar: 'مفتش جودة', en: 'Quality Inspector' },
    { ar: 'سائق', en: 'Driver' },
  ];

  const positions1: any[] = [];
  const positions2: any[] = [];
  for (const p of positionNames) {
    // Assign to appropriate department
    let deptIdx = 0;
    if (p.en.includes('Production') || p.en.includes('Worker')) deptIdx = 0;
    else if (p.en.includes('Sales')) deptIdx = 1;
    else if (p.en.includes('Warehouse') || p.en.includes('Driver')) deptIdx = 2;
    else if (p.en.includes('Account')) deptIdx = 3;
    else if (p.en.includes('HR')) deptIdx = 4;
    else if (p.en.includes('Maintenance')) deptIdx = 5;
    else if (p.en.includes('Quality')) deptIdx = 6;

    positions1.push(await prisma.position.create({ data: { nameAr: p.ar, nameEn: p.en, departmentId: departments1[deptIdx].id } }));
    positions2.push(await prisma.position.create({ data: { nameAr: p.ar, nameEn: p.en, departmentId: departments2[deptIdx].id } }));
  }

  // ===== Shifts =====
  const shifts = [
    await prisma.shift.create({ data: { nameAr: 'الشيفت الصباحي', nameEn: 'Morning Shift', type: ShiftType.MORNING, startTime: '08:00', endTime: '16:00', breakMinutes: 60, graceMinutes: 5, factoryId: factory1.id } }),
    await prisma.shift.create({ data: { nameAr: 'الشيفت المسائي', nameEn: 'Evening Shift', type: ShiftType.EVENING, startTime: '16:00', endTime: '00:00', breakMinutes: 60, graceMinutes: 5, factoryId: factory1.id } }),
    await prisma.shift.create({ data: { nameAr: 'الشيفت الليلي', nameEn: 'Night Shift', type: ShiftType.NIGHT, startTime: '00:00', endTime: '08:00', breakMinutes: 30, graceMinutes: 5, factoryId: factory1.id } }),
    await prisma.shift.create({ data: { nameAr: 'شيفت أبواب WPC', nameEn: 'WPC Doors Shift', type: ShiftType.MORNING, startTime: '07:00', endTime: '15:00', breakMinutes: 60, graceMinutes: 10, factoryId: factory3.id } }),
  ];

  // ===== Allowance Configs =====
  for (const company of [company1, company2]) {
    await prisma.allowanceConfig.createMany({
      data: [
        { companyId: company.id, category: EmployeeCategory.MONTHLY, transportAllowance: 500, mealAllowance: 300, housingAllowance: 0 },
        { companyId: company.id, category: EmployeeCategory.WEEKLY, transportAllowance: 300, mealAllowance: 200, housingAllowance: 0 },
        { companyId: company.id, category: EmployeeCategory.HOURLY, transportAllowance: 200, mealAllowance: 150, housingAllowance: 0 },
      ],
    });
  }

  // ===== Employees (60 total: 40 company1, 20 company2) =====
  const arabicFirstNames = ['أحمد', 'محمد', 'عبدالله', 'إبراهيم', 'عمر', 'خالد', 'حسن', 'علي', 'يوسف', 'طارق',
    'مصطفى', 'عادل', 'سمير', 'جمال', 'فاروق', 'رامي', 'هاني', 'ياسر', 'وائل', 'شريف',
    'ماجد', 'نبيل', 'صلاح', 'رضا', 'كريم', 'سعيد', 'أيمن', 'عماد', 'فتحي', 'بلال',
    'أسامة', 'حاتم', 'زياد', 'منير', 'غسان', 'باسم', 'مروان', 'تامر', 'هشام', 'جابر',
    'عاطف', 'رأفت', 'ممدوح', 'صابر', 'عصام', 'عزت', 'رؤوف', 'ناصر', 'شعبان', 'رجب',
    'حمدي', 'فوزي', 'نصر', 'أشرف', 'مجدي', 'كمال', 'جلال', 'لطفي', 'توفيق', 'سيد'];
  const arabicLastNames = ['أبو زيد', 'الشريف', 'العربي', 'حسين', 'إسماعيل', 'عبدالرحمن', 'المصري', 'السيد', 'رمضان', 'عبدالغني',
    'النجار', 'الحداد', 'البنا', 'عطية', 'محمود', 'سليمان', 'فرج', 'شاهين', 'درويش', 'غنيم'];
  const englishFirstNames = ['Ahmed', 'Mohamed', 'Abdullah', 'Ibrahim', 'Omar', 'Khaled', 'Hassan', 'Ali', 'Youssef', 'Tarek',
    'Mostafa', 'Adel', 'Samir', 'Gamal', 'Farouk', 'Rami', 'Hani', 'Yasser', 'Wael', 'Sherif',
    'Maged', 'Nabil', 'Salah', 'Reda', 'Karim', 'Said', 'Ayman', 'Emad', 'Fathy', 'Bilal',
    'Osama', 'Hatem', 'Ziad', 'Mounir', 'Ghassan', 'Basem', 'Marwan', 'Tamer', 'Hesham', 'Gaber',
    'Atef', 'Raafat', 'Mamdouh', 'Saber', 'Essam', 'Ezzat', 'Raouf', 'Nasser', 'Shaaban', 'Ragab',
    'Hamdy', 'Fawzy', 'Nasr', 'Ashraf', 'Magdy', 'Kamal', 'Galal', 'Lotfy', 'Tawfik', 'Sayed'];
  const englishLastNames = ['Abu Zeid', 'El-Sherif', 'El-Araby', 'Hussein', 'Ismail', 'Abdel-Rahman', 'El-Masry', 'El-Sayed', 'Ramadan', 'Abdel-Ghany',
    'El-Naggar', 'El-Haddad', 'El-Banna', 'Attia', 'Mahmoud', 'Soliman', 'Farag', 'Shaheen', 'Darwish', 'Ghoneim'];

  const employees: any[] = [];

  for (let i = 0; i < 60; i++) {
    const isCompany1 = i < 40;
    const company = isCompany1 ? company1 : company2;
    const depts = isCompany1 ? departments1 : departments2;
    const poss = isCompany1 ? positions1 : positions2;
    const factory = isCompany1 ? (i % 2 === 0 ? factory1 : factory2) : factory3;

    // Distribute categories: 30 monthly, 15 weekly, 15 hourly
    let category: EmployeeCategory;
    if (i < 30) category = EmployeeCategory.MONTHLY;
    else if (i < 45) category = EmployeeCategory.WEEKLY;
    else category = EmployeeCategory.HOURLY;

    const firstName = arabicFirstNames[i];
    const lastName = arabicLastNames[i % arabicLastNames.length];
    const firstNameEn = englishFirstNames[i];
    const lastNameEn = englishLastNames[i % englishLastNames.length];

    const deptIdx = i % depts.length;
    const posIdx = i % poss.length;

    const birthYear = 1970 + (i % 30);
    const hireYear = 2015 + (i % 10);

    const baseSalary = category === EmployeeCategory.MONTHLY
      ? 4000 + (i * 200)
      : category === EmployeeCategory.WEEKLY
        ? 1500 + (i * 50)
        : 0;

    const hourlyRate = category === EmployeeCategory.HOURLY ? 30 + (i % 20) * 5 : null;
    const insurableSalary = category === EmployeeCategory.MONTHLY
      ? Math.min(baseSalary, 12600) // SI ceiling
      : category === EmployeeCategory.WEEKLY
        ? Math.min(baseSalary * 4, 12600)
        : 3000 + (i % 5) * 500;

    const emp = await prisma.employee.create({
      data: {
        employeeCode: `EMP-${String(i + 1).padStart(4, '0')}`,
        nameAr: `${firstName} ${lastName}`,
        nameEn: `${firstNameEn} ${lastNameEn}`,
        nationalId: `2${String(birthYear - 1900).padStart(2, '0')}0${String((i % 12) + 1).padStart(2, '0')}${String((i % 28) + 1).padStart(2, '0')}${String(1000 + i * 37).padStart(5, '0')}${String(i % 10)}`,
        dateOfBirth: new Date(birthYear, i % 12, (i % 28) + 1),
        gender: i % 10 < 8 ? 'male' : 'female',
        maritalStatus: i % 3 === 0 ? MaritalStatus.SINGLE : MaritalStatus.MARRIED,
        dependentsCount: i % 3 === 0 ? 0 : (i % 4) + 1,
        phone: `+20-10-${String(10000000 + i * 1234).slice(0, 8)}`,
        companyId: company.id,
        factoryId: factory.id,
        departmentId: depts[deptIdx].id,
        positionId: poss[posIdx].id,
        hireDate: new Date(hireYear, (i % 12), 1),
        contractType: ContractType.PERMANENT,
        category,
        basicSalary: baseSalary,
        hourlyRate,
        insurableSalary,
        socialInsuranceNumber: `SI-${String(100000 + i).slice(0, 6)}`,
        bankName: i % 3 === 0 ? 'CIB' : i % 3 === 1 ? 'NBE' : 'Banque Misr',
        bankAccountNumber: `ACCT-${String(1000000 + i * 777).slice(0, 10)}`,
      },
    });
    employees.push(emp);

    // Assign shift
    const shiftIdx = isCompany1 ? i % 3 : 3;
    await prisma.shiftAssignment.create({
      data: {
        employeeId: emp.id,
        shiftId: shifts[shiftIdx].id,
        startDate: new Date(hireYear, (i % 12), 1),
      },
    });
  }

  // ===== Attendance Data (6 months: Oct 2024 – Mar 2025) =====
  console.log('📋 Generating 6 months attendance data...');
  for (let month = 10; month <= 15; month++) {
    const actualMonth = ((month - 1) % 12) + 1;
    const year = month <= 12 ? 2024 : 2025;
    const daysInMonth = new Date(year, actualMonth, 0).getDate();

    for (const emp of employees) {
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, actualMonth - 1, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 5) continue; // Friday off

        const rand = Math.random();
        let status: 'PRESENT' | 'ABSENT' | 'LATE' = 'PRESENT';
        let lateMinutes = 0;
        let checkIn = '08:00:00';
        let checkOut = '16:00:00';
        let overtimeMinutes = 0;

        if (rand < 0.03) {
          status = 'ABSENT';
          checkIn = null;
          checkOut = null;
        } else if (rand < 0.15) {
          status = 'LATE';
          lateMinutes = 5 + Math.floor(Math.random() * 25);
          const totalMin = 8 * 60 + lateMinutes;
          checkIn = `${String(8 + Math.floor(lateMinutes / 60)).padStart(2, '0')}:${String(lateMinutes % 60).padStart(2, '0')}:00`;
        } else if (rand > 0.85) {
          overtimeMinutes = 30 + Math.floor(Math.random() * 90);
          const endHour = 16 + Math.floor(overtimeMinutes / 60);
          const endMin = overtimeMinutes % 60;
          checkOut = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`;
        }

        const workedHours = checkIn && checkOut ? calculateWorkedHours(checkIn, checkOut) : 0;

        await prisma.attendanceRecord.create({
          data: {
            employeeId: emp.id,
            date,
            checkIn: checkIn ? new Date(`${year}-${String(actualMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}T${checkIn}`) : null,
            checkOut: checkOut ? new Date(`${year}-${String(actualMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}T${checkOut}`) : null,
            status,
            lateMinutes,
            overtimeMinutes,
            workedHours: Math.max(0, workedHours - 1), // subtract break
            source: 'zkteco',
          },
        });
      }
    }
    console.log(`  ✓ ${year}-${String(actualMonth).padStart(2, '0')} attendance generated`);
  }

  // ===== Leave Balances =====
  console.log('📋 Generating leave balances...');
  for (const emp of employees) {
    await prisma.leaveBalance.createMany({
      data: [
        { employeeId: emp.id, leaveType: 'ANNUAL', year: 2025, entitled: 21, used: Math.floor(Math.random() * 5), carriedOver: 0, remaining: 21 - Math.floor(Math.random() * 5) },
        { employeeId: emp.id, leaveType: 'CASUAL', year: 2025, entitled: 6, used: Math.floor(Math.random() * 3), carriedOver: 0, remaining: 6 - Math.floor(Math.random() * 3) },
        { employeeId: emp.id, leaveType: 'SICK', year: 2025, entitled: 90, used: 0, carriedOver: 0, remaining: 90 },
      ],
    });
  }

  // ===== Some Loans =====
  console.log('💰 Creating sample loans...');
  for (let i = 0; i < 10; i++) {
    const emp = employees[i * 6];
    await prisma.loan.create({
      data: {
        employeeId: emp.id,
        amount: 10000 + i * 2000,
        monthlyInstallment: (10000 + i * 2000) / 12,
        totalInstallments: 12,
        paidInstallments: i % 4,
        remainingBalance: (10000 + i * 2000) - ((10000 + i * 2000) / 12) * (i % 4),
        status: 'ACTIVE',
        reason: 'سلفة شخصية',
        startDate: new Date(2025, 0, 1),
      },
    });
  }

  // ===== Create Payroll Run (Jan 2025 committed) =====
  console.log('💵 Creating sample payroll run...');
  const payrollRun = await prisma.payrollRun.create({
    data: {
      companyId: company1.id,
      month: 1,
      year: 2025,
      status: 'COMMITTED',
      totalGross: 450000,
      totalNet: 380000,
      totalSocialInsuranceEmployee: 35000,
      totalSocialInsuranceEmployer: 60000,
      totalTax: 15000,
      committedAt: new Date(2025, 1, 5),
    },
  });

  // ===== Admin User =====
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hrms.local',
      username: 'admin',
      passwordHash,
      nameAr: 'مدير النظام',
      nameEn: 'System Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.userCompany.createMany({
    data: [
      { userId: adminUser.id, companyId: company1.id, isDefault: true },
      { userId: adminUser.id, companyId: company2.id, isDefault: false },
    ],
  });

  // HR Manager user
  const hrHash = await bcrypt.hash('hr123', 10);
  const hrUser = await prisma.user.create({
    data: {
      email: 'hr@hrms.local',
      username: 'hr',
      passwordHash: hrHash,
      nameAr: 'مسؤول الموارد البشرية',
      nameEn: 'HR Manager',
      role: UserRole.HR_MANAGER,
    },
  });

  await prisma.userCompany.createMany({
    data: [
      { userId: hrUser.id, companyId: company1.id, isDefault: true },
      { userId: hrUser.id, companyId: company2.id, isDefault: false },
    ],
  });

  console.log('');
  console.log('✅ Seed completed!');
  console.log('════════════════════════════════════════');
  console.log('📊 Summary:');
  console.log(`   Companies: 2 (Al-Ittihad + WPC Doors)`);
  console.log(`   Factories: 3`);
  console.log(`   Departments: ${deptNames.length * 2}`);
  console.log(`   Employees: 60 (30 monthly, 15 weekly, 15 hourly)`);
  console.log(`   Attendance records: ~${60 * 26 * 6} (6 months)`);
  console.log(`   Loans: 10`);
  console.log(`   Payroll run: 1 (Jan 2025)`);
  console.log('');
  console.log('🔐 Login credentials:');
  console.log('   Admin:  admin / admin123');
  console.log('   HR:     hr / hr123');
  console.log('════════════════════════════════════════');
}

function calculateWorkedHours(checkIn: string, checkOut: string): number {
  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  return (outH * 60 + outM - (inH * 60 + inM)) / 60;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
