const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance and durability
db.pragma('journal_mode = WAL');

// Initialize tables and seed records from schema.sql
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

// Helper functions for student and admin management
function findAdminByEmail(email) {
  if (!email) return null;
  const stmt = db.prepare('SELECT * FROM admins WHERE LOWER(email) = LOWER(?)');
  return stmt.get(email.trim());
}

function findStudentByEmail(email) {
  if (!email) return null;
  const stmt = db.prepare('SELECT * FROM students WHERE LOWER(email) = LOWER(?)');
  return stmt.get(email.trim());
}

function getNextStudentId() {
  const stmt = db.prepare('SELECT MAX(id) as maxId FROM students');
  const row = stmt.get();
  const nextNumber = (row && row.maxId ? row.maxId : 0) + 1;
  return `STU${String(nextNumber).padStart(3, '0')}`;
}

function createStudent(data) {
  const studentId = data.student_id || getNextStudentId();
  const stmt = db.prepare(`
    INSERT INTO students (
      student_id, name, email, password, dob, gender,
      qualification, interests, class, subject, marks,
      aadhaar_filename, aadhaar_original_name
    ) VALUES (
      @student_id, @name, @email, @password, @dob, @gender,
      @qualification, @interests, @class, @subject, @marks,
      @aadhaar_filename, @aadhaar_original_name
    )
  `);

  const info = stmt.run({
    student_id: studentId,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
    dob: data.dob,
    gender: data.gender,
    qualification: data.qualification,
    interests: Array.isArray(data.interests) ? data.interests.join(',') : (data.interests || ''),
    class: data.class,
    subject: data.subject,
    marks: parseFloat(data.marks) || 0,
    aadhaar_filename: data.aadhaar_filename,
    aadhaar_original_name: data.aadhaar_original_name || 'aadhaar.pdf'
  });

  return getStudentById(info.lastInsertRowid);
}

function getAllStudents() {
  const stmt = db.prepare('SELECT * FROM students ORDER BY id DESC');
  return stmt.all();
}

function getStudentById(id) {
  const stmt = db.prepare('SELECT * FROM students WHERE id = ?');
  return stmt.get(id);
}

function getStudentByStudentId(studentId) {
  const stmt = db.prepare('SELECT * FROM students WHERE student_id = ?');
  return stmt.get(studentId);
}

// Admin update: STRICT RULE - Name and Email must NOT be changed!
function adminUpdateStudent(id, updateData) {
  const existing = getStudentById(id);
  if (!existing) return null;

  const stmt = db.prepare(`
    UPDATE students
    SET dob = @dob,
        gender = @gender,
        qualification = @qualification,
        interests = @interests,
        class = @class,
        subject = @subject,
        marks = @marks,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `);

  stmt.run({
    id,
    dob: updateData.dob !== undefined ? updateData.dob : existing.dob,
    gender: updateData.gender !== undefined ? updateData.gender : existing.gender,
    qualification: updateData.qualification !== undefined ? updateData.qualification : existing.qualification,
    interests: Array.isArray(updateData.interests) ? updateData.interests.join(',') : (updateData.interests !== undefined ? updateData.interests : existing.interests),
    class: updateData.class !== undefined ? updateData.class : existing.class,
    subject: updateData.subject !== undefined ? updateData.subject : existing.subject,
    marks: updateData.marks !== undefined ? parseFloat(updateData.marks) : existing.marks
  });

  return getStudentById(id);
}

// Student profile update: STRICT RULE - Email cannot be edited! Can update name, other fields, and replacement Aadhaar
function studentUpdateProfile(id, updateData) {
  const existing = getStudentById(id);
  if (!existing) return null;

  const fields = {
    id,
    name: updateData.name !== undefined ? updateData.name.trim() : existing.name,
    dob: updateData.dob !== undefined ? updateData.dob : existing.dob,
    gender: updateData.gender !== undefined ? updateData.gender : existing.gender,
    qualification: updateData.qualification !== undefined ? updateData.qualification : existing.qualification,
    interests: Array.isArray(updateData.interests) ? updateData.interests.join(',') : (updateData.interests !== undefined ? updateData.interests : existing.interests),
    class: updateData.class !== undefined ? updateData.class : existing.class,
    subject: updateData.subject !== undefined ? updateData.subject : existing.subject,
    marks: updateData.marks !== undefined ? parseFloat(updateData.marks) : existing.marks,
    aadhaar_filename: updateData.aadhaar_filename || existing.aadhaar_filename,
    aadhaar_original_name: updateData.aadhaar_original_name || existing.aadhaar_original_name
  };

  const stmt = db.prepare(`
    UPDATE students
    SET name = @name,
        dob = @dob,
        gender = @gender,
        qualification = @qualification,
        interests = @interests,
        class = @class,
        subject = @subject,
        marks = @marks,
        aadhaar_filename = @aadhaar_filename,
        aadhaar_original_name = @aadhaar_original_name,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `);

  stmt.run(fields);
  return getStudentById(id);
}

function deleteStudent(id) {
  const student = getStudentById(id);
  if (!student) return false;

  const stmt = db.prepare('DELETE FROM students WHERE id = ?');
  stmt.run(id);
  return student;
}

function updatePasswordByEmail(email, newPassword) {
  const student = findStudentByEmail(email);
  if (student) {
    const stmt = db.prepare('UPDATE students SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(newPassword, student.id);
    return { success: true, role: 'student', user: getStudentById(student.id) };
  }

  const admin = findAdminByEmail(email);
  if (admin) {
    const stmt = db.prepare('UPDATE admins SET password = ? WHERE id = ?');
    stmt.run(newPassword, admin.id);
    return { success: true, role: 'admin', user: findAdminByEmail(email) };
  }

  return { success: false, message: 'No account found with this email address.' };
}

module.exports = {
  db,
  findAdminByEmail,
  findStudentByEmail,
  createStudent,
  getAllStudents,
  getStudentById,
  getStudentByStudentId,
  adminUpdateStudent,
  studentUpdateProfile,
  deleteStudent,
  updatePasswordByEmail
};
