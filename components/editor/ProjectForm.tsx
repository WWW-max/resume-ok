import { ResumeData } from "@/lib/resume-data";
import { ExperienceForm } from "./ExperienceForm";
export function ProjectForm(props: { data: ResumeData; onChange: (data: ResumeData) => void }) {
  return <ExperienceForm {...props} section="projects" />;
}
