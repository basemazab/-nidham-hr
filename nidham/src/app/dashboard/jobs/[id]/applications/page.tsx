import { redirect } from "next/navigation";

// Compatibility redirect. Older "new applicant" notifications linked to
// /dashboard/jobs/<id>/applications, which never existed as a page (applicants
// are listed on the job page itself) — so the link 404'd. This sends both old
// and new notification links to the job page, which has the applicants table.
export default async function JobApplicationsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/jobs/${id}`);
}
