import { redirect } from "next/navigation";

export default async function LegacyAvaliacaoRedirect({ params }) {
  const { path = [] } = await params;
  const suffix = path.length ? `/${path.join("/")}` : "";

  redirect(`/portal${suffix}`);
}
