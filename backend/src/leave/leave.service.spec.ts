import { LeaveService } from './leave.service';

describe('LeaveService — Egyptian Labor Law', () => {
  let service: LeaveService;

  beforeEach(() => {
    service = new LeaveService(null as any);
  });

  describe('calculateAnnualEntitlement', () => {
    it('should give 21 days for < 10 years service and age ≤ 50', () => {
      const hireDate = new Date('2020-01-01');
      const dob = new Date('1990-01-01');
      expect(service.calculateAnnualEntitlement(hireDate, dob, 2025)).toBe(21);
    });

    it('should give 30 days for ≥ 10 years service', () => {
      const hireDate = new Date('2015-01-01');
      const dob = new Date('1990-01-01');
      expect(service.calculateAnnualEntitlement(hireDate, dob, 2025)).toBe(30);
    });

    it('should give 30 days for age > 50', () => {
      const hireDate = new Date('2020-01-01');
      const dob = new Date('1974-01-01');
      expect(service.calculateAnnualEntitlement(hireDate, dob, 2025)).toBe(30);
    });

    it('should give 30 days for both conditions met', () => {
      const hireDate = new Date('2010-01-01');
      const dob = new Date('1970-01-01');
      expect(service.calculateAnnualEntitlement(hireDate, dob, 2025)).toBe(30);
    });

    it('should give 21 days for exactly 9 years service', () => {
      const hireDate = new Date('2016-06-01');
      const dob = new Date('1995-01-01');
      expect(service.calculateAnnualEntitlement(hireDate, dob, 2025)).toBe(21);
    });
  });
});
