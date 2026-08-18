import { PrismaClient } from '@prisma/client';
import { TasksService } from '../src/modules/tasks/tasks.service';

const prisma = new PrismaClient();
const tasksService = new TasksService(prisma as any);

async function testQueries() {
  console.log('--- TEST 1: listTasks({}) ---');
  const res1 = await tasksService.listTasks({});
  console.log('Result 1 count:', res1.length);

  console.log('--- TEST 2: listTasks({ search: "" }) ---');
  const res2 = await tasksService.listTasks({ search: '' });
  console.log('Result 2 count:', res2.length);

  console.log('--- TEST 3: listTasks({ assignedToId: "cmsyha76s009sipb44nm9umc7" }) ---');
  const res3 = await tasksService.listTasks({ assignedToId: 'cmsyha76s009sipb44nm9umc7' });
  console.log('Result 3 count:', res3.length);

  console.log('--- TEST 4: listTasks({ assignedToName: "Sanika Mote" }) ---');
  const res4 = await tasksService.listTasks({ assignedToName: 'Sanika Mote' });
  console.log('Result 4 count:', res4.length);
}

testQueries().finally(() => prisma.$disconnect());
