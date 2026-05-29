import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Egyptian Payroll Calculator
 * - Social Insurance: Law 148/2019
 *   Employee: 11% on insurable wage
 *   Employer: 18.75% on insurable wage
 * - Income Tax: 2025 brackets (after personal exemption of EGP 20,000/year)
 * - Monthly salary divisor: 26 days (monthly employees)
 */

interface EmployeePayrollInput {
  category: 'MONTHLY' | 'WEEKLY' | 'HOURLY';
  basicSalary: number;
  insurableSalary: number;
  hourlyRate?: number;
  workedDays: number;
  workedHours: number;
  overtimeMinutes: number;
  lateMinutes: number;
  absentDays: number;
  transportAllowance: number;
  mealAllowance: number;
  housingAllowance: number;
  performanceBonus: number;
  loanDeduction: number;
  advanceDeduction: number;
  otherDeductions: number;
}

export interface PayrollCalculationResult {
  basicSalary: number;
  workedDays: number;
  workedHours: number;
  transportAllowance: number;
  mealAllowance: number;
  housingAllowance: number;
  performanceBonus: number;
  overtimePay: number;
  otherEarnings: number;
  grossSalary: number;
  socialInsuranceEmployee: number;
  socialInsuranceEmployer: number;
  incomeTax: number;
  loanDeduction: number;
  advanceDeduction: number;
  absenceDeduction: number;
  lateDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  annualGross: number;
  annualSI: number;
  annualTaxable: number;
  annualTax: number;
}

// 2025 Egyptian income tax brackets (annual, after exemptions)
const TAX_BRACKETS = [
  { min: 0, max: 40000, rate: 0 },
  { min: 40000, max: 55000, rate: 0.10 },
  { min: 55000, max: 70000, rate: 0.15 },
  { min: 70000, max: 200000, rate: 0.20 },
  { min: 200000, max: 400000, rate: 0.225 },
  { min: 400000, max: 600000, rate: 0.25 },
  { min: 600000, max: Infinity, rate: 0.275 },
];

const PERSONAL_EXEMPTION = 20000; // EGP/year
const SI_EMPLOYEE_RATE = 0.11;
const SI_EMPLOYER_RATE = 0.1875;
const MONTHLY_DIVISOR = 26; // working days per month for monthly employees
const OVERTIME_MULTIPLIER = 1.5; // 150% for regular overtime

@Injectable()
export class PayrollCalculator {
  calculate(input: EmployeePayrollInput): PayrollCalculationResult {
    let basicEarned: number;
    let absenceDeduction = 0;
    let lateDeduction = 0;
    let overtimePay = 0;

    switch (input.category) {
      case 'MONTHLY': {
        // Monthly: basic / 26 * worked days
        const dailyRate = input.basicSalary / MONTHLY_DIVISOR;
        absenceDeduction = round2(input.absentDays * dailyRate);
        lateDeduction = round2((input.lateMinutes / 60) * (dailyRate / 8));
        overtimePay = round2((input.overtimeMinutes / 60) * (dailyRate / 8) * OVERTIME_MULTIPLIER);
        basicEarned = round2(input.basicSalary - absenceDeduction);
        break;
      }
      case 'WEEKLY': {
        // Weekly: based on actual days worked
        const dailyRate = input.basicSalary / 6; // 6-day week
        basicEarned = round2(input.workedDays * dailyRate);
        lateDeduction = round2((input.lateMinutes / 60) * (dailyRate / 8));
        overtimePay = round2((input.overtimeMinutes / 60) * (dailyRate / 8) * OVERTIME_MULTIPLIER);
        break;
      }
      case 'HOURLY': {
        const rate = input.hourlyRate || 0;
        basicEarned = round2(input.workedHours * rate);
        overtimePay = round2((input.overtimeMinutes / 60) * rate * OVERTIME_MULTIPLIER);
        break;
      }
      default:
        basicEarned = input.basicSalary;
    }

    const grossSalary = round2(
      basicEarned +
      input.transportAllowance +
      input.mealAllowance +
      input.housingAllowance +
      input.performanceBonus +
      overtimePay
    );

    // Social Insurance (on insurable salary, not gross)
    const monthlyInsurable = input.insurableSalary;
    const siEmployee = round2(monthlyInsurable * SI_EMPLOYEE_RATE);
    const siEmployer = round2(monthlyInsurable * SI_EMPLOYER_RATE);

    // Income Tax Calculation
    const annualGross = round2(grossSalary * 12);
    const annualSI = round2(siEmployee * 12);
    const annualTaxableBeforeExemption = round2(annualGross - annualSI);
    const annualTaxable = round2(Math.max(0, annualTaxableBeforeExemption - PERSONAL_EXEMPTION));
    const annualTax = round2(this.calculateAnnualTax(annualTaxable));
    const monthlyTax = round2(annualTax / 12);

    const totalDeductions = round2(
      siEmployee +
      monthlyTax +
      input.loanDeduction +
      input.advanceDeduction +
      absenceDeduction +
      lateDeduction +
      input.otherDeductions
    );

    const netSalary = round2(grossSalary - totalDeductions);

    return {
      basicSalary: basicEarned,
      workedDays: input.workedDays,
      workedHours: input.workedHours,
      transportAllowance: input.transportAllowance,
      mealAllowance: input.mealAllowance,
      housingAllowance: input.housingAllowance,
      performanceBonus: input.performanceBonus,
      overtimePay,
      otherEarnings: 0,
      grossSalary,
      socialInsuranceEmployee: siEmployee,
      socialInsuranceEmployer: siEmployer,
      incomeTax: monthlyTax,
      loanDeduction: input.loanDeduction,
      advanceDeduction: input.advanceDeduction,
      absenceDeduction,
      lateDeduction,
      otherDeductions: input.otherDeductions,
      totalDeductions,
      netSalary,
      annualGross,
      annualSI,
      annualTaxable,
      annualTax,
    };
  }

  calculateAnnualTax(taxableIncome: number): number {
    let tax = 0;
    let remaining = taxableIncome;

    for (const bracket of TAX_BRACKETS) {
      if (remaining <= 0) break;
      const bracketWidth = bracket.max - bracket.min;
      const amountInBracket = Math.min(remaining, bracketWidth);
      tax += amountInBracket * bracket.rate;
      remaining -= amountInBracket;
    }

    return tax;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
