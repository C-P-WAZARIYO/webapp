const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

const PERMISSIONS = [
  // User permissions
  { name: 'View Users', resource: 'users', action: 'read', description: 'View user list and details' },
  { name: 'Create Users', resource: 'users', action: 'create', description: 'Create new users' },
  { name: 'Update Users', resource: 'users', action: 'update', description: 'Update user details' },
  { name: 'Delete Users', resource: 'users', action: 'delete', description: 'Delete users' },
  { name: 'Manage Users', resource: 'users', action: 'manage', description: 'Full user management access' },

  // Role permissions
  { name: 'View Roles', resource: 'roles', action: 'read', description: 'View roles and permissions' },
  { name: 'Create Roles', resource: 'roles', action: 'create', description: 'Create new roles' },
  { name: 'Update Roles', resource: 'roles', action: 'update', description: 'Update role details' },
  { name: 'Delete Roles', resource: 'roles', action: 'delete', description: 'Delete roles' },
  { name: 'Manage Roles', resource: 'roles', action: 'manage', description: 'Full role and permission management' },

  // Audit permissions
  { name: 'View Audit Logs', resource: 'audit', action: 'read', description: 'View audit logs' },
  { name: 'Manage Audit', resource: 'audit', action: 'manage', description: 'Full audit log access' },

  // Case management
  { name: 'Import Cases', resource: 'cases', action: 'import', description: 'Upload 50k row Excel files' },
  { name: 'Reset Cases', resource: 'cases', action: 'reset', description: 'Monthly performance reset' },
  
  // Field Feedback
  { name: 'Submit Feedback', resource: 'feedback', action: 'create', description: 'Submit visit with GPS/Photo' },
  { name: 'Audit Feedback', resource: 'feedback', action: 'audit', description: 'Approve location mismatches' },
];

const ROLES = [
  {
    name: 'admin',
    description: 'Full system administrator with all permissions',
    isDefault: false,
    permissions: [
      'users:read', 'users:create', 'users:update', 'users:delete', 'users:manage',
      'roles:read', 'roles:create', 'roles:update', 'roles:delete', 'roles:manage',
      'audit:read', 'audit:manage', 'cases:import', 'cases:reset', 'feedback:audit'
    ],
  },
  {
    name: 'supervisor',
    description: 'Manages Jaipur team and audits visits',
    isDefault: false,
    permissions: ['users:read', 'cases:read', 'feedback:audit', 'audit:read'],
  },
  {
    name: 'field_executive',
    description: 'On-ground collection agent',
    isDefault: false,
    permissions: ['cases:read_assigned', 'feedback:create'],
  },
  {
    name: 'user',
    description: 'Regular user with basic permissions',
    isDefault: true,
    permissions: [],
  },
  {
    name: 'hr',
    description: 'Manages salary, bank details, and employee status',
    isDefault: false,
    permissions: [
      'users:read', 
      'users:update', 
      'audit:read'
    ],
  },
  {
    name: 'analytic',
    description: 'View-only access for reporting and performance tracking',
    isDefault: false,
    permissions: [
      'users:read', 
      'cases:read', // Note: This should be linked to a "read-only" permission
      'audit:read'
    ],
  }
];

async function main() {
  console.log('🌱 Starting database seed with Argon2...\n');

  // Create permissions
  console.log('Creating permissions...');
  const createdPermissions = {};

  for (const perm of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {
        name: perm.name,
        description: perm.description,
      },
      create: {
        name: perm.name,
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
      },
    });
    createdPermissions[`${perm.resource}:${perm.action}`] = permission.id;
    console.log(`  ✓ ${perm.name}`);
  }

  // Create roles
  console.log('\nCreating roles...');

  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        description: roleData.description,
        isDefault: roleData.isDefault,
      },
      create: {
        name: roleData.name,
        description: roleData.description,
        isDefault: roleData.isDefault,
      },
    });

    // Assign permissions to role
    for (const permKey of roleData.permissions) {
      const permissionId = createdPermissions[permKey];
      if (permissionId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId,
          },
        });
      }
    }

    console.log(`  ✓ ${roleData.name} (${roleData.permissions.length} permissions)`);
  }

  // Create admin user
  console.log('\nCreating admin user...');

 const adminPassword = await argon2.hash('Admin@123!', {
    type: argon2.argon2id, // Explicitly use Argon2id
    memoryCost: 2 ** 16,   // 64 MB (adjust based on your server)
    timeCost: 3,           // 3 iterations
    parallelism: 1         // 1 thread
  });
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });

  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@authx.local' },
    update: {},
    create: {
      email: 'admin@authx.local',
      username: 'admin',
      phone: '9352550883', // Added
      emp_id: 'SYSTEM_ADMIN_01', // Added
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
      isVerified: true,
    },
  });

  // Assign admin role
  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
  }

  console.log('  ✓ Admin user created');
  console.log('\n════════════════════════════════════════');
  console.log('  Admin Credentials:');
  console.log('  Email:    admin@authx.local');
  console.log('  Password: Admin@123!');
  console.log('════════════════════════════════════════\n');

  console.log('✅ Database seed completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });