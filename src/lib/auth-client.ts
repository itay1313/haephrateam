import type { Role } from "@/lib/auth";

export function canEdit(role: Role) {
  return role === "OWNER" || role === "ADMIN" || role === "FAMILY";
}
