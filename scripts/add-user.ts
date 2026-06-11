import { db, initDatabase } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";

initDatabase();

async function main() {
  const [email, name, password] = process.argv.slice(2);

  if (!email || !name || !password) {
    console.error("Usage: npx tsx scripts/add-user.ts <email> <name> <password>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    id: uuid(),
    email,
    name,
    passwordHash,
    totpSecret: null,
    totpEnabled: false,
    isAdmin: false,
    createdAt: new Date(),
  });

  console.log(`User created: ${email}`);
}

main().catch(console.error);
