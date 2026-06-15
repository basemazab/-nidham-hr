import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type");
  const level = searchParams.get("level");
  const location = searchParams.get("location");
  const isRemote = searchParams.get("isRemote");
  const salaryMin = searchParams.get("salaryMin");
  const salaryMax = searchParams.get("salaryMax");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const where: any = { status: "ACTIVE" };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (type) where.type = { in: type.split(",") };
  if (level) where.level = { in: level.split(",") };
  if (location) where.location = location;
  if (isRemote === "true") where.isRemote = true;
  if (salaryMin) where.salaryMin = { gte: parseInt(salaryMin) };
  if (salaryMax) where.salaryMax = { lte: parseInt(salaryMax) };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company: { select: { name: true, slug: true, logo: true, isVerified: true } },
        skills: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.job.count({ where }),
  ]);

  return NextResponse.json({
    items: jobs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "COMPANY") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const company = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!company) {
    return NextResponse.json({ error: "الشركة غير موجودة" }, { status: 404 });
  }

  const body = await req.json();
  const slug = generateSlug(body.title) + "-" + Date.now();

  const job = await prisma.job.create({
    data: {
      title: body.title,
      slug,
      description: body.description,
      requirements: body.requirements,
      benefits: body.benefits,
      type: body.type,
      category: body.category,
      level: body.level,
      location: body.location,
      isRemote: body.isRemote || false,
      salaryMin: body.salaryMin,
      salaryMax: body.salaryMax,
      salaryCurrency: body.salaryCurrency || "EGP",
      isSalaryVisible: body.isSalaryVisible || false,
      companyId: company.id,
      skills: {
        connectOrCreate: (body.skills || []).map((name: string) => ({
          where: { name },
          create: { name },
        })),
      },
    },
  });

  return NextResponse.json(job, { status: 201 });
}
