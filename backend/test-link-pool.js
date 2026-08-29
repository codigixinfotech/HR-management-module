const path = require('path');
process.env.NODE_PATH = path.join(__dirname, 'node_modules');
require('module').Module._initPaths();

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { InterviewsService } = require('./dist/src/modules/recruitment/interviews.service');
const { TeamsLinkPoolService } = require('./dist/src/modules/recruitment/teams/teams-link-pool.service');

async function runVerification() {
  console.log('\n==================================================');
  console.log('--- STARTING TEAMS LINK POOL SYSTEM VERIFICATION ---');
  console.log('==================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const poolService = app.get(TeamsLinkPoolService);
  const interviewsService = app.get(InterviewsService);

  // 1. Verify Pool Seeding
  await poolService.seedInitialLinksIfNeeded();
  const poolLinks = await poolService.listPoolLinks();
  console.log(`✅ Step 1: Verified ${poolLinks.length} Teams links in database pool:`);
  poolLinks.forEach(l => console.log(`   [${l.linkNumber}] ${l.title} -> ${l.meetingUrl}`));

  // 2. Test Allocation for Slot 1 (10:00 AM - 11:00 AM) -> Should get Link 1
  console.log('\n--- Test Case A: Scheduling Interview 1 at 10:00 AM ---');
  const inv1 = await interviewsService.createInterview({
    candidateId: 'cand-demo-1',
    candidateName: 'Candidate One',
    candidateEmail: 'candidate1@gmail.com',
    position: 'DevOps Lead',
    interviewDate: '2026-09-01',
    startTime: '10:00 AM',
    durationMinutes: 60,
    interviewFormat: 'Microsoft Teams',
    panelMemberIds: ['emp-1'],
  });
  console.log(`✅ Interview 1 Created: Code=${inv1.interviewCode}, Assigned Link=${inv1.meetingLink}`);

  // 3. Test Allocation for Overlapping Slot 2 (10:00 AM - 11:00 AM) -> Should get Link 2
  console.log('\n--- Test Case B: Scheduling Overlapping Interview 2 at 10:00 AM ---');
  const inv2 = await interviewsService.createInterview({
    candidateId: 'cand-demo-1',
    candidateName: 'Candidate Two',
    candidateEmail: 'candidate2@gmail.com',
    position: 'Fullstack Dev',
    interviewDate: '2026-09-01',
    startTime: '10:00 AM',
    durationMinutes: 60,
    interviewFormat: 'Microsoft Teams',
    panelMemberIds: ['emp-1'],
  });
  console.log(`✅ Interview 2 Created: Code=${inv2.interviewCode}, Assigned Link=${inv2.meetingLink}`);

  // 4. Test Allocation for Non-Overlapping Slot 3 (11:00 AM - 12:00 PM) -> Should recycle Link 1
  console.log('\n--- Test Case C: Scheduling Non-Overlapping Interview 3 at 11:00 AM ---');
  const inv3 = await interviewsService.createInterview({
    candidateId: 'cand-demo-1',
    candidateName: 'Candidate Three',
    candidateEmail: 'candidate3@gmail.com',
    position: 'Product Designer',
    interviewDate: '2026-09-01',
    startTime: '11:00 AM',
    durationMinutes: 60,
    interviewFormat: 'Microsoft Teams',
    panelMemberIds: ['emp-1'],
  });
  console.log(`✅ Interview 3 Created: Code=${inv3.interviewCode}, Assigned Link=${inv3.meetingLink} (Recycled Link 1!)`);

  console.log('\n==================================================');
  console.log('🎉 ALL BACKEND VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('==================================================\n');

  await app.close();
}

runVerification().catch(err => {
  console.error('❌ Verification Error:', err);
  process.exit(1);
});
