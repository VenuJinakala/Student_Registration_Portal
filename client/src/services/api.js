// API and LocalStorage Sync Service
// Seamlessly connects to Express/SQLite backend, with automatic LocalStorage fallback as required by specification

const API_BASE = '/api';

// Initial mock data for LocalStorage fallback if server is offline
const INITIAL_STUDENTS_STORAGE = [
  {
    id: 1,
    student_id: 'STU001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    dob: '1994-03-20',
    gender: 'Male',
    qualification: "High School, Bachelors, Master's",
    interests: 'Coding,Design',
    class: '10th Grade',
    subject: 'Computer Science',
    marks: 1200,
    aadhaar_filename: 'sample_aadhaar.pdf',
    aadhaar_original_name: 'john_doe_aadhaar.pdf',
    aadhaar_url: '/uploads/sample_aadhaar.pdf',
    created_at: new Date().toISOString()
  }
];

const INITIAL_ADMINS_STORAGE = [
  {
    id: 1,
    name: 'Super Admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  }
];

// Helper to compute age
export function calculateAge(dobString) {
  if (!dobString) return 0;
  const today = new Date();
  const birthDate = new Date(dobString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return isNaN(age) ? 0 : age;
}

// LocalStorage helpers
function getLocalStudents() {
  const data = localStorage.getItem('mock_students');
  if (!data) {
    localStorage.setItem('mock_students', JSON.stringify(INITIAL_STUDENTS_STORAGE));
    return INITIAL_STUDENTS_STORAGE;
  }
  return JSON.parse(data);
}

function saveLocalStudents(students) {
  localStorage.setItem('mock_students', JSON.stringify(students));
}

function getLocalAdmins() {
  const data = localStorage.getItem('mock_admins');
  if (!data) {
    localStorage.setItem('mock_admins', JSON.stringify(INITIAL_ADMINS_STORAGE));
    return INITIAL_ADMINS_STORAGE;
  }
  return JSON.parse(data);
}

// Session Auth State
export const authService = {
  getCurrentUser() {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  },
  getRole() {
    return localStorage.getItem('auth_role') || null;
  },
  setCurrentUser(user, role) {
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('auth_role', role);
  },
  logout() {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_role');
  }
};

// Main API operations
export const api = {
  // Login
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      return data;
    } catch (err) {
      // If server unreachable, use fallback
      console.warn('Backend server unreachable, falling back to LocalStorage:', err.message);
      const normalizedEmail = email.trim().toLowerCase();

      // Check admin
      const admins = getLocalAdmins();
      const admin = admins.find(a => a.email.toLowerCase() === normalizedEmail && a.password === password);
      if (admin) {
        return {
          role: 'admin',
          user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' },
          message: 'Admin login successful (Fallback Mode)'
        };
      }

      // Check student
      const students = getLocalStudents();
      const student = students.find(s => s.email.toLowerCase() === normalizedEmail && s.password === password);
      if (student) {
        return {
          role: 'student',
          user: { ...student, age: calculateAge(student.dob), role: 'student' },
          message: 'Student login successful (Fallback Mode)'
        };
      }

      throw new Error(err.message === 'Failed to fetch' ? 'Invalid email address or password.' : err.message);
    }
  },

  // Student Register
  async register(formData) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      return data;
    } catch (err) {
      // LocalStorage fallback
      console.warn('Backend server unreachable for register, using LocalStorage fallback:', err.message);
      if (err.message !== 'Failed to fetch') {
        throw err;
      }

      const email = formData.get('email')?.trim().toLowerCase();
      const students = getLocalStudents();
      const admins = getLocalAdmins();

      // Exact error check required: "This email is already registered."
      if (students.some(s => s.email.toLowerCase() === email) || admins.some(a => a.email.toLowerCase() === email)) {
        throw new Error('This email is already registered.');
      }

      const file = formData.get('aadhaar');
      if (!file || !(file instanceof File)) {
        throw new Error('Aadhaar document upload is required (PDF only).');
      }

      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        throw new Error('File validation error: must be pdf');
      }

      const nextIdNum = students.length + 1;
      const studentId = `STU${String(nextIdNum).padStart(3, '0')}`;
      const uniqueFileName = `aadhaar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;

      const newStudent = {
        id: nextIdNum,
        student_id: studentId,
        name: formData.get('name'),
        email: email,
        password: formData.get('password'),
        dob: formData.get('dob'),
        gender: formData.get('gender'),
        qualification: formData.get('qualification'),
        interests: formData.get('interests') || '',
        class: formData.get('class'),
        subject: formData.get('subject'),
        marks: parseFloat(formData.get('marks')) || 0,
        aadhaar_filename: uniqueFileName,
        aadhaar_original_name: file.name,
        aadhaar_url: URL.createObjectURL(file), // Previewable in client session
        age: calculateAge(formData.get('dob'))
      };

      students.push(newStudent);
      saveLocalStudents(students);

      return {
        message: 'Registration successful',
        student: newStudent
      };
    }
  },

  // Forgot Password
  async forgotPassword(email, newPassword) {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed');
      }
      return data;
    } catch (err) {
      if (err.message !== 'Failed to fetch') throw err;

      const normalized = email.trim().toLowerCase();
      const students = getLocalStudents();
      const idx = students.findIndex(s => s.email.toLowerCase() === normalized);
      if (idx !== -1) {
        students[idx].password = newPassword;
        saveLocalStudents(students);
        return { message: 'Password has been successfully reset! You can now log in.' };
      }

      const admins = getLocalAdmins();
      const aIdx = admins.findIndex(a => a.email.toLowerCase() === normalized);
      if (aIdx !== -1) {
        admins[aIdx].password = newPassword;
        saveLocalStudents(admins);
        return { message: 'Password has been successfully reset! You can now log in.' };
      }

      throw new Error('No account found with this email address.');
    }
  },

  // Admin: Get all students
  async getStudents() {
    try {
      const res = await fetch(`${API_BASE}/students`);
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      return data.map(s => ({
        ...s,
        age: calculateAge(s.dob)
      }));
    } catch (err) {
      console.warn('Backend server unreachable, loading students from LocalStorage:', err.message);
      const students = getLocalStudents();
      return students.map(s => ({
        ...s,
        age: calculateAge(s.dob)
      }));
    }
  },

  // Admin: Update student details
  // RULE: Name and Email must stay locked/uneditable!
  async adminUpdateStudent(id, studentData) {
    try {
      const res = await fetch(`${API_BASE}/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update student');
      return data.student;
    } catch (err) {
      if (err.message !== 'Failed to fetch') throw err;

      const students = getLocalStudents();
      const idx = students.findIndex(s => s.id === parseInt(id));
      if (idx === -1) throw new Error('Student not found');

      // Preserve Name and Email strictly!
      students[idx] = {
        ...students[idx],
        dob: studentData.dob !== undefined ? studentData.dob : students[idx].dob,
        gender: studentData.gender !== undefined ? studentData.gender : students[idx].gender,
        qualification: studentData.qualification !== undefined ? studentData.qualification : students[idx].qualification,
        interests: studentData.interests !== undefined ? studentData.interests : students[idx].interests,
        class: studentData.class !== undefined ? studentData.class : students[idx].class,
        subject: studentData.subject !== undefined ? studentData.subject : students[idx].subject,
        marks: studentData.marks !== undefined ? parseFloat(studentData.marks) : students[idx].marks,
        age: calculateAge(studentData.dob || students[idx].dob)
      };

      saveLocalStudents(students);
      return students[idx];
    }
  },

  // Admin: Delete student
  async deleteStudent(id) {
    try {
      const res = await fetch(`${API_BASE}/students/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete student');
      return true;
    } catch (err) {
      if (err.message !== 'Failed to fetch') throw err;

      const students = getLocalStudents();
      const filtered = students.filter(s => s.id !== parseInt(id));
      saveLocalStudents(filtered);
      return true;
    }
  },

  // Student: Update profile
  // RULE: Excluding email. Can replace Aadhaar document.
  async studentUpdateProfile(id, formData) {
    try {
      const res = await fetch(`${API_BASE}/students/${id}/profile`, {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      return data.student;
    } catch (err) {
      if (err.message !== 'Failed to fetch') throw err;

      const students = getLocalStudents();
      const idx = students.findIndex(s => s.id === parseInt(id));
      if (idx === -1) throw new Error('Student not found');

      const file = formData.get('aadhaar');
      let aadhaarUrl = students[idx].aadhaar_url;
      let aadhaarName = students[idx].aadhaar_filename;
      let aadhaarOrig = students[idx].aadhaar_original_name;

      if (file && file instanceof File && file.size > 0) {
        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
          throw new Error('File validation error: must be pdf');
        }
        aadhaarName = `aadhaar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;
        aadhaarOrig = file.name;
        aadhaarUrl = URL.createObjectURL(file);
      }

      students[idx] = {
        ...students[idx],
        name: formData.get('name') || students[idx].name,
        dob: formData.get('dob') || students[idx].dob,
        gender: formData.get('gender') || students[idx].gender,
        qualification: formData.get('qualification') || students[idx].qualification,
        interests: formData.get('interests') !== null ? formData.get('interests') : students[idx].interests,
        class: formData.get('class') || students[idx].class,
        subject: formData.get('subject') || students[idx].subject,
        marks: formData.get('marks') ? parseFloat(formData.get('marks')) : students[idx].marks,
        aadhaar_filename: aadhaarName,
        aadhaar_original_name: aadhaarOrig,
        aadhaar_url: aadhaarUrl,
        age: calculateAge(formData.get('dob') || students[idx].dob)
      };

      saveLocalStudents(students);
      return students[idx];
    }
  }
};
