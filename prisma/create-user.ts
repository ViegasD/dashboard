/**
 * Usage:
 *   npx tsx prisma/create-user.ts <email> <password> [name]
 *
 * Example:
 *   npx tsx prisma/create-user.ts danielly@example.com mypassword "Danielly"
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: npx tsx prisma/create-user.ts <email> <password> [name]");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, name: name ?? undefined },
    create: { email, passwordHash, name: name ?? null },
  });

  console.log(`✓ User created/updated: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
