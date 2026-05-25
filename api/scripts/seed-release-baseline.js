/* eslint-disable no-console */
const { spawnSync } = require('child_process');

function run(label, cmd, args) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    throw new Error(`${label} failed`);
  }
}

function main() {
  run('Seeding RBAC', 'npm', ['run', 'seed:rbac']);
  run('Seeding Request Categories', 'npm', ['run', 'seed:request-categories']);
  run('Seeding Finance Request Types', 'npm', ['run', 'seed:finance-requests']);
  run('Seeding Loans System', 'npm', ['run', 'seed:loans-system']);
  run('Seeding HR Leave System', 'npm', ['run', 'seed:hr-leave-system']);
  run('Seeding Documents', 'npm', ['run', 'seed:documents']);
  run('Seeding HR Onboarding Forms', 'npm', ['run', 'seed:hr-onboarding-forms']);

  console.log('\nRelease baseline seed completed.');
  console.log('Next recommended steps:');
  console.log('1. npm run seed:first-user');
  console.log('2. npm run seed:grant-all-roles   (if needed for initial super tester)');
  console.log('3. Verify taxonomy, teams, organizations, projects in admin settings UI.');
}

main();
