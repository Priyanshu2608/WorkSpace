import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const task = await prisma.task.create({
      data: {
        title: "Test Global Task",
        priority: "High",
        featureId: null,
        projectId: null,
      }
    });
    console.log("Success:", task)
  } catch (e) {
    console.error("Prisma Error:", e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
