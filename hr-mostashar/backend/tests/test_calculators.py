import pytest
from app.services.calculators import (
    calculate_end_of_service,
    calculate_insurance,
    calculate_leaves,
    calculate_net_salary,
)


class TestEndOfServiceCalculator:
    def test_basic_calculation_under_5_years(self):
        result = calculate_end_of_service(
            start_date="2020-01-01",
            end_date="2024-12-31",
            total_salary=5000,
        )
        years = result["years_of_service"]
        expected = years * 5000 * 0.5
        assert result["reward"] == pytest.approx(expected, rel=0.01)
        assert years < 5

    def test_calculation_over_5_years(self):
        result = calculate_end_of_service(
            start_date="2015-01-01",
            end_date="2024-12-31",
            total_salary=8000,
        )
        years = result["years_of_service"]
        expected = 5 * 8000 * 0.5 + (years - 5) * 8000 * 1.0
        assert result["reward"] == pytest.approx(expected, rel=0.01)

    def test_arbitrary_dismissal_bonus(self):
        result = calculate_end_of_service(
            start_date="2018-01-01",
            end_date="2024-12-31",
            total_salary=6000,
            reason="arbitrary_dismissal",
        )
        years = result["years_of_service"]
        base = 5 * 6000 * 0.5 + (years - 5) * 6000 * 1.0
        expected = base + base * 0.5
        assert result["reward"] == pytest.approx(expected, rel=0.01)

    def test_breakdown_present(self):
        result = calculate_end_of_service(
            start_date="2020-01-01",
            end_date="2024-12-31",
            total_salary=5000,
        )
        assert len(result["breakdown"]) > 0
        assert "legal_reference" in result


class TestInsuranceCalculator:
    def test_basic_insurance(self):
        result = calculate_insurance(gross_salary=5000)
        assert result["insurance_base"] == 5000
        assert result["employee_deductions"]["total"] == pytest.approx(5000 * 0.11, rel=0.01)
        assert result["employer_contributions"]["total"] == pytest.approx(5000 * 0.2025, rel=0.01)

    def test_minimum_base(self):
        result = calculate_insurance(gross_salary=1000)
        assert result["insurance_base"] == 2300
        assert result["employee_deductions"]["total"] == pytest.approx(2300 * 0.11, rel=0.01)

    def test_maximum_base(self):
        result = calculate_insurance(gross_salary=20000)
        assert result["insurance_base"] == 14500
        assert result["employee_deductions"]["total"] == pytest.approx(14500 * 0.11, rel=0.01)

    def test_net_salary(self):
        result = calculate_insurance(gross_salary=8000)
        expected = 8000 - (8000 * 0.11)
        assert result["net_salary_after_insurance"] == pytest.approx(expected, rel=0.01)


class TestLeavesCalculator:
    def test_under_10_years(self):
        result = calculate_leaves(
            start_date="2020-01-01",
            current_date="2024-12-31",
            employee_age=30,
        )
        assert result["annual_leave"]["total"] == 21

    def test_over_10_years(self):
        result = calculate_leaves(
            start_date="2010-01-01",
            current_date="2024-12-31",
            employee_age=40,
        )
        assert result["annual_leave"]["total"] == 30

    def test_over_50_years(self):
        result = calculate_leaves(
            start_date="2020-01-01",
            current_date="2024-12-31",
            employee_age=55,
        )
        assert result["annual_leave"]["total"] == 45

    def test_remaining_calculation(self):
        result = calculate_leaves(
            start_date="2020-01-01",
            current_date="2024-12-31",
            taken_days=10,
            employee_age=30,
        )
        assert result["annual_leave"]["remaining"] == 11


class TestNetSalaryCalculator:
    def test_exempt_salary(self):
        result = calculate_net_salary(gross_salary=3000)
        assert result["tax"]["annual"] == 0
        assert result["net_monthly"] > 0

    def test_basic_tax(self):
        result = calculate_net_salary(gross_salary=10000)
        assert result["gross_monthly"] == 10000
        assert result["insurance_deductions"]["monthly"] == pytest.approx(10000 * 0.11, rel=0.01)
        assert result["net_monthly"] < result["gross_monthly"]

    def test_high_salary(self):
        result = calculate_net_salary(gross_salary=50000)
        assert result["tax"]["annual"] > 0
        assert len(result["tax"]["breakdown"]) > 1

    def test_family_discount(self):
        result_single = calculate_net_salary(gross_salary=10000, marital_status="single")
        result_married = calculate_net_salary(gross_salary=10000, marital_status="married", dependents=1)
        assert result_married["net_monthly"] > result_single["net_monthly"]
