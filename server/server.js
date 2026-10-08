const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded Aadhaar files statically
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

// Configure Multer for PDF file upload with randomized unique naming
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate secure randomized unique filename: aadhaar_<timestamp>_<randomHex>.pdf
    const randomHex = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const sanitizedExt = path.extname(file.originalname).toLowerCase() || '.pdf';
    const uniqueFileName = `aadhaar_${timestamp}_${randomHex}${sanitizedExt}`;
    cb(null, uniqueFileName);
  }
});

const fileFilter = (req, file, cb) => {
  const isPdfExtension = path.extname(file.originalname).toLowerCase() === '.pdf';
  const isPdfMime = file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf';

  if (isPdfExtension && isPdfMime) {
    cb(null, true);
  } else {
    cb(new Error('File validation error: Only PDF files (.pdf) are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Calculate age helper
function computeAge(dobString) {
  if (!dobString) return 0;
  const today = new Date();
  const birthDate = new Date(dobString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

// Student Signup
app.post('/api/auth/register', (req, res) => {
  upload.single('aadhaar')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const {
        name,
        email,
        password,
        dob,
        gender,
        qualification,
        interests,
        class: studentClass,
        subject,
        marks
      } = req.body;

      // 1. Mandatory input validation
      if (!name || !email || !password || !dob || !gender || !qualification || !studentClass || !subject || marks === undefined) {
        // Clean up uploaded file if validation fails
        if (req.file) {
          try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        return res.status(400).json({ error: 'All fields are required.' });
      }

      // 2. Exact email uniqueness check
      const normalizedEmail = email.trim().toLowerCase();
      const existingStudent = db.findStudentByEmail(normalizedEmail);
      const existingAdmin = db.findAdminByEmail(normalizedEmail);

      if (existingStudent || existingAdmin) {
        if (req.file) {
          try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        // Exact error required by specification: "This email is already registered."
        return res.status(400).json({
          error: 'This email is already registered.'
        });
      }

      // 3. Aadhaar file requirement check
      if (!req.file) {
        return res.status(400).json({ error: 'Aadhaar document upload is required (PDF only).' });
      }

      // 4. Create new student record
      const newStudent = db.createStudent({
        name,
        email: normalizedEmail,
        password,
        dob,
        gender,
        qualification,
        interests: interests || '',
        class: studentClass,
        subject,
        marks,
        aadhaar_filename: req.file.filename,
        aadhaar_original_name: req.file.originalname
      });

      res.status(201).json({
        message: 'Registration successful',
        student: {
          ...newStudent,
          age: computeAge(newStudent.dob)
        }
      });
    } catch (serverErr) {
      console.error('Registration error:', serverErr);
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      res.status(500).json({ error: 'Internal server error during registration.' });
    }
  });
});

// Single Unified Login for both Admins and Students
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check Admin first
  const admin = db.findAdminByEmail(normalizedEmail);
  if (admin && admin.password === password) {
    return res.json({
      role: 'admin',
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      },
      message: 'Admin login successful.'
    });
  }

  // Check Student
  const student = db.findStudentByEmail(normalizedEmail);
  if (student && student.password === password) {
    return res.json({
      role: 'student',
      user: {
        ...student,
        age: computeAge(student.dob),
        role: 'student'
      },
      message: 'Student login successful.'
    });
  }

  // Invalid credentials
  return res.status(401).json({ error: 'Invalid email address or password.' });
});

// Forgot Password Flow
app.post('/api/auth/forgot-password', (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }

  const result = db.updatePasswordByEmail(email.trim().toLowerCase(), newPassword);
  if (!result.success) {
    return res.status(404).json({ error: result.message || 'No account found with this email address.' });
  }

  res.json({ message: 'Password has been successfully reset! You can now log in.' });
});

// -------------------------------------------------------------
// Admin Endpoints
// -------------------------------------------------------------

// Get all students (Admin Dashboard)
app.get('/api/students', (req, res) => {
  try {
    const students = db.getAllStudents();
    const formatted = students.map(s => ({
      ...s,
      age: computeAge(s.dob),
      aadhaar_url: `/uploads/${s.aadhaar_filename}`
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve students.' });
  }
});

// Get single student by ID
app.get('/api/students/:id', (req, res) => {
  try {
    const student = db.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    res.json({
      ...student,
      age: computeAge(student.dob),
      aadhaar_url: `/uploads/${student.aadhaar_filename}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve student.' });
  }
});

// Admin Update student
// RULE: Name and Email must stay locked/uneditable
app.put('/api/students/:id', (req, res) => {
  try {
    const studentId = req.params.id;
    const existing = db.getStudentById(studentId);
    if (!existing) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // Notice we do NOT accept updates to name or email from admin edit
    const updated = db.adminUpdateStudent(studentId, {
      dob: req.body.dob,
      gender: req.body.gender,
      qualification: req.body.qualification,
      interests: req.body.interests,
      class: req.body.class,
      subject: req.body.subject,
      marks: req.body.marks
    });

    res.json({
      message: 'Student updated successfully.',
      student: {
        ...updated,
        age: computeAge(updated.dob),
        aadhaar_url: `/uploads/${updated.aadhaar_filename}`
      }
    });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update student.' });
  }
});

// Admin Delete student
app.delete('/api/students/:id', (req, res) => {
  try {
    const studentId = req.params.id;
    const deleted = db.deleteStudent(studentId);
    if (!deleted) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // Optional: remove file from uploads if not the default sample
    if (deleted.aadhaar_filename && deleted.aadhaar_filename !== 'sample_aadhaar.pdf') {
      const filePath = path.join(uploadsDir, deleted.aadhaar_filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }

    res.json({ message: 'Student record deleted successfully.', deletedId: studentId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete student.' });
  }
});

// -------------------------------------------------------------
// Student Profile Endpoints
// -------------------------------------------------------------

// Student updates their own profile
// RULE: Excluding email (Email must stay locked). Can replace Aadhaar document.
app.put('/api/students/:id/profile', (req, res) => {
  upload.single('aadhaar')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const studentId = req.params.id;
      const existing = db.getStudentById(studentId);
      if (!existing) {
        if (req.file) {
          try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        return res.status(404).json({ error: 'Student not found.' });
      }

      const updateData = {
        name: req.body.name, // student can update their name
        dob: req.body.dob,
        gender: req.body.gender,
        qualification: req.body.qualification,
        interests: req.body.interests,
        class: req.body.class,
        subject: req.body.subject,
        marks: req.body.marks
      };

      if (req.file) {
        updateData.aadhaar_filename = req.file.filename;
        updateData.aadhaar_original_name = req.file.originalname;

        // Delete previous non-sample file
        if (existing.aadhaar_filename && existing.aadhaar_filename !== 'sample_aadhaar.pdf') {
          const oldFile = path.join(uploadsDir, existing.aadhaar_filename);
          if (fs.existsSync(oldFile)) {
            try { fs.unlinkSync(oldFile); } catch (e) {}
          }
        }
      }

      const updated = db.studentUpdateProfile(studentId, updateData);

      res.json({
        message: 'Profile updated successfully.',
        student: {
          ...updated,
          age: computeAge(updated.dob),
          aadhaar_url: `/uploads/${updated.aadhaar_filename}`
        }
      });
    } catch (updateErr) {
      console.error('Profile update error:', updateErr);
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      res.status(500).json({ error: 'Failed to update student profile.' });
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Uploads served at http://localhost:${PORT}/uploads/`);
});
