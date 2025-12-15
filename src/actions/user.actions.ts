"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logHistory } from "@/lib/history";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createUser(formData: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
    return { error: "Unauthorized" };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: formData.email },
    });

    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(formData.password, 10);

    const user = await prisma.user.create({
      data: {
        email: formData.email,
        password: hashedPassword,
        name: formData.name,
        role: formData.role,
      },
    });

    await logHistory({
      userId: session.user.id,
      action: "CREATE_USER",
      entity: "User",
      entityId: user.id,
      details: { email: user.email, role: user.role },
    });

    revalidatePath("/dashboard/users");
    return { success: true, user };
  } catch (error) {
    console.error("Create user error:", error);
    return { error: "Failed to create user" };
  }
}

export async function updateUserRole(userId: string, role: UserRole) {
  const session = await auth();

  if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
    return { error: "Unauthorized" };
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await logHistory({
      userId: session.user.id,
      action: "UPDATE_USER_ROLE",
      entity: "User",
      entityId: userId,
      details: { newRole: role },
    });

    revalidatePath("/dashboard/users");
    return { success: true, user };
  } catch (error) {
    console.error("Update user role error:", error);
    return { error: "Failed to update user role" };
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
    return { error: "Unauthorized" };
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await logHistory({
      userId: session.user.id,
      action: "RESET_PASSWORD",
      entity: "User",
      entityId: userId,
    });

    return { success: true };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "Failed to reset password" };
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  const session = await auth();

  if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
    return { error: "Unauthorized" };
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await logHistory({
      userId: session.user.id,
      action: isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
      entity: "User",
      entityId: userId,
    });

    revalidatePath("/dashboard/users");
    return { success: true, user };
  } catch (error) {
    console.error("Toggle user status error:", error);
    return { error: "Failed to update user status" };
  }
}

export async function getUsers() {
  const session = await auth();

  if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
    return { error: "Unauthorized" };
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return { success: true, users };
  } catch (error) {
    console.error("Get users error:", error);
    return { error: "Failed to fetch users" };
  }
}
