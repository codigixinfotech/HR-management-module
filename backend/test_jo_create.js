const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mr = await prisma.manpowerRequisition.findFirst({
    where: { mrNumber: 'MR-2026-007' }
  });
  console.log('Found MR:', mr?.mrNumber, mr?.id);

  if (!mr) {
    console.log('No MR found');
    return;
  }

  try {
    const jo = await prisma.jobOpening.create({
      data: {
        companyId: mr.companyId,
        departmentId: mr.departmentId,
        manpowerRequisitionId: mr.id,
        requisitionCode: 'REQ-TEST-001',
        mrNumber: mr.mrNumber,
        title: mr.role,
        numPositions: mr.numOpenings,
        costCenter: mr.costCenter,
        employmentType: mr.employmentType,
        priority: mr.priority,
        candidateType: 'BOTH',
        minExperience: 3,
        maxExperience: 5,
        minSalary: mr.minSalary,
        maxSalary: mr.maxSalary,
        qualification: mr.qualification,
        experience: mr.experience,
        requiredSkills: mr.requiredSkills,
        workLocation: mr.workLocation,
        reportingManagerId: mr.reportingManagerId,
        status: 'READY_TO_PUBLISH',
      }
    });

    console.log('SUCCESSFULLY CREATED JOB OPENING:', jo.id, jo.requisitionCode);
    await prisma.jobOpening.delete({ where: { id: jo.id } });
    console.log('CLEANED UP TEST JOB OPENING');
  } catch (err) {
    console.error('FAILED TO CREATE JOB OPENING:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
