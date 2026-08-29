const path = require('path');
process.env.NODE_PATH = path.join(__dirname, 'node_modules');
require('module').Module._initPaths();

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { InterviewsService } = require('./dist/src/modules/recruitment/interviews.service');

async function test() {
  console.log('--- Executing Backend Interview Creation Test ---');
  const app = await NestFactory.createApplicationContext(AppModule);
  const interviewsService = app.get(InterviewsService);

  const payload = {
    candidateId: 'cand-demo-1',
    candidateName: 'Sanika Mote',
    candidateEmail: 'motesanika@gmail.com',
    position: 'Senior Software Engineer',
    interviewDate: '2026-08-30',
    startTime: '11:00 AM',
    durationMinutes: 60,
    interviewFormat: 'Microsoft Teams',
    panelMemberIds: ['emp-1'],
    notes: 'Testing Teams Join URL generation and Nodemailer dispatch'
  };

  const result = await interviewsService.createInterview(payload);
  console.log('\n==================================================');
  console.log('✅ TEST PASSED! Created Interview Record in Database:');
  console.log('ID:', result.id);
  console.log('Interview Code:', result.interviewCode);
  console.log('Meeting Format:', result.interviewFormat);
  console.log('Meeting Link / teamsJoinUrl:', result.meetingLink);
  console.log('Teams Meeting ID:', result.teamsMeetingId);
  console.log('==================================================\n');

  await app.close();
}

test().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
