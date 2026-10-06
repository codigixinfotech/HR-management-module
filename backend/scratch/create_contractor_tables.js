const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTables() {
  console.log('--- Creating Contractor Management Tables ---');

  // 1. contractor_vendors
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS contractor_vendors (
      id VARCHAR(64) PRIMARY KEY,
      company_id VARCHAR(64) NOT NULL,
      branch_id VARCHAR(64) NULL,
      vendor_code VARCHAR(50) NOT NULL,
      legal_name VARCHAR(255) NOT NULL,
      display_name VARCHAR(255) NULL,
      vendor_type VARCHAR(50) NOT NULL DEFAULT 'MANPOWER_AGENCY',
      registration_number VARCHAR(100) NULL,
      gstin VARCHAR(50) NULL,
      pan VARCHAR(50) NULL,
      registered_address TEXT NULL,
      city VARCHAR(100) NULL,
      state VARCHAR(100) NULL,
      pincode VARCHAR(20) NULL,
      primary_contact_name VARCHAR(100) NOT NULL,
      primary_contact_phone VARCHAR(50) NOT NULL,
      primary_contact_email VARCHAR(100) NOT NULL,
      emergency_contact_name VARCHAR(100) NULL,
      emergency_contact_phone VARCHAR(50) NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      remarks TEXT NULL,
      created_by VARCHAR(64) NULL,
      updated_by VARCHAR(64) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      UNIQUE KEY uq_vendor_code (company_id, vendor_code),
      INDEX idx_cv_company (company_id),
      INDEX idx_cv_branch (branch_id),
      INDEX idx_cv_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created contractor_vendors');

  // 2. contractor_contracts
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS contractor_contracts (
      id VARCHAR(64) PRIMARY KEY,
      vendor_id VARCHAR(64) NOT NULL,
      company_id VARCHAR(64) NOT NULL,
      branch_id VARCHAR(64) NULL,
      contract_number VARCHAR(100) NOT NULL,
      contract_start_date DATE NOT NULL,
      contract_end_date DATE NOT NULL,
      contract_type VARCHAR(50) NOT NULL DEFAULT 'MANPOWER_SUPPLY',
      scope_of_work TEXT NOT NULL,
      department_id VARCHAR(64) NULL,
      maximum_headcount INT NOT NULL DEFAULT 10,
      billing_type VARCHAR(50) NULL,
      billing_rate DECIMAL(12,2) NULL,
      payment_terms VARCHAR(100) NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      renewal_required BOOLEAN NOT NULL DEFAULT FALSE,
      renewal_date DATE NULL,
      contract_document_id VARCHAR(64) NULL,
      remarks TEXT NULL,
      created_by VARCHAR(64) NULL,
      updated_by VARCHAR(64) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cc_vendor (vendor_id),
      INDEX idx_cc_company (company_id),
      INDEX idx_cc_branch (branch_id),
      INDEX idx_cc_status (status),
      INDEX idx_cc_end_date (contract_end_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created contractor_contracts');

  // 3. contractor_workers
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS contractor_workers (
      id VARCHAR(64) PRIMARY KEY,
      vendor_id VARCHAR(64) NOT NULL,
      contract_id VARCHAR(64) NOT NULL,
      company_id VARCHAR(64) NOT NULL,
      branch_id VARCHAR(64) NULL,
      worker_code VARCHAR(50) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      middle_name VARCHAR(100) NULL,
      last_name VARCHAR(100) NOT NULL,
      gender VARCHAR(20) NULL,
      date_of_birth DATE NULL,
      mobile VARCHAR(50) NOT NULL,
      email VARCHAR(100) NULL,
      government_id_type VARCHAR(50) NULL,
      government_id_number VARCHAR(50) NULL,
      joining_date DATE NOT NULL,
      exit_date DATE NULL,
      department_id VARCHAR(64) NULL,
      designation VARCHAR(100) NULL,
      skill VARCHAR(100) NOT NULL,
      skill_level VARCHAR(50) NOT NULL DEFAULT 'Semi-Skilled',
      status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      emergency_contact_name VARCHAR(100) NULL,
      emergency_contact_phone VARCHAR(50) NULL,
      created_by VARCHAR(64) NULL,
      updated_by VARCHAR(64) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_worker_code (company_id, worker_code),
      INDEX idx_cw_vendor (vendor_id),
      INDEX idx_cw_contract (contract_id),
      INDEX idx_cw_company (company_id),
      INDEX idx_cw_branch (branch_id),
      INDEX idx_cw_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created contractor_workers');

  // 4. worker_deployments
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS worker_deployments (
      id VARCHAR(64) PRIMARY KEY,
      worker_id VARCHAR(64) NOT NULL,
      vendor_id VARCHAR(64) NOT NULL,
      contract_id VARCHAR(64) NOT NULL,
      company_id VARCHAR(64) NOT NULL,
      branch_id VARCHAR(64) NULL,
      department_id VARCHAR(64) NULL,
      production_line_id VARCHAR(64) NULL,
      machine_id VARCHAR(64) NULL,
      shift_id VARCHAR(64) NULL,
      designation VARCHAR(100) NULL,
      deployment_type VARCHAR(50) NOT NULL DEFAULT 'PLANT_FLOOR',
      start_date DATE NOT NULL,
      end_date DATE NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      remarks TEXT NULL,
      created_by VARCHAR(64) NULL,
      updated_by VARCHAR(64) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_wd_worker (worker_id),
      INDEX idx_wd_vendor (vendor_id),
      INDEX idx_wd_contract (contract_id),
      INDEX idx_wd_company (company_id),
      INDEX idx_wd_branch (branch_id),
      INDEX idx_wd_status (status),
      INDEX idx_wd_dates (start_date, end_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created worker_deployments');

  // 5. contractor_compliance
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS contractor_compliance (
      id VARCHAR(64) PRIMARY KEY,
      vendor_id VARCHAR(64) NOT NULL,
      contract_id VARCHAR(64) NULL,
      company_id VARCHAR(64) NOT NULL,
      branch_id VARCHAR(64) NULL,
      compliance_type VARCHAR(50) NOT NULL DEFAULT 'CLRA',
      license_number VARCHAR(100) NOT NULL,
      issue_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      issuing_authority VARCHAR(255) NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'VALID',
      verified_by VARCHAR(100) NULL,
      verified_at DATETIME NULL,
      document_id VARCHAR(64) NULL,
      remarks TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ccomp_vendor (vendor_id),
      INDEX idx_ccomp_contract (contract_id),
      INDEX idx_ccomp_company (company_id),
      INDEX idx_ccomp_branch (branch_id),
      INDEX idx_ccomp_type (compliance_type),
      INDEX idx_ccomp_status (status),
      INDEX idx_ccomp_expiry (expiry_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created contractor_compliance');

  // 6. contractor_documents
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS contractor_documents (
      id VARCHAR(64) PRIMARY KEY,
      vendor_id VARCHAR(64) NOT NULL,
      contract_id VARCHAR(64) NULL,
      worker_id VARCHAR(64) NULL,
      document_type VARCHAR(50) NOT NULL,
      document_name VARCHAR(255) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      issue_date DATE NULL,
      expiry_date DATE NULL,
      verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      verified_by VARCHAR(100) NULL,
      verified_at DATETIME NULL,
      uploaded_by VARCHAR(100) NULL,
      uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_cdoc_vendor (vendor_id),
      INDEX idx_cdoc_contract (contract_id),
      INDEX idx_cdoc_worker (worker_id),
      INDEX idx_cdoc_status (verification_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created contractor_documents');

  // 7. contractor_vendor_history
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS contractor_vendor_history (
      id VARCHAR(64) PRIMARY KEY,
      vendor_id VARCHAR(64) NOT NULL,
      action VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(64) NOT NULL,
      old_value TEXT NULL,
      new_value TEXT NULL,
      reason TEXT NULL,
      performed_by VARCHAR(100) NULL,
      performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_cvh_vendor (vendor_id),
      INDEX idx_cvh_action (action),
      INDEX idx_cvh_time (performed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created contractor_vendor_history');

  await prisma.$disconnect();
  console.log('All 7 Contractor Management tables ready in MySQL!');
}

createTables().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
