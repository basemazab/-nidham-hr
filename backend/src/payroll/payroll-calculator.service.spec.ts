import { PayrollCalculator } from './payroll-calculator.service';

describe('PayrollCalculator — Egyptian Payroll', () => {
  let calculator: PayrollCalculator;

  beforeEach(() => {
    calculator = new PayrollCalculator();
  });

  describe('Annual Tax Calculation (2025 brackets)', () => {
    it('should return 0 tax for income below 40,000', () => {
      expect(calculator.calculateAnnualTax(30000)).toBe(0);
      expect(calculator.calculateAnnualTax(0)).toBe(0);
      expect(calculator.calculateAnnualTax(40000)).toBe(0);
    });

    it('should calculate 10% for 40,001–55,000 bracket', () => {
      // 50,000 taxable: first 40k = 0, next 10k = 10% = 1,000
      expect(calculator.calculateAnnualTax(50000)).toBe(1000);
    });

    it('should calculate mixed brackets correctly', () => {
      // 70,000 taxable:
      // 0–40k: 0
      // 40k–55k: 15,000 * 10% = 1,500
      // 55k–70k: 15,000 * 15% = 2,250
      // Total: 3,750
      expect(calculator.calculateAnnualTax(70000)).toBe(3750);
    });

    it('should calculate full brackets for high income', () => {
      // 200,000 taxable:
      // 0–40k: 0
      // 40k–55k: 15,000 * 10% = 1,500
      // 55k–70k: 15,000 * 15% = 2,250
      // 70k–200k: 130,000 * 20% = 26,000
      // Total: 29,750
      expect(calculator.calculateAnnualTax(200000)).toBe(29750);
    });

    it('should handle 700,000 correctly (all brackets)', () => {
      // 0–40k: 0
      // 40k–55k: 15,000 * 10% = 1,500
      // 55k–70k: 15,000 * 15% = 2,250
      // 70k–200k: 130,000 * 20% = 26,000
      // 200k–400k: 200,000 * 22.5% = 45,000
      // 400k–600k: 200,000 * 25% = 50,000
      // 600k–700k: 100,000 * 27.5% = 27,500
      // Total: 152,250
      expect(calculator.calculateAnnualTax(700000)).toBe(152250);
    });
  });

  describe('Monthly Employee — Full Calculation', () => {
    it('should calculate monthly salaried employee correctly', () => {
      const result = calculator.calculate({
        category: 'MONTHLY',
        basicSalary: 10000,
        insurableSalary: 9000,
        workedDays: 26,
        workedHours: 208,
        overtimeMinutes: 0,
        lateMinutes: 0,
        absentDays: 0,
        transportAllowance: 500,
        mealAllowance: 300,
        housingAllowance: 0,
        performanceBonus: 0,
        loanDeduction: 0,
        advanceDeduction: 0,
        otherDeductions: 0,
      });

      expect(result.grossSalary).toBe(10800);
      expect(result.socialInsuranceEmployee).toBe(990); // 9000 * 11%
      expect(result.socialInsuranceEmployer).toBe(1687.5); // 9000 * 18.75%

      // Annual: gross=129,600, SI=11,880, taxable=129600-11880-20000=97,720
      // Tax: 0–40k:0, 40–55k:1500, 55–70k:2250, 70–97.72k:5544 = 9294
      // Monthly tax: 9294/12 = 774.50
      expect(result.annualGross).toBe(129600);
      expect(result.annualSI).toBe(11880);
      expect(result.annualTaxable).toBe(97720);
    });

    it('should deduct for absences', () => {
      const result = calculator.calculate({
        category: 'MONTHLY',
        basicSalary: 10000,
        insurableSalary: 9000,
        workedDays: 24,
        workedHours: 192,
        overtimeMinutes: 0,
        lateMinutes: 0,
        absentDays: 2,
        transportAllowance: 500,
        mealAllowance: 300,
        housingAllowance: 0,
        performanceBonus: 0,
        loanDeduction: 0,
        advanceDeduction: 0,
        otherDeductions: 0,
      });

      // 2 days absence: 10000/26 * 2 = 769.23
      expect(result.absenceDeduction).toBeCloseTo(769.23, 1);
      expect(result.basicSalary).toBeCloseTo(9230.77, 1);
    });

    it('should calculate loan deduction', () => {
      const result = calculator.calculate({
        category: 'MONTHLY',
        basicSalary: 8000,
        insurableSalary: 7000,
        workedDays: 26,
        workedHours: 208,
        overtimeMinutes: 0,
        lateMinutes: 0,
        absentDays: 0,
        transportAllowance: 400,
        mealAllowance: 200,
        housingAllowance: 0,
        performanceBonus: 0,
        loanDeduction: 1000,
        advanceDeduction: 0,
        otherDeductions: 0,
      });

      expect(result.loanDeduction).toBe(1000);
      expect(result.totalDeductions).toBeGreaterThan(1000);
    });
  });

  describe('Hourly Employee', () => {
    it('should calculate hourly worker correctly', () => {
      const result = calculator.calculate({
        category: 'HOURLY',
        basicSalary: 0,
        insurableSalary: 3000,
        hourlyRate: 50,
        workedDays: 22,
        workedHours: 176,
        overtimeMinutes: 120, // 2 hours OT
        lateMinutes: 0,
        absentDays: 0,
        transportAllowance: 200,
        mealAllowance: 0,
        housingAllowance: 0,
        performanceBonus: 0,
        loanDeduction: 0,
        advanceDeduction: 0,
        otherDeductions: 0,
      });

      expect(result.basicSalary).toBe(8800); // 176 * 50
      expect(result.overtimePay).toBe(150); // 2hrs * 50 * 1.5
      expect(result.grossSalary).toBe(9150); // 8800 + 200 + 150
      expect(result.socialInsuranceEmployee).toBe(330); // 3000 * 11%
    });
  });

  describe('Weekly Employee', () => {
    it('should calculate weekly worker by actual days', () => {
      const result = calculator.calculate({
        category: 'WEEKLY',
        basicSalary: 2000, // weekly salary
        insurableSalary: 2000,
        workedDays: 5,
        workedHours: 40,
        overtimeMinutes: 0,
        lateMinutes: 0,
        absentDays: 0,
        transportAllowance: 100,
        mealAllowance: 0,
        housingAllowance: 0,
        performanceBonus: 0,
        loanDeduction: 0,
        advanceDeduction: 0,
        otherDeductions: 0,
      });

      // 5 days * (2000/6) = 1666.67
      expect(result.basicSalary).toBeCloseTo(1666.67, 1);
      expect(result.socialInsuranceEmployee).toBe(220); // 2000 * 11%
    });
  });

  describe('Social Insurance', () => {
    it('should calculate 11% employee + 18.75% employer', () => {
      const result = calculator.calculate({
        category: 'MONTHLY',
        basicSalary: 5000,
        insurableSalary: 4500,
        workedDays: 26,
        workedHours: 208,
        overtimeMinutes: 0,
        lateMinutes: 0,
        absentDays: 0,
        transportAllowance: 0,
        mealAllowance: 0,
        housingAllowance: 0,
        performanceBonus: 0,
        loanDeduction: 0,
        advanceDeduction: 0,
        otherDeductions: 0,
      });

      expect(result.socialInsuranceEmployee).toBe(495); // 4500 * 0.11
      expect(result.socialInsuranceEmployer).toBe(843.75); // 4500 * 0.1875
    });
  });
});
