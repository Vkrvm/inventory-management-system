import { prisma } from "@/lib/db";

export async function logHistory({
  userId,
  action,
  entity,
  entityId,
  details,
}: {
  userId: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, any>;
}) {
  try {
    await prisma.history.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log history:", error);
  }
}
