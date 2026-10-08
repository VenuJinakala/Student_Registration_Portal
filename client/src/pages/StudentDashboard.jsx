import React, { useState, useEffect } from 'react';
import { api, authService, calculateAge } from '../services/api';
import PdfViewerModal from '../components/PdfViewerModal';

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    dob: '',
    gender: 'Male',
    qualification: '',
    interests: [],
    class: '',
    subject: '',
    marks: ''
  });
  const [newAadhaarFile, setNewAadhaarFile] = useState(null);
  const [editFileError, setEditFileError] = useState('');
  const [saving, setSaving] = useState(false);

  const interestOptions = ['Coding', 'Design', 'Gaming', 'Sports'];
  const qualificationOptions = [
    "High School, Bachelor's, Master's",
    'High School',
    "Bachelor's",
    "Master's",
    'Doctorate'
  ];

  const loadStudentData = () => {
    const current = authService.getCurrentUser();
    if (current) {
      setStudent(current);
      // Pre-fill edit form
      const interestsArray = typeof current.interests === 'string'
        ? current.interests.split(',').filter(Boolean)
        : (current.interests || []);

      setEditForm({
        name: current.name || '',
        dob: current.dob || '',
        gender: current.gender || 'Male',
        qualification: current.qualification || "High School, Bachelor's, Master's",
        interests: interestsArray,
        class: current.class || '',
        subject: current.subject || '',
        marks: current.marks !== undefined ? current.marks : ''
      });
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleInterestToggle = (interest) => {
    setEditForm((prev) => {
      const exists = prev.interests.includes(interest);
      const updated = exists
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: updated };
    });
  };

  const handleFileChange = (e) => {
    setEditFileError('');
    const file = e.target.files[0];
    if (!file) {
      setNewAadhaarFile(null);
      return;
    }

    const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = file.type === 'application/pdf' || file.type === 'application/x-pdf';

    if (!isPdfExt || (file.type && !isPdfMime)) {
      setEditFileError('File validation: must be pdf');
      setNewAadhaarFile(null);
      e.target.value = '';
      return;
    }

    setNewAadhaarFile(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setEditFileError('');

    const submission = new FormData();
    // Student can update name, but Email is strictly excluded/locked!
    submission.append('name', editForm.name.trim());
    submission.append('dob', editForm.dob);
    submission.append('gender', editForm.gender);
    submission.append('qualification', editForm.qualification);
    submission.append('interests', editForm.interests.join(','));
    submission.append('class', editForm.class.trim());
    submission.append('subject', editForm.subject.trim());
    submission.append('marks', editForm.marks);

    if (newAadhaarFile) {
      submission.append('aadhaar', newAadhaarFile);
    }

    try {
      setSaving(true);
      const updated = await api.studentUpdateProfile(student.id, submission);

      // Update session and state
      authService.setCurrentUser(updated, 'student');
      setStudent(updated);
      setSuccessMessage('Profile updated successfully!');
      setShowEditModal(false);
      setNewAadhaarFile(null);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!student) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading profile...</p>
      </div>
    );
  }

  const aadhaarLink = student.aadhaar_url || `/uploads/${student.aadhaar_filename || 'sample_aadhaar.pdf'}`;
  const interestsList = typeof student.interests === 'string'
    ? student.interests.split(',').filter(Boolean)
    : (student.interests || []);

  const formattedDob = student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : 'N/A';
  const age = calculateAge(student.dob);

  return (
    <div className="container py-4 my-auto">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9 col-xl-8">
          {successMessage && (
            <div className="alert alert-success alert-dismissible fade show mb-3" role="alert">
              <i className="bi bi-check-circle-fill me-2"></i>
              {successMessage}
              <button
                type="button"
                className="btn-close"
                onClick={() => setSuccessMessage('')}
              ></button>
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {errorMessage}
              <button
                type="button"
                className="btn-close"
                onClick={() => setErrorMessage('')}
              ></button>
            </div>
          )}

          {/* Student Welcome Banner matching Mockup Page 4 */}
          <div className="welcome-banner">
            <h1 className="welcome-title">
              Welcome, {student.name} (User ID: #{student.student_id || `STU${String(student.id).padStart(3, '0')}`})
            </h1>
          </div>

          {/* Student Details Card */}
          <div className="card portal-card mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <span className="fw-semibold text-secondary">Student Submitted Details</span>
              <button
                className="btn btn-primary btn-sm px-3 fw-medium"
                onClick={() => setShowEditModal(true)}
              >
                <i className="bi bi-pencil-square me-1"></i> Edit Profile
              </button>
            </div>

            <div className="card-body p-4">
              <div className="profile-detail-row">
                <span className="profile-detail-label">Email:</span>
                <span className="profile-detail-value d-flex align-items-center">
                  <strong>{student.email}</strong>
                  <span className="locked-badge" title="Email is locked and cannot be edited">
                    <i className="bi bi-lock-fill text-muted"></i> Locked
                  </span>
                </span>
              </div>

              <div className="profile-detail-row">
                <span className="profile-detail-label">Date of Birth:</span>
                <span className="profile-detail-value">
                  {formattedDob} <span className="text-muted">({age} years old)</span>
                </span>
              </div>

              <div className="profile-detail-row">
                <span className="profile-detail-label">Gender:</span>
                <span className="profile-detail-value">{student.gender || 'Not specified'}</span>
              </div>

              <div className="profile-detail-row">
                <span className="profile-detail-label">Qualification:</span>
                <span className="profile-detail-value">{student.qualification || 'N/A'}</span>
              </div>

              <div className="profile-detail-row">
                <span className="profile-detail-label">Interests:</span>
                <span className="profile-detail-value">
                  {interestsList.length > 0 ? (
                    interestsList.map((interest) => (
                      <span key={interest} className="interest-badge">
                        <i className="bi bi-check-circle-fill text-success me-1"></i>
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted">None selected</span>
                  )}
                </span>
              </div>

              <div className="profile-detail-row">
                <span className="profile-detail-label">Class:</span>
                <span className="profile-detail-value fw-medium">{student.class || 'N/A'}</span>
              </div>

              <div className="profile-detail-row">
                <span className="profile-detail-label">Subject:</span>
                <span className="profile-detail-value fw-medium">{student.subject || 'N/A'}</span>
              </div>

              <div className="profile-detail-row">
                <span className="profile-detail-label">Marks:</span>
                <span className="profile-detail-value fw-bold text-primary">
                  {student.marks !== undefined ? student.marks : 'N/A'}
                </span>
              </div>

              <div className="profile-detail-row">
                <span className="profile-detail-label">Aadhaar Document:</span>
                <span className="profile-detail-value d-flex align-items-center gap-2">
                  <button
                    onClick={() => setShowPdfModal(true)}
                    className="pdf-pill btn btn-sm border-0"
                    title="Open Aadhaar PDF Preview"
                  >
                    <i className="bi bi-file-earmark-pdf-fill fs-6"></i>
                    <span>{student.aadhaar_original_name || 'View Aadhaar PDF'}</span>
                  </button>
                  <a
                    href={aadhaarLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-secondary btn-sm"
                    title="Open directly in browser tab"
                  >
                    <i className="bi bi-box-arrow-up-right"></i>
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal (Excluding Email, Allows Replacing Aadhaar Document) */}
      {showEditModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2 text-primary"></i>
                  Edit Student Profile
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Name */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        value={editForm.name}
                        onChange={handleEditChange}
                        required
                      />
                    </div>

                    {/* Email (STRICT RULE: Locked / uneditable) */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold d-flex justify-content-between">
                        <span>Email Address</span>
                        <span className="text-muted small">
                          <i className="bi bi-lock-fill"></i> Uneditable
                        </span>
                      </label>
                      <input
                        type="email"
                        className="form-control bg-light"
                        value={student.email}
                        disabled
                        readOnly
                      />
                    </div>

                    {/* Date of Birth */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        className="form-control"
                        value={editForm.dob}
                        onChange={handleEditChange}
                        required
                      />
                    </div>

                    {/* Gender */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold d-block">Gender</label>
                      <div className="d-flex gap-3 pt-1">
                        {['Male', 'Female', 'Other'].map((g) => (
                          <div className="form-check" key={g}>
                            <input
                              className="form-check-input"
                              type="radio"
                              name="gender"
                              id={`edit_gender_${g}`}
                              value={g}
                              checked={editForm.gender === g}
                              onChange={handleEditChange}
                            />
                            <label className="form-check-label small" htmlFor={`edit_gender_${g}`}>
                              {g}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Qualification */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Qualification</label>
                      <select
                        name="qualification"
                        className="form-select"
                        value={editForm.qualification}
                        onChange={handleEditChange}
                        required
                      >
                        {qualificationOptions.map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Class */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Class</label>
                      <input
                        type="text"
                        name="class"
                        className="form-control"
                        value={editForm.class}
                        onChange={handleEditChange}
                        required
                      />
                    </div>

                    {/* Subject */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        className="form-control"
                        value={editForm.subject}
                        onChange={handleEditChange}
                        required
                      />
                    </div>

                    {/* Marks */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Marks</label>
                      <input
                        type="number"
                        step="any"
                        name="marks"
                        className="form-control"
                        value={editForm.marks}
                        onChange={handleEditChange}
                        required
                      />
                    </div>

                    {/* Interests */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold d-block">Interests</label>
                      <div className="d-flex flex-wrap gap-4 pt-1">
                        {interestOptions.map((interest) => (
                          <div className="form-check" key={interest}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`edit_interest_${interest}`}
                              checked={editForm.interests.includes(interest)}
                              onChange={() => handleInterestToggle(interest)}
                            />
                            <label
                              className="form-check-label small"
                              htmlFor={`edit_interest_${interest}`}
                            >
                              {interest}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Replace Aadhaar Document */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold d-flex justify-content-between">
                        <span>Replace Aadhaar Document (Optional)</span>
                        <span className="text-muted small">Upload PDF only</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className={`form-control ${editFileError ? 'is-invalid' : ''}`}
                        onChange={handleFileChange}
                      />
                      {editFileError && <div className="invalid-feedback">{editFileError}</div>}
                      <div className="form-text text-muted small">
                        Current file:{' '}
                        <strong>{student.aadhaar_original_name || student.aadhaar_filename}</strong>.
                        Uploading a new file will securely replace it on the server with a unique randomized filename.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowEditModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm px-3"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        show={showPdfModal}
        fileUrl={aadhaarLink}
        fileName={student.aadhaar_original_name || student.name + ' Aadhaar'}
        onClose={() => setShowPdfModal(false)}
      />
    </div>
  );
}
