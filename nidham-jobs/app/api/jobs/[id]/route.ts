import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      skills: true,
      _count: { select: { applications: true } },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "الوظيفة غير موجودة" }, { status: 404 });
  }

  return NextResponse.json(job);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "COMPANY") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) {
    return NextResponse.json({ error: "الوظيفة غير موجودة" }, { status: 404 });
  }

  const company = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!company || job.companyId !== company.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.job.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "COMPANY") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) {
    return NextResponse.json({ error: "الوظيفة غير موجودة" }, { status: 404 });
  }

  const company = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!company || job.companyId !== company.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  await prisma.job.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "تم الحذف" });
}
