import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const results = await prisma.result.findMany({ include: { entry: { include: { event: true, rider: true } } } });
  console.log(JSON.stringify(results, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
