"""
Seed data script for HRMS Phase 1 - Employee Management
Creates: 1 Company, 6 Departments, 8 Positions, 20 Dummy Employees
"""
import asyncio
import sys
import os
from datetime import date
from decimal import Decimal
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import async_session, engine, Base
from app.models.hrms import (
    Company, Department, Position, WorkLocation, Employee,
    Gender, MaritalStatus, MilitaryStatus, EducationLevel, EmploymentType,
    ContractType, EmployeeStatus, PositionGrade, WorkLocationType,
)


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        existing = await session.execute(
            __import__("sqlalchemy", fromlist=["select"]).select(Company)
        )
        if existing.scalars().first():
            print("[SKIP] Company already exists - seed already run")
            return

        print("[SEED] Creating company...")
        company = Company(
            id=str(uuid.uuid4()),
            name_ar="شركة مصر للتطوير",
            name_en="Misr Development Co.",
            commercial_register="12345",
            tax_card="987-654-321",
            insurance_register="INS-001",
            activity="Software Development",
            establishment_date=date(2010, 1, 15),
            address="القاهرة، مصر الجديدة، شارع العروبة",
            phone="+20221234567",
            email="info@misrdev.com",
        )
        session.add(company)
        await session.flush()

        print("[SEED] Creating work locations...")
        locations = [
            WorkLocation(id=str(uuid.uuid4()), company_id=company.id, name="المقر الرئيسي - القاهرة", address="مصر الجديدة", location_type=WorkLocationType.office),
            WorkLocation(id=str(uuid.uuid4()), company_id=company.id, name="فرع الإسكندرية", address="سموحة، الإسكندرية", location_type=WorkLocationType.branch),
            WorkLocation(id=str(uuid.uuid4()), company_id=company.id, name="المصنع - العاشر من رمضان", address="المنطقة الصناعية", location_type=WorkLocationType.factory),
        ]
        for loc in locations:
            session.add(loc)
        await session.flush()

        print("[SEED] Creating departments...")
        departments = [
            Department(id=(dept_id := str(uuid.uuid4())), company_id=company.id, name_ar="الإدارة العامة", name_en="General Management", code="MGMT"),
            Department(id=(hr_id := str(uuid.uuid4())), company_id=company.id, name_ar="الموارد البشرية", name_en="Human Resources", code="HR"),
            Department(id=(it_id := str(uuid.uuid4())), company_id=company.id, name_ar="تكنولوجيا المعلومات", name_en="Information Technology", code="IT"),
            Department(id=(fin_id := str(uuid.uuid4())), company_id=company.id, name_ar="المالية", name_en="Finance", code="FIN"),
            Department(id=(ops_id := str(uuid.uuid4())), company_id=company.id, name_ar="العمليات", name_en="Operations", code="OPS"),
            Department(id=(mkt_id := str(uuid.uuid4())), company_id=company.id, name_ar="التسويق", name_en="Marketing", code="MKT"),
        ]
        for dept in departments:
            session.add(dept)
        await session.flush()

        print("[SEED] Creating positions...")
        positions = [
            Position(id=str(uuid.uuid4()), department_id=dept_id, title_ar="المدير العام", title_en="General Manager", grade=PositionGrade.manager, salary_range_min=Decimal("25000"), salary_range_max=Decimal("40000")),
            Position(id=str(uuid.uuid4()), department_id=hr_id, title_ar="مدير الموارد البشرية", title_en="HR Manager", grade=PositionGrade.senior_manager, salary_range_min=Decimal("18000"), salary_range_max=Decimal("28000")),
            Position(id=str(uuid.uuid4()), department_id=hr_id, title_ar="أخصائي التوظيف", title_en="Recruitment Specialist", grade=PositionGrade.specialist, salary_range_min=Decimal("8000"), salary_range_max=Decimal("14000")),
            Position(id=str(uuid.uuid4()), department_id=it_id, title_ar="مدير تكنولوجيا المعلومات", title_en="IT Manager", grade=PositionGrade.senior_manager, salary_range_min=Decimal("20000"), salary_range_max=Decimal("30000")),
            Position(id=str(uuid.uuid4()), department_id=it_id, title_ar="مطور برمجيات أول", title_en="Senior Software Developer", grade=PositionGrade.specialist, salary_range_min=Decimal("12000"), salary_range_max=Decimal("20000")),
            Position(id=str(uuid.uuid4()), department_id=it_id, title_ar="مطور برمجيات", title_en="Software Developer", grade=PositionGrade.technician, salary_range_min=Decimal("8000"), salary_range_max=Decimal("14000")),
            Position(id=str(uuid.uuid4()), department_id=fin_id, title_ar="مدير المالية", title_en="Finance Manager", grade=PositionGrade.senior_manager, salary_range_min=Decimal("18000"), salary_range_max=Decimal("28000")),
            Position(id=str(uuid.uuid4()), department_id=fin_id, title_ar="محاسب", title_en="Accountant", grade=PositionGrade.technician, salary_range_min=Decimal("6000"), salary_range_max=Decimal("10000")),
        ]
        for pos in positions:
            session.add(pos)
        await session.flush()

        print("[SEED] Creating 20 employees...")
        employees_data = [
            {"first": "أحمد", "middle": "محمد", "last": "السيد", "dept": dept_id, "title_ar": "المدير العام", "basic": Decimal("30000"), "housing": Decimal("5000"), "transport": Decimal("1000"), "food": Decimal("800"), "position": 0, "gender": Gender.male, "status": EmployeeStatus.active, "email": "ahmed.sayed@misrdev.com", "mobile": "01001234567", "national_id": "29001012345678", "dob": date(1990, 1, 1), "marital": MaritalStatus.married, "military": MilitaryStatus.completed, "edu": EducationLevel.bachelor, "hire": date(2015, 3, 15), "contract_start": date(2015, 3, 15), "contract_end": date(2027, 3, 14), "insurance": True, "insurance_num": "INS-A001", "bank": "البنك الأهلي", "bank_acc": "123456789"},
            {"first": "فاطمة", "middle": "علي", "last": "حسن", "dept": hr_id, "title_ar": "مدير الموارد البشرية", "basic": Decimal("22000"), "housing": Decimal("3000"), "transport": Decimal("800"), "food": Decimal("600",), "position": 1, "gender": Gender.female, "status": EmployeeStatus.active, "email": "fatma.ali@misrdev.com", "mobile": "01002345678", "national_id": "28501023456789", "dob": date(1985, 5, 10), "marital": MaritalStatus.married, "military": MilitaryStatus.not_required, "edu": EducationLevel.master, "hire": date(2016, 1, 10), "contract_start": date(2016, 1, 10), "contract_end": date(2026, 1, 9), "insurance": True, "insurance_num": "INS-A002", "bank": "بنك مصر", "bank_acc": "234567890"},
            {"first": "محمد", "middle": "إبراهيم", "last": "عبد الله", "dept": it_id, "title_ar": "مدير تكنولوجيا المعلومات", "basic": Decimal("25000"), "housing": Decimal("4000"), "transport": Decimal("1000"), "food": Decimal("700"), "position": 3, "gender": Gender.male, "status": EmployeeStatus.active, "email": "mohamed.ibrahim@misrdev.com", "mobile": "01003456789", "national_id": "28801034567890", "dob": date(1988, 8, 20), "marital": MaritalStatus.married, "military": MilitaryStatus.completed, "edu": EducationLevel.bachelor, "hire": date(2017, 6, 1), "contract_start": date(2017, 6, 1), "contract_end": date(2027, 5, 31), "insurance": True, "insurance_num": "INS-A003", "bank": "البنك التجاري", "bank_acc": "345678901"},
            {"first": "سارة", "middle": "أحمد", "last": "محمود", "dept": hr_id, "title_ar": "أخصائي التوظيف", "basic": Decimal("10000"), "housing": Decimal("2000"), "transport": Decimal("500"), "food": Decimal("400"), "position": 2, "gender": Gender.female, "status": EmployeeStatus.active, "email": "sara.ahmed@misrdev.com", "mobile": "01004567890", "national_id": "29501045678901", "dob": date(1995, 2, 15), "marital": MaritalStatus.single, "military": MilitaryStatus.not_required, "edu": EducationLevel.bachelor, "hire": date(2020, 9, 1), "contract_start": date(2020, 9, 1), "contract_end": date(2025, 8, 31), "insurance": True, "insurance_num": "INS-A004", "bank": "بنك الإسكندرية", "bank_acc": "456789012"},
            {"first": "خالد", "middle": "حسين", "last": "عمر", "dept": it_id, "title_ar": "مطور برمجيات أول", "basic": Decimal("15000"), "housing": Decimal("2500"), "transport": Decimal("700"), "food": Decimal("500"), "position": 4, "gender": Gender.male, "status": EmployeeStatus.active, "email": "khaled.hussein@misrdev.com", "mobile": "01005678901", "national_id": "29201056789012", "dob": date(1992, 11, 5), "marital": MaritalStatus.married, "military": MilitaryStatus.completed, "edu": EducationLevel.bachelor, "hire": date(2019, 4, 15), "contract_start": date(2019, 4, 15), "contract_end": date(2026, 4, 14), "insurance": True, "insurance_num": "INS-A005", "bank": "البنك الأهلي", "bank_acc": "567890123"},
            {"first": "نور", "middle": "الدين", "last": "يوسف", "dept": it_id, "title_ar": "مطور برمجيات", "basic": Decimal("9000"), "housing": Decimal("1500"), "transport": Decimal("400"), "food": Decimal("300"), "position": 5, "gender": Gender.male, "status": EmployeeStatus.active, "email": "nour.yousef@misrdev.com", "mobile": "01006789012", "national_id": "29801067890123", "dob": date(1998, 7, 22), "marital": MaritalStatus.single, "military": MilitaryStatus.completed, "edu": EducationLevel.bachelor, "hire": date(2022, 1, 10), "contract_start": date(2022, 1, 10), "contract_end": date(2025, 1, 9), "insurance": True, "insurance_num": "INS-A006", "bank": "بنك مصر", "bank_acc": "678901234"},
            {"first": "منى", "middle": "عبد", "last": "الرحمن", "dept": fin_id, "title_ar": "مدير المالية", "basic": Decimal("20000"), "housing": Decimal("3500"), "transport": Decimal("900"), "food": Decimal("700"), "position": 6, "gender": Gender.female, "status": EmployeeStatus.active, "email": "mona.abdelrahman@misrdev.com", "mobile": "01007890123", "national_id": "28701078901234", "dob": date(1987, 4, 12), "marital": MaritalStatus.married, "military": MilitaryStatus.not_required, "edu": EducationLevel.master, "hire": date(2014, 11, 1), "contract_start": date(2014, 11, 1), "contract_end": date(2026, 10, 31), "insurance": True, "insurance_num": "INS-A007", "bank": "البنك التجاري", "bank_acc": "789012345"},
            {"first": "عمر", "middle": "طارق", "last": "الزهري", "dept": fin_id, "title_ar": "محاسب", "basic": Decimal("7500"), "housing": Decimal("1200"), "transport": Decimal("350"), "food": Decimal("250"), "position": 7, "gender": Gender.male, "status": EmployeeStatus.active, "email": "omar.tarek@misrdev.com", "mobile": "01008901234", "national_id": "29601089012345", "dob": date(1996, 9, 30), "marital": MaritalStatus.single, "military": MilitaryStatus.completed, "edu": EducationLevel.bachelor, "hire": date(2021, 3, 20), "contract_start": date(2021, 3, 20), "contract_end": date(2025, 3, 19), "insurance": True, "insurance_num": "INS-A008", "bank": "بنك الإسكندرية", "bank_acc": "890123456"},
            {"first": "ليلى", "middle": "سامي", "last": "خالد", "dept": hr_id, "title_ar": "أخصائي التوظيف", "basic": Decimal("9500"), "housing": Decimal("1800"), "transport": Decimal("500"), "food": Decimal("400"), "position": 2, "gender": Gender.female, "status": EmployeeStatus.active, "email": "layla.samy@misrdev.com", "mobile": "01009012345", "national_id": "29401090123456", "dob": date(1994, 6, 18), "marital": MaritalStatus.married, "military": MilitaryStatus.not_required, "edu": EducationLevel.bachelor, "hire": date(2021, 7, 5), "contract_start": date(2021, 7, 5), "contract_end": date(2025, 7, 4), "insurance": True, "insurance_num": "INS-A009", "bank": "البنك الأهلي", "bank_acc": "901234567"},
            {"first": "ياسمين", "middle": "فؤاد", "last": "نبيل", "dept": it_id, "title_ar": "مطور برمجيات", "basic": Decimal("10000"), "housing": Decimal("1800"), "transport": Decimal("500"), "food": Decimal("400"), "position": 5, "gender": Gender.female, "status": EmployeeStatus.active, "email": "yasmin.fouad@misrdev.com", "mobile": "01010123456", "national_id": "29301012345679", "dob": date(1993, 3, 25), "marital": MaritalStatus.single, "military": MilitaryStatus.not_required, "edu": EducationLevel.bachelor, "hire": date(2022, 5, 15), "contract_start": date(2022, 5, 15), "contract_end": date(2025, 5, 14), "insurance": True, "insurance_num": "INS-A010", "bank": "بنك مصر", "bank_acc": "012345678"},
            {"first": "محمود", "middle": "حسن", "last": "عبد العزيز", "dept": ops_id, "title_ar": "مدير العمليات", "basic": Decimal("18000"), "housing": Decimal("3000"), "transport": Decimal("800"), "food": Decimal("600"), "position": None, "gender": Gender.male, "status": EmployeeStatus.active, "email": "mahmoud.hassan@misrdev.com", "mobile": "01011234567", "national_id": "28601012345680", "dob": date(1986, 12, 8), "marital": MaritalStatus.married, "military": MilitaryStatus.completed, "edu": EducationLevel.bachelor, "hire": date(2013, 8, 1), "contract_start": date(2013, 8, 1), "contract_end": date(2026, 7, 31), "insurance": True, "insurance_num": "INS-A011", "bank": "البنك التجاري", "bank_acc": "123450987"},
            {"first": "هدى", "middle": "كمال", "last": "سعد", "dept": mkt_id, "title_ar": "مدير التسويق", "basic": Decimal("16000"), "housing": Decimal("2500"), "transport": Decimal("700"), "food": Decimal("500"), "position": None, "gender": Gender.female, "status": EmployeeStatus.active, "email": "hoda.kamal@misrdev.com", "mobile": "01012345678", "national_id": "28901012345681", "dob": date(1989, 10, 14), "marital": MaritalStatus.married, "military": MilitaryStatus.not_required, "edu": EducationLevel.master, "hire": date(2015, 2, 20), "contract_start": date(2015, 2, 20), "contract_end": date(2026, 2, 19), "insurance": True, "insurance_num": "INS-A012", "bank": "بنك الإسكندرية", "bank_acc": "234561098"},
            {"first": "عبدالله", "middle": "ناصر", "last": "فهمي", "dept": it_id, "title_ar": "مطور برمجيات", "basic": Decimal("8500"), "housing": Decimal("1500"), "transport": Decimal("400"), "food": Decimal("300"), "position": 5, "gender": Gender.male, "status": EmployeeStatus.active, "email": "abdallah.nasser@misrdev.com", "mobile": "01013456789", "national_id": "29701012345682", "dob": date(1997, 1, 28), "marital": MaritalStatus.single, "military": MilitaryStatus.completed, "edu": EducationLevel.bachelor, "hire": date(2023, 1, 15), "contract_start": date(2023, 1, 15), "contract_end": date(2026, 1, 14), "insurance": True, "insurance_num": "INS-A013", "bank": "البنك الأهلي", "bank_acc": "345672109"},
            {"first": "رانيا", "middle": "ممدوح", "last": "شريف", "dept": fin_id, "title_ar": "محاسب", "basic": Decimal("7000"), "housing": Decimal("1100"), "transport": Decimal("300"), "food": Decimal("250"), "position": 7, "gender": Gender.female, "status": EmployeeStatus.active, "email": "rania.mamdouh@misrdev.com", "mobile": "01014567890", "national_id": "29101012345683", "dob": date(1991, 5, 3), "marital": MaritalStatus.married, "military": MilitaryStatus.not_required, "edu": EducationLevel.diploma, "hire": date(2020, 6, 1), "contract_start": date(2020, 6, 1), "contract_end": date(2025, 5, 31), "insurance": True, "insurance_num": "INS-A014", "bank": "بنك مصر", "bank_acc": "456783210"},
            {"first": "كريم", "middle": "وليد", "last": "منصور", "dept": ops_id, "title_ar": "مشرف عمليات", "basic": Decimal("9000"), "housing": Decimal("1500"), "transport": Decimal("400"), "food": Decimal("300"), "position": None, "gender": Gender.male, "status": EmployeeStatus.active, "email": "karim.waleed@misrdev.com", "mobile": "01015678901", "national_id": "29001012345684", "dob": date(1990, 8, 17), "marital": MaritalStatus.married, "military": MilitaryStatus.completed, "edu": EducationLevel.bachelor, "hire": date(2019, 10, 10), "contract_start": date(2019, 10, 10), "contract_end": date(2025, 10, 9), "insurance": True, "insurance_num": "INS-A015", "bank": "البنك التجاري", "bank_acc": "567894321"},
            {"first": "دينا", "middle": "هشام", "last": "رضا", "dept": mkt_id, "title_ar": "أخصائي تسويق", "basic": Decimal("8000"), "housing": Decimal("1200"), "transport": Decimal("350"), "food": Decimal("250"), "position": None, "gender": Gender.female, "status": EmployeeStatus.active, "email": "dina.hisham@misrdev.com", "mobile": "01016789012", "national_id": "29501012345685", "dob": date(1995, 11, 9), "marital": MaritalStatus.single, "military": MilitaryStatus.not_required, "edu": EducationLevel.bachelor, "hire": date(2022, 8, 1), "contract_start": date(2022, 8, 1), "contract_end": date(2025, 7, 31), "insurance": True, "insurance_num": "INS-A016", "bank": "بنك الإسكندرية", "bank_acc": "678905432"},
            {"first": "أمير", "middle": "سعيد", "last": "جمال", "dept": it_id, "title_ar": "مطور برمجيات أول", "basic": Decimal("14000"), "housing": Decimal("2200"), "transport": Decimal("600"), "food": Decimal("450"), "position": 4, "gender": Gender.male, "status": EmployeeStatus.active, "email": "amir.saeed@misrdev.com", "mobile": "01017890123", "national_id": "29201012345686", "dob": date(1992, 4, 21), "marital": MaritalStatus.married, "military": MilitaryStatus.completed, "edu": EducationLevel.bachelor, "hire": date(2020, 2, 15), "contract_start": date(2020, 2, 15), "contract_end": date(2026, 2, 14), "insurance": True, "insurance_num": "INS-A017", "bank": "البنك الأهلي", "bank_acc": "789016543"},
            {"first": "جنى", "middle": "ماهر", "last": "عادل", "dept": hr_id, "title_ar": "أخصائي التوظيف", "basic": Decimal("9000"), "housing": Decimal("1500"), "transport": Decimal("400"), "food": Decimal("300"), "position": 2, "gender": Gender.female, "status": EmployeeStatus.long_leave, "email": "jana.maher@misrdev.com", "mobile": "01018901234", "national_id": "29601012345687", "dob": date(1996, 2, 14), "marital": MaritalStatus.single, "military": MilitaryStatus.not_required, "edu": EducationLevel.bachelor, "hire": date(2021, 11, 1), "contract_start": date(2021, 11, 1), "contract_end": date(2025, 10, 31), "insurance": True, "insurance_num": "INS-A018", "bank": "بنك مصر", "bank_acc": "890127654"},
            {"first": "حازم", "middle": "رشدي", "last": "كمال", "dept": fin_id, "title_ar": "محاسب", "basic": Decimal("6500"), "housing": Decimal("1000"), "transport": Decimal("300"), "food": Decimal("200"), "position": 7, "gender": Gender.male, "status": EmployeeStatus.active, "email": "hazem.roshdy@misrdev.com", "mobile": "01019012345", "national_id": "29901012345688", "dob": date(1999, 6, 7), "marital": MaritalStatus.single, "military": MilitaryStatus.postponed, "edu": EducationLevel.bachelor, "hire": date(2023, 6, 1), "contract_start": date(2023, 6, 1), "contract_end": date(2026, 5, 31), "insurance": False, "bank": "البنك التجاري", "bank_acc": "901238765"},
            {"first": "مريم", "middle": "طارق", "last": "حاتم", "dept": it_id, "title_ar": "مطور برمجيات", "basic": Decimal("9500"), "housing": Decimal("1600"), "transport": Decimal("450"), "food": Decimal("350"), "position": 5, "gender": Gender.female, "status": EmployeeStatus.active, "email": "mariam.tarek@misrdev.com", "mobile": "01020123456", "national_id": "29301012345689", "dob": date(1993, 9, 19), "marital": MaritalStatus.married, "military": MilitaryStatus.not_required, "edu": EducationLevel.bachelor, "hire": date(2022, 9, 10), "contract_start": date(2022, 9, 10), "contract_end": date(2025, 9, 9), "insurance": True, "insurance_num": "INS-A020", "bank": "بنك الإسكندرية", "bank_acc": "012349876"},
        ]

        dept_list = [d.id for d in departments]
        pos_list = [p.id for p in positions]
        loc_ids = [l.id for l in locations]

        for i, emp_data in enumerate(employees_data):
            code = f"EMP-{str(i+1).zfill(4)}"
            dept_idx = {"MGMT": 0, "HR": 1, "IT": 2, "FIN": 3, "OPS": 4, "MKT": 5}
            dept_map = {"MGMT": dept_id, "HR": hr_id, "IT": it_id, "FIN": fin_id, "OPS": ops_id, "MKT": mkt_id}

            for dept_code, d_id in dept_map.items():
                if emp_data["dept"] == d_id:
                    emp_dept = d_id
                    break

            emp = Employee(
                id=str(uuid.uuid4()),
                employee_code=code,
                first_name=emp_data["first"],
                middle_name=emp_data["middle"],
                last_name=emp_data["last"],
                full_name_arabic=f"{emp_data['first']} {emp_data['middle']} {emp_data['last']}",
                full_name_english=f"{emp_data['first']} {emp_data['middle']} {emp_data['last']}",
                national_id=emp_data["national_id"],
                date_of_birth=emp_data["dob"],
                gender=emp_data["gender"],
                marital_status=emp_data["marital"],
                nationality="Egyptian",
                religion="Muslim",
                blood_type=["A+", "B+", "O+", "AB+"][i % 4],
                military_status=emp_data["military"],
                governorate="القاهرة",
                city="مصر الجديدة",
                address=f"شارع {i+1}، مصر الجديدة",
                home_phone=f"022{i+1:02d}34567",
                mobile_phone=emp_data["mobile"],
                email=emp_data["email"],
                emergency_contact_name=f"{emp_data['first']} {emp_data['middle']}",
                emergency_contact_relation="spouse" if emp_data["marital"] == MaritalStatus.married else "parent",
                emergency_contact_phone=f"011{i+1:02d}345678",
                education_level=emp_data["edu"],
                university="جامعة القاهرة",
                faculty="الهندسة" if emp_data["dept"] == it_id else "التجارة",
                graduation_year=emp_data["dob"].year + 22,
                grade_value="جيد جداً" if i % 3 == 0 else "ممتاز" if i % 3 == 1 else "جيد",
                job_title_arabic=emp_data["title_ar"],
                department_id=emp_data["dept"],
                position_id=pos_list[emp_data["position"]] if emp_data["position"] is not None else None,
                direct_manager_id=None if i == 0 else None,
                work_location_id=loc_ids[i % len(loc_ids)],
                employment_type=EmploymentType.permanent,
                contract_type=ContractType.fixed_term,
                hiring_date=emp_data["hire"],
                contract_start_date=emp_data["contract_start"],
                contract_end_date=emp_data["contract_end"],
                probation_end_date=date(emp_data["hire"].year, min(emp_data["hire"].month + 3, 12), emp_data["hire"].day),
                basic_salary=emp_data["basic"],
                housing_allowance=emp_data["housing"],
                transportation_allowance=emp_data["transport"],
                food_allowance=emp_data["food"],
                other_allowances=Decimal("500"),
                is_insured=emp_data["insurance"],
                insurance_number=emp_data.get("insurance_num"),
                insurance_office="مكتب التأمينات - مصر الجديدة",
                insurance_start_date=emp_data["hire"],
                insurance_salary=emp_data["basic"],
                bank_name=emp_data["bank"],
                bank_branch="فرع مصر الجديدة",
                bank_account_number=emp_data["bank_acc"],
                status=emp_data["status"],
                notes="موظف مميز" if i < 5 else "",
            )
            session.add(emp)

        await session.commit()
        print("[DONE] Seed completed: 1 company, 6 departments, 8 positions, 3 locations, 20 employees")


if __name__ == "__main__":
    asyncio.run(seed())
