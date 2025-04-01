import { PrismaClient, Role, NetworkType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.network.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const teacherPassword = await bcrypt.hash("teacher123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: Role.ADMIN,
      institution: "Swinburne University",
    },
  });

  const teacher = await prisma.user.create({
    data: {
      name: "Teacher User",
      email: "teacher@example.com",
      password: teacherPassword,
      role: Role.TEACHER,
      institution: "Swinburne University",
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "Regular User",
      email: "user@example.com",
      password: userPassword,
      role: Role.USER,
      institution: "Swinburne University",
    },
  });

  // Create classrooms
  const classrooms = await Promise.all([
    prisma.classroom.create({
      data: {
        name: "Class A",
        capacity: 30,
      },
    }),
    prisma.classroom.create({
      data: {
        name: "Class B",
        capacity: 25,
      },
    }),
    prisma.classroom.create({
      data: {
        name: "Class C",
        capacity: 35,
      },
    }),
  ]);

  // Create students with varying performance scores
  const students = await Promise.all(
    Array.from({ length: 20 }, (_, i) => {
      const grade = ["A", "B", "C", "D"][Math.floor(Math.random() * 4)];
      const performance = Math.random() * 100;
      return prisma.student.create({
        data: {
          name: `Student ${i + 1}`,
          email: `student${i + 1}@example.com`,
          grade,
          performance,
          networkMetrics: {
            centrality: Math.random(),
            clustering: Math.random(),
            density: Math.random(),
          },
          classroomId:
            classrooms[Math.floor(Math.random() * classrooms.length)].id,
        },
      });
    })
  );

  // Create network relationships between students
  const networkTypes = Object.values(NetworkType);
  const networks = await Promise.all(
    Array.from({ length: 50 }, () => {
      const sourceId = students[Math.floor(Math.random() * students.length)].id;
      const targetId = students[Math.floor(Math.random() * students.length)].id;
      const type =
        networkTypes[Math.floor(Math.random() * networkTypes.length)];
      const weight = Math.random();

      return prisma.network.create({
        data: { type, sourceId, targetId, weight },
      });
    })
  );

  console.log("Seed data created successfully!");
  console.log(`Created ${await prisma.user.count()} users`);
  console.log(`Created ${await prisma.classroom.count()} classrooms`);
  console.log(`Created ${await prisma.student.count()} students`);
  console.log(`Created ${await prisma.network.count()} network relationships`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
