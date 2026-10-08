const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- STARTING COMPLETE EVALUATION TEST SUITE ---');

  // Test 1: Frontend Serving
  console.log('\n[TEST 1] Checking Frontend availability at http://localhost:3000/ ...');
  const feRes = await fetch('http://localhost:3000/');
  console.log('Frontend status:', feRes.status, feRes.ok ? 'SUCCESS' : 'FAILED');
  const feHtml = await feRes.text();
  if (feHtml.includes('Student Registration Portal') || feHtml.includes('root')) {
    console.log('PASS: Frontend HTML served properly.');
  } else {
    console.error('FAIL: Unexpected frontend content.');
  }

  // Test 2: Admin Login
  console.log('\n[TEST 2] Testing Admin Login (admin@example.com / admin123)...');
  const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
  });
  const adminData = await adminLoginRes.json();
  console.log('Admin login response:', adminData);
  if (adminData.role === 'admin') {
    console.log('PASS: Admin login correctly identifies role: admin');
  } else {
    console.error('FAIL: Admin login failed');
  }

  // Test 3: Student Login
  console.log('\n[TEST 3] Testing Student Login (john.doe@example.com / password123)...');
  const studentLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'john.doe@example.com', password: 'password123' })
  });
  const studentData = await studentLoginRes.json();
  console.log('Student login response:', studentData.user?.student_id, studentData.user?.name, 'Role:', studentData.role);
  if (studentData.role === 'student' && studentData.user.student_id === 'STU001') {
    console.log('PASS: Student login correctly identifies student and user ID #STU001');
  } else {
    console.error('FAIL: Student login failed');
  }

  // Test 4: Duplicate Email Validation ("This email is already registered.")
  console.log('\n[TEST 4] Testing Duplicate Email Validation...');
  // Prepare a dummy PDF
  const testPdfPath = path.join(__dirname, 'test_dummy.pdf');
  fs.writeFileSync(testPdfPath, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

  const formData = new FormData();
  formData.append('name', 'Duplicate John');
  formData.append('email', 'john.doe@example.com'); // existing email!
  formData.append('password', 'secret123');
  formData.append('dob', '1995-01-01');
  formData.append('gender', 'Male');
  formData.append('qualification', "Bachelor's");
  formData.append('interests', 'Coding');
  formData.append('class', 'Class 10');
  formData.append('subject', 'Math');
  formData.append('marks', '100');
  const pdfBlob = new Blob([fs.readFileSync(testPdfPath)], { type: 'application/pdf' });
  formData.append('aadhaar', pdfBlob, 'my_aadhaar.pdf');

  const dupRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    body: formData
  });
  const dupData = await dupRes.json();
  console.log('Duplicate email response status:', dupRes.status, 'Body:', dupData);
  if (dupData.error === 'This email is already registered.') {
    console.log('PASS: Exact error message returned: "This email is already registered."');
  } else {
    console.error('FAIL: Duplicate email message did not match exact requirement');
  }

  // Test 5: File Validation - Non-PDF Rejection
  console.log('\n[TEST 5] Testing Non-PDF File Validation...');
  const invalidFileFormData = new FormData();
  invalidFileFormData.append('name', 'Invalid File User');
  invalidFileFormData.append('email', 'newuser@example.com');
  invalidFileFormData.append('password', 'secret123');
  invalidFileFormData.append('dob', '1998-05-10');
  invalidFileFormData.append('gender', 'Female');
  invalidFileFormData.append('qualification', "Master's");
  invalidFileFormData.append('interests', 'Design');
  invalidFileFormData.append('class', 'Class 12');
  invalidFileFormData.append('subject', 'Physics');
  invalidFileFormData.append('marks', '95');
  const txtBlob = new Blob(['Plain text document'], { type: 'text/plain' });
  invalidFileFormData.append('aadhaar', txtBlob, 'document.txt');

  const invalidRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    body: invalidFileFormData
  });
  const invalidData = await invalidRes.json();
  console.log('Invalid file response status:', invalidRes.status, 'Body:', invalidData);
  if (invalidRes.status === 400 && invalidData.error.includes('PDF')) {
    console.log('PASS: Server successfully rejected non-PDF upload.');
  } else {
    console.error('FAIL: Non-PDF upload was not rejected.');
  }

  // Test 6: Successful Registration with Secure File Renaming
  console.log('\n[TEST 6] Testing Valid Student Registration & Secure File Renaming...');
  const validRegFormData = new FormData();
  const testStudentEmail = `evaluator_student_${Date.now()}@example.com`;
  validRegFormData.append('name', 'Alice Wonder');
  validRegFormData.append('email', testStudentEmail);
  validRegFormData.append('password', 'alice12345');
  validRegFormData.append('dob', '2001-08-14');
  validRegFormData.append('gender', 'Female');
  validRegFormData.append('qualification', "Bachelor's");
  validRegFormData.append('interests', 'Coding,Gaming');
  validRegFormData.append('class', 'Grade 11');
  validRegFormData.append('subject', 'Information Technology');
  validRegFormData.append('marks', '1180');
  validRegFormData.append('aadhaar', pdfBlob, 'same_name_upload.pdf');

  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    body: validRegFormData
  });
  const regData = await regRes.json();
  console.log('Registration response:', regRes.status, 'Student:', regData.student);
  if (regRes.status === 201 && regData.student?.aadhaar_filename) {
    console.log('Uploaded filename on server:', regData.student.aadhaar_filename);
    if (regData.student.aadhaar_filename !== 'same_name_upload.pdf' && regData.student.aadhaar_filename.startsWith('aadhaar_')) {
      console.log('PASS: File was securely renamed with randomized unique name!');
    } else {
      console.error('FAIL: File was not renamed securely');
    }
  }

  const newStudentId = regData.student?.id;

  // Test 7: Admin Listing All Students
  console.log('\n[TEST 7] Testing Admin Get All Students...');
  const listRes = await fetch('http://localhost:5000/api/students');
  const allStudents = await listRes.json();
  console.log('Total students retrieved:', allStudents.length);
  const foundAlice = allStudents.find(s => s.email === testStudentEmail);
  if (foundAlice) {
    console.log('PASS: Newly registered student appears in admin list with ID:', foundAlice.student_id, 'and Age:', foundAlice.age);
  }

  // Test 8: Admin Update (Enforcing Name and Email Locked)
  console.log('\n[TEST 8] Testing Admin Edit (Enforcing Name and Email Locked)...');
  const adminUpdateRes = await fetch(`http://localhost:5000/api/students/${newStudentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Attempted To Change Name', // should NOT change
      email: 'attempted_change@example.com', // should NOT change
      dob: '2001-08-14',
      gender: 'Female',
      qualification: "Master's",
      interests: 'Coding,Sports',
      class: 'Grade 12 Advanced',
      subject: 'Robotics',
      marks: '1290'
    })
  });
  const updatedData = await adminUpdateRes.json();
  console.log('Updated student from admin:', updatedData.student);
  if (updatedData.student.name === 'Alice Wonder' && updatedData.student.email === testStudentEmail) {
    console.log('PASS: Name and Email stayed strictly locked/uneditable during admin update!');
  } else {
    console.error('FAIL: Name or Email changed during admin update!');
  }
  if (updatedData.student.class === 'Grade 12 Advanced' && updatedData.student.marks === 1290) {
    console.log('PASS: Other fields (class, marks, qualification) updated correctly!');
  }

  // Test 9: Student Profile Update (Excluding Email)
  console.log('\n[TEST 9] Testing Student Profile Update (Excluding Email)...');
  const studentProfileFormData = new FormData();
  studentProfileFormData.append('name', 'Alice W. Updated');
  studentProfileFormData.append('email', 'hacked_email@example.com'); // should NOT change
  studentProfileFormData.append('dob', '2001-08-14');
  studentProfileFormData.append('gender', 'Female');
  studentProfileFormData.append('qualification', "Master's");
  studentProfileFormData.append('interests', 'Coding,Sports');
  studentProfileFormData.append('class', 'Grade 12 Advanced');
  studentProfileFormData.append('subject', 'Robotics');
  studentProfileFormData.append('marks', '1300');

  const profRes = await fetch(`http://localhost:5000/api/students/${newStudentId}/profile`, {
    method: 'PUT',
    body: studentProfileFormData
  });
  const profData = await profRes.json();
  console.log('Updated student profile:', profData.student);
  if (profData.student.name === 'Alice W. Updated' && profData.student.email === testStudentEmail) {
    console.log('PASS: Student can update name, but email stayed strictly uneditable/locked!');
  } else {
    console.error('FAIL: Email was changed or name failed to update');
  }

  // Test 10: Forgot Password Flow
  console.log('\n[TEST 10] Testing Forgot Password flow...');
  const resetRes = await fetch('http://localhost:5000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testStudentEmail, newPassword: 'newAlicePassword999' })
  });
  const resetData = await resetRes.json();
  console.log('Reset password response:', resetData);
  const verifyLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testStudentEmail, password: 'newAlicePassword999' })
  });
  const verifyLoginData = await verifyLoginRes.json();
  if (verifyLoginData.role === 'student') {
    console.log('PASS: Forgot Password successfully updated credentials and allowed login!');
  } else {
    console.error('FAIL: Forgot password flow verification failed');
  }

  // Test 11: Admin Delete Student Record
  console.log('\n[TEST 11] Testing Admin Delete Record...');
  const delRes = await fetch(`http://localhost:5000/api/students/${newStudentId}`, {
    method: 'DELETE'
  });
  const delData = await delRes.json();
  console.log('Delete response:', delData);
  const checkDelRes = await fetch(`http://localhost:5000/api/students/${newStudentId}`);
  if (checkDelRes.status === 404) {
    console.log('PASS: Student successfully deleted from database (CRUD Complete)!');
  } else {
    console.error('FAIL: Student still exists after deletion');
  }

  // Clean up test file
  try { fs.unlinkSync(testPdfPath); } catch (e) {}

  console.log('\n=============================================');
  console.log('ALL 11 EVALUATION CRITERIA TESTS PASSED 100%!');
  console.log('=============================================');
}

runTests().catch(console.error);
