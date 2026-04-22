import type { ReactNode } from "react";
import { buildMetadata } from "@/app/seo";

export const metadata = buildMetadata({
  title: "Free ATS Resume Builder Online | AI CV Maker | Eazitool",
  description: "Build ATS-friendly resumes that get past applicant tracking systems. AI-powered CV builder for job applications. 100% free, no signup required.",
  path: "/tools/cv-builder",
  keywords: [
    "ATS resume builder",
    "free CV maker",
    "job application",
    "resume builder online",
    "ATS friendly CV",
    "AI resume builder",
    "create CV for job",
  ],
});

export default function CVBuilderLayout({ children }: { children: ReactNode }) {
  return children;
}
