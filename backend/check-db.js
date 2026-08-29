const path = require('path');
process.env.NODE_PATH = path.join(__dirname, 'node_modules');
require('module').Module._initPaths();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('--- Querying MySQL Database (hrm_db) for CandidateInterview Records ---');
  
  const interviews = await prisma.candidateInterview.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      candidate: { select: { firstName: true, lastName: true, email: true } },
      panelMembers: true,
    },
  });

  console.log(`Found ${interviews.length} recent interview(s) stored in database:\n`);
  
  interviews.forEach((inv, index) => {
    console.log(`=================== Interview #${index + 1} ===================`);
    console.log('ID:', inv.id);
    console.log('Interview Code:', inv.interviewCode);
    console.log('Candidate:', inv.candidate ? `${inv.candidate.firstName} ${inv.candidate.lastName} (${inv.candidate.email})` : inv.candidateId);
    console.log('Position:', inv.position);
    console.log('Interview Date:', inv.interviewDate);
    console.log('Start Time:', inv.startTime);
    console.log('Duration Minutes:', inv.durationMinutes);
    console.log('Interview Format:', inv.interviewFormat);
    console.log('Meeting Provider:', inv.meetingProvider);
    console.log('Meeting Link (stored in DB):', inv.meetingLink);
    console.log('Teams Meeting ID (stored in DB):', inv.teamsMeetingId);
    console.log('Teams Join URL (stored in DB):', inv.teamsJoinUrl);
    console.log('Status:', inv.status);
    console.log('Panel Members:', inv.panelMembers.map(p => `${p.interviewerName} (${p.panelRole})`).join(', '));
    console.log('Created At:', inv.createdAt);
    console.log('===========================================================\n');
  });

  await prisma.$disconnect();
}

checkDatabase().catch((err) => {
  console.error('DB query error:', err);
  prisma.$disconnect();
});
