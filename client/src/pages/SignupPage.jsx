import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, authService } from '../services/api';

export default function SignupPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    dob: '',
    gender: 'Male',
    qualification: "High School, Bachelor's, Master's",
    interests: ['Coding'],
    class: '',
    subject: '',
    marks: ''
  });

  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [fileError, setFileError] = useState('');

  const interestOptions = ['Coding', 'Design', 'Gaming', 'Sports'];
  const qualificationOptions = [
    "High School, Bachelor's, Master's",
    'High School',
    "Bachelor's",
    "Master's",
    'Doctorate'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInterestToggle = (interest) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      const updated = exists
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: updated };
    });
  };

  const handleFileChange = (e) => {
    setFileError('');
    setErrorBanner('');
    const file = e.target.files[0];
    if (!file) {
      setAadhaarFile(null);
      return;
    }

    // PDF validation rule: "File validation: must be pdf"
    const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = file.type === 'application/pdf' || file.type === 'application/x-pdf';

    if (!isPdfExt || (file.type && !isPdfMime)) {
      setFileError('File validation: must be pdf');
      setAadhaarFile(null);
      e.target.value = '';
      return;
    }

    setAadhaarFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner('');
    setFileError('');

    // Aadhaar upload validation
    if (!aadhaarFile) {
      setFileError('Please select a valid Aadhaar document (PDF only).');
      return;
    }

    // Build form data
    const submission = new FormData();
    submission.append('name', formData.name.trim());
    submission.append('email', formData.email.trim());
    submission.append('password', formData.password);
    submission.append('dob', formData.dob);
    submission.append('gender', formData.gender);
    submission.append('qualification', formData.qualification);
    submission.append('interests', formData.interests.join(','));
    submission.append('class', formData.class.trim());
    submission.append('subject', formData.subject.trim());
    submission.append('marks', formData.marks);
    submission.append('aadhaar', aadhaarFile);

    try {
      setLoading(true);
      const res = await api.register(submission);

      // Auto login student and navigate to Student Dashboard
      if (res.student) {
        authService.setCurrentUser(res.student, 'student');
        navigate('/student-dashboard', {
          state: { message: 'Registration successful! Welcome to your dashboard.' }
        });
      } else {
        navigate('/login', {
          state: { message: 'Registration successful! Please log in.' }
        });
      }
    } catch (err) {
      // Must show exact error: "This email is already registered."
      setErrorBanner(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4 my-auto">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9 col-xl-8">
          <div className="card portal-card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <h2 className="text-center fw-bold mb-4 text-dark" style={{ fontSize: '1.65rem' }}>
                Student Signup Form
              </h2>

              {/* Exact Error Banner matching Mockup Page 5 */}
              {errorBanner && (
                <div className="mockup-error-banner" role="alert">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>{errorBanner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorBanner('')}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Full Name */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Email Address */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="Email Address (email)"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      placeholder="Password (password)"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      className="form-control"
                      value={formData.dob}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Gender Radio Buttons */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-secondary d-block">
                      Gender
                    </label>
                    <div className="d-flex gap-4 pt-1">
                      {['Male', 'Female', 'Other'].map((g) => (
                        <div className="form-check" key={g}>
                          <input
                            className="form-check-input"
                            type="radio"
                            name="gender"
                            id={`gender_${g}`}
                            value={g}
                            checked={formData.gender === g}
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label small" htmlFor={`gender_${g}`}>
                            {g}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Qualification Dropdown */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Qualification
                    </label>
                    <select
                      name="qualification"
                      className="form-select"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      required
                    >
                      {qualificationOptions.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Interests Checkboxes */}
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary d-block">
                      Interests
                    </label>
                    <div className="d-flex flex-wrap gap-4 pt-1">
                      {interestOptions.map((interest) => (
                        <div className="form-check" key={interest}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`interest_${interest}`}
                            checked={formData.interests.includes(interest)}
                            onChange={() => handleInterestToggle(interest)}
                          />
                          <label
                            className="form-check-label small"
                            htmlFor={`interest_${interest}`}
                          >
                            {interest}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Class */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Class
                    </label>
                    <input
                      type="text"
                      name="class"
                      className="form-control"
                      placeholder="e.g. 10th Grade"
                      value={formData.class}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Subject */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      className="form-control"
                      placeholder="e.g. Computer Science"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Marks */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Marks
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="marks"
                      className="form-control"
                      placeholder="No. to, number"
                      value={formData.marks}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Aadhaar Document Upload (PDF only) */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-secondary d-flex justify-content-between">
                      <span>Aadhaar Document Upload</span>
                      <span className="text-danger" style={{ fontSize: '0.75rem' }}>
                        * Upload PDF only
                      </span>
                    </label>
                    <input
                      type="file"
                      name="aadhaar"
                      accept=".pdf,application/pdf"
                      className={`form-control ${fileError ? 'is-invalid' : ''}`}
                      onChange={handleFileChange}
                      required
                    />
                    {fileError && <div className="invalid-feedback">{fileError}</div>}
                    <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                      Files will be securely stored with unique randomized filenames on the server.
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    ) : null}
                    Register
                  </button>
                </div>

                <div className="text-center text-muted small mt-3">
                  Already registered?{' '}
                  <Link to="/login" className="text-primary text-decoration-none fw-medium">
                    Login here
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
