"use server";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { eq, isNull, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const db = getDb();
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

  const db = getDb();

  // Validate admin limits
  if (session.user.role === "ADMIN") {
    // Prevent ADMIN from creating SUPER_ADMIN or another ADMIN (unless specified, let's restrict to SELLER)
    if (data.role !== "SELLER") {
      throw new Error("Admins can only create Sellers");
    }

    const adminUserArr = await db.select().from(users).where(eq(users.id, session.user.id));
    const adminUser = adminUserArr[0];
    
    const createdUsersArr = await db.select().from(users).where(and(eq(users.createdBy, session.user.id), isNull(users.deletedAt)));
    
    if (adminUser.adminLimit !== null && createdUsersArr.length >= (adminUser.adminLimit || 0)) {
      throw new Error("Has alcanzado el límite de usuarios que puedes crear.");
    }
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: data.role,
    adminLimit: data.adminLimit || 0,
    createdBy: session.user.id,
  });

  revalidatePath("/dashboard/users");
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Only Super Admin can delete users");
  }

  const db = getDb();
  await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, id));
  
  revalidatePath("/dashboard/users");
}
