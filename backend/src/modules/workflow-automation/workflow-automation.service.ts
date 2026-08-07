import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowAutomationService {
  getStatus() {
    return {
      module: 'Workflow & Automation',
      status: 'scaffolded',
      message:
        'This module is scaffolded per the EHCM roadmap and is planned for a later implementation phase. Endpoints, data model and workflow are not yet implemented.',
    };
  }
}
