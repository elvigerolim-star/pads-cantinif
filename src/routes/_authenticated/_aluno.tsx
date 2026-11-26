import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StudentShell } from "@/components/pads/student-shell";

export const Route = createFileRoute("/_authenticated/_aluno")({
  component: () => (
    <StudentShell>
      <Outlet />
    </StudentShell>
  ),
});
