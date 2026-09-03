import {createAdminAccount, loginAdmin} from '../src/lib/adminAuth';
import {
  listEmployees,
  registerEmployee,
  renewAccessCode,
} from '../src/lib/employees';
import {listAttendance} from '../src/lib/attendance';

async function main() {
  try {
    await createAdminAccount('admin@test.local', 'test1234', 'Test Admin');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('email')) {
      throw error;
    }
    await loginAdmin('admin@test.local', 'test1234');
  }

  const employee = await registerEmployee({
    fullName: 'Jane Doe',
    department: 'Operations',
    username: `jane.doe.${Date.now()}`,
    password: 'staff123',
  });

  if (!/^EMP-[A-HJ-NP-Z2-9]{6}$/.test(employee.accessCode)) {
    throw new Error(`Unexpected access code: ${employee.accessCode}`);
  }

  const employees = await listEmployees();
  if (!employees.some(item => item.username === employee.username)) {
    throw new Error('Registered employee was not listed.');
  }

  const renewed = await renewAccessCode(employee);
  if (renewed.accessCode === employee.accessCode) {
    throw new Error('Renewal did not change the access code.');
  }

  const attendance = await listAttendance();

  console.log(
    JSON.stringify(
      {
        ok: true,
        employeeId: employee.employeeId,
        username: employee.username,
        originalCode: employee.accessCode,
        renewedCode: renewed.accessCode,
        employeeCount: employees.length,
        attendanceCount: attendance.length,
      },
      null,
      2,
    ),
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
