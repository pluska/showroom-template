"use server";

import { getDb } from "@/lib/db";
import { users, appointments } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq, isNull, and, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getUsers() {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const db = await getDb();
  let query;

  if (session.user.role === "SUPER_ADMIN") {
    query = db.select().from(users).where(isNull(users.deletedAt));
  } else {
    // ADMIN can only see SELLERs or users they created (simplified for now to just show SELLERS they created or general sellers)
    query = db.select().from(users).where(and(eq(users.role, "SELLER"), isNull(users.deletedAt)));
  }

  return await query;
}

export async function createUser(data: any) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const db = await getDb();

  // Validate admin limits
  if (session.user.role === "ADMIN") {
    // Prevent ADMIN from creating SUPER_ADMIN or another ADMIN (unless specified, let's restrict to SELLER)
    if (data.role !== "SELLER") {
      throw new Error("Admins can only create Sellers");
    }

    const adminUserArr = await db.select().from(users).where(eq(users.id, session.user.id));
    const adminUser = adminUserArr[0];
    
    const createdUsersArr = await db.select().from(users).where(and(eq(users.createdBy, session.user.id), isNull(users.deletedAt)));
    
    if (adminUser && adminUser.adminLimit !== null && adminUser.adminLimit > 0) {
      if (createdUsersArr.length >= adminUser.adminLimit) {
        throw new Error(`Has alcanzado el límite de usuarios que puedes crear (${adminUser.adminLimit}).`);
      }
    }
  }

  const limitValue = data.role === "ADMIN" ? (data.adminLimit ?? 5) : (data.adminLimit || 0);
  const hashedPassword = bcrypt.hashSync(data.password, 10);

  await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: data.role,
    adminLimit: limitValue,
    createdBy: session.user.id,
  });

  revalidatePath("/dashboard/users");
}

export async function deleteUser(id: string, transferToId?: string) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Only Super Admin can delete users");
  }

  const db = await getDb();

  if (transferToId) {
    await db
      .update(appointments)
      .set({
        sellerId: transferToId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(appointments.sellerId, id),
          gte(appointments.date, new Date()), // transfer future appointments
          isNull(appointments.deletedAt)
        )
      );
  }

  await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, id));
  
  revalidatePath("/dashboard/users");
}

export async function updateUser(id: string, data: any) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const db = await getDb();

  const updateData: any = {
    name: data.name,
    email: data.email,
    updatedAt: new Date(),
  };

  // Validate roles and limits updates
  if (session.user.role === "SUPER_ADMIN") {
    if (data.role) updateData.role = data.role;
    if (data.adminLimit !== undefined) updateData.adminLimit = data.adminLimit;
  } else {
    // ADMIN can only update SELLERs
    const targetUserArr = await db.select().from(users).where(eq(users.id, id));
    const targetUser = targetUserArr[0];
    if (!targetUser || targetUser.role !== "SELLER") {
      throw new Error("Unauthorized: Admins can only edit Sellers");
    }
  }

  if (data.password) {
    updateData.password = bcrypt.hashSync(data.password, 10);
  }

  await db.update(users).set(updateData).where(eq(users.id, id));
  
  revalidatePath("/dashboard/users");
}
