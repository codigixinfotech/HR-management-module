import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ContractorManagementService } from './contractor-management.service';
import {
  CreateContractorComplianceDto,
  CreateContractorContractDto,
  CreateContractorDocumentDto,
  CreateContractorVendorDto,
  CreateContractorWorkerDto,
  CreateWorkerDeploymentDto,
  RenewContractDto,
  TransferWorkerDeploymentDto,
  UpdateContractorComplianceDto,
  UpdateContractorContractDto,
  UpdateContractorVendorDto,
  UpdateContractorWorkerDto,
  UpdateVendorStatusDto,
  VerifyComplianceDto,
} from './dto/contractor-management.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getWorkforceTenantScope } from '../../common/utils/tenant-context.util';

@Controller('workforce/contractors')
export class ContractorManagementController {
  constructor(private readonly service: ContractorManagementService) {}

  // ─────────────────────────────────────────────────────────────
  // 1. Dashboard
  // ─────────────────────────────────────────────────────────────
  @Get('dashboard')
  @Permissions('workforce.read')
  getDashboard(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.service.getDashboard(scope.companyId, scope.branchId || undefined);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Vendors
  // ─────────────────────────────────────────────────────────────
  @Get('vendors')
  @Permissions('workforce.read')
  listVendors(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
    @Query('vendorType') vendorType?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.service.listVendors(scope.companyId, scope.branchId || undefined, {
      status,
      vendorType,
      search,
    });
  }

  @Get('vendors/:id')
  @Permissions('workforce.read')
  getVendorById(@Param('id') id: string) {
    return this.service.getVendorById(id);
  }

  @Post('vendors')
  @Permissions('workforce.write')
  createVendor(
    @Body() dto: CreateContractorVendorDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, dto.companyId, dto.branchId || undefined);
    return this.service.createVendor(dto, scope.companyId, scope.branchId || undefined, user?.userId || user?.email);
  }

  @Put('vendors/:id')
  @Permissions('workforce.write')
  updateVendor(
    @Param('id') id: string,
    @Body() dto: UpdateContractorVendorDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.updateVendor(id, dto, user?.userId || user?.email);
  }

  @Patch('vendors/:id')
  @Permissions('workforce.write')
  patchVendor(
    @Param('id') id: string,
    @Body() dto: UpdateContractorVendorDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.updateVendor(id, dto, user?.userId || user?.email);
  }

  @Patch('vendors/:id/status')
  @Permissions('workforce.write')
  updateVendorStatus(
    @Param('id') id: string,
    @Body() body: UpdateVendorStatusDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.updateVendorStatus(id, body.status, body.reason, user?.userId || user?.email);
  }

  @Get('vendors/:id/history')
  @Permissions('workforce.read')
  getVendorHistory(@Param('id') id: string) {
    return this.service.getVendorHistory(id);
  }

  @Get('vendors/:id/contracts')
  @Permissions('workforce.read')
  getVendorContracts(
    @Param('id') id: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.listContracts(undefined, undefined, { vendorId: id });
  }

  @Get('vendors/:id/documents')
  @Permissions('workforce.read')
  getVendorDocuments(
    @Param('id') id: string,
    @Query('contractId') contractId?: string,
    @Query('workerId') workerId?: string,
  ) {
    return this.service.listDocuments(id, { contractId, workerId });
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Contracts
  // ─────────────────────────────────────────────────────────────
  @Get('contracts')
  @Permissions('workforce.read')
  listContracts(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.service.listContracts(scope.companyId, scope.branchId || undefined, {
      vendorId,
      departmentId,
      status,
      search,
    });
  }

  @Get('contracts/:id')
  @Permissions('workforce.read')
  getContractById(@Param('id') id: string) {
    return this.service.getContractById(id);
  }

  @Post('contracts')
  @Permissions('workforce.write')
  createContract(
    @Body() dto: CreateContractorContractDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, dto.companyId, dto.branchId || undefined);
    return this.service.createContract(dto, scope.companyId, scope.branchId || undefined, user?.userId || user?.email);
  }

  @Put('contracts/:id')
  @Permissions('workforce.write')
  updateContract(
    @Param('id') id: string,
    @Body() dto: UpdateContractorContractDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.updateContract(id, dto, user?.userId || user?.email);
  }

  @Patch('contracts/:id')
  @Permissions('workforce.write')
  patchContract(
    @Param('id') id: string,
    @Body() dto: UpdateContractorContractDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.updateContract(id, dto, user?.userId || user?.email);
  }

  @Post('contracts/:id/renew')
  @Permissions('workforce.write')
  renewContract(
    @Param('id') id: string,
    @Body() dto: RenewContractDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.renewContract(id, dto, user?.userId || user?.email);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Workers
  // ─────────────────────────────────────────────────────────────
  @Get('workers')
  @Permissions('workforce.read')
  listWorkers(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('contractId') contractId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('skill') skill?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.service.listWorkers(scope.companyId, scope.branchId || undefined, {
      vendorId,
      contractId,
      departmentId,
      skill,
      status,
      search,
    });
  }

  @Get('workers/:id')
  @Permissions('workforce.read')
  getWorkerById(@Param('id') id: string) {
    return this.service.getWorkerById(id);
  }

  @Post('workers')
  @Permissions('workforce.write')
  createWorker(
    @Body() dto: CreateContractorWorkerDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, dto.companyId, dto.branchId || undefined);
    return this.service.createWorker(dto, scope.companyId, scope.branchId || undefined, user?.userId || user?.email);
  }

  @Put('workers/:id')
  @Permissions('workforce.write')
  updateWorker(
    @Param('id') id: string,
    @Body() dto: UpdateContractorWorkerDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.updateWorker(id, dto, user?.userId || user?.email);
  }

  @Patch('workers/:id')
  @Permissions('workforce.write')
  patchWorker(
    @Param('id') id: string,
    @Body() dto: UpdateContractorWorkerDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.updateWorker(id, dto, user?.userId || user?.email);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Deployments
  // ─────────────────────────────────────────────────────────────
  @Get('deployments')
  @Permissions('workforce.read')
  listDeployments(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('contractId') contractId?: string,
    @Query('workerId') workerId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.service.listDeployments(scope.companyId, scope.branchId || undefined, {
      vendorId,
      contractId,
      workerId,
      departmentId,
      status,
      search,
    });
  }

  @Get('deployments/:id')
  @Permissions('workforce.read')
  getDeploymentById(@Param('id') id: string) {
    return this.service.getDeploymentById(id);
  }

  @Post('deployments')
  @Permissions('workforce.write')
  createDeployment(
    @Body() dto: CreateWorkerDeploymentDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, dto.companyId, dto.branchId || undefined);
    return this.service.createDeployment(dto, scope.companyId, scope.branchId || undefined, user?.userId || user?.email);
  }

  @Patch('deployments/:id/complete')
  @Permissions('workforce.write')
  completeDeployment(
    @Param('id') id: string,
    @Body('remarks') remarks?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.completeDeployment(id, user?.userId || user?.email, remarks);
  }

  @Patch('deployments/:id/transfer')
  @Permissions('workforce.write')
  transferDeployment(
    @Param('id') id: string,
    @Body() dto: TransferWorkerDeploymentDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.transferDeployment(id, dto, user?.userId || user?.email);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Statutory Compliance
  // ─────────────────────────────────────────────────────────────
  @Get('compliance')
  @Permissions('workforce.read')
  listCompliance(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('contractId') contractId?: string,
    @Query('complianceType') complianceType?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.service.listCompliance(scope.companyId, scope.branchId || undefined, {
      vendorId,
      contractId,
      complianceType,
      status,
      search,
    });
  }

  @Get('compliance/:id')
  @Permissions('workforce.read')
  getComplianceById(@Param('id') id: string) {
    return this.service.getComplianceById(id);
  }

  @Post('compliance')
  @Permissions('workforce.write')
  createCompliance(
    @Body() dto: CreateContractorComplianceDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, dto.companyId, dto.branchId || undefined);
    return this.service.createCompliance(dto, scope.companyId, scope.branchId || undefined, user?.userId || user?.email);
  }

  @Patch('compliance/:id/verify')
  @Permissions('workforce.write')
  verifyCompliance(
    @Param('id') id: string,
    @Body() dto: VerifyComplianceDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.verifyCompliance(id, dto, user?.userId || user?.email);
  }

  // ─────────────────────────────────────────────────────────────
  // 7. Documents
  // ─────────────────────────────────────────────────────────────
  @Get('documents')
  @Permissions('workforce.read')
  listDocuments(
    @Query('vendorId') vendorId: string,
    @Query('contractId') contractId?: string,
    @Query('workerId') workerId?: string,
  ) {
    return this.service.listDocuments(vendorId, { contractId, workerId });
  }

  @Post('documents')
  @Permissions('workforce.write')
  createDocument(
    @Body() dto: CreateContractorDocumentDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.createDocument(dto, user?.userId || user?.email);
  }

  @Delete('documents/:id')
  @Permissions('workforce.write')
  deleteDocument(
    @Param('id') id: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.service.deleteDocument(id, user?.userId || user?.email);
  }
}
