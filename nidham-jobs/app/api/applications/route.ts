import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const where: any = {};

  if (session.user.role === "CANDIDATE") {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (candidate) where.candidateId = candidate.id;
  } else if (session.user.role === "COMPANY") {
    const company = await prisma.companyProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (company) where.companyId = company.id;
  }

  const applications = await prisma.application.findMany({
    where,
    include: {
      job: { include: { company: { select: { name: true, slug: true, logo: true } } } },
      candidate: { include: { user: { select: { name: true, email: true, image: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CANDIDATE") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await req.json();
  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!candidate) {
    return NextResponse.json({ error: "بروفايل المرشح غير موجود" }, { status: 404 });
  }

  const job = await prisma.job.findUnique({ where: { id: body.jobId } });
  if (!job) {
    return NextResponse.json({ error: "الوظيفة غير موجودة" }, { status: 404 });
  }

  const existing = await prisma.application.findUnique({
    where: { jobId_candidateId: { jobId: body.jobId, candidateId: candidate.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "تم التقديم على هذه الوظيفة مسبقاً" }, { status: 409 });
  }

  const application = await prisma.application.create({
    data: {
      jobId: body.jobId,
      candidateId: candidate.id,
      companyId: job.companyId,
      coverLetter: body.coverLetter,
      resumeUrl: body.resumeUrl,
    },
  });

  await prisma.job.update({
    where: { id: body.jobId },
    data: { applicationsCount: { increment: 1 } },
  });

  return NextResponse.json(application, { status: 201 });
}
