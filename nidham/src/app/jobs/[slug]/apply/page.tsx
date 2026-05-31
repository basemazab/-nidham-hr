import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function OldApplyRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/apply/${slug}`);
}
