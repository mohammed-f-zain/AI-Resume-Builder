import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ResumeBuilder } from "@/components/resume/ResumeBuilder";

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1db4ce]" />
        </div>
      }
    >
      <ResumeBuilder />
    </Suspense>
  );
}
