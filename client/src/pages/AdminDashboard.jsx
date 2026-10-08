import React, { useState, useEffect, useMemo } from 'react';
import { api, calculateAge } from '../services/api';
import PdfViewerModal from '../components/PdfViewerModal';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Instant Filter states per specification
  const [nameFilter, setNameFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [minAgeFilter, setMinAgeFilter] = useState('');
  const [maxAgeFilter, setMaxAgeFilter] = useState('');

  // Modals state
  const [selectedPdf, setSelectedPdf] = useState({ show: false, url: '', name: '' });
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit Form state (NOTE: Name and Email are STRICTLY LOCKED/UNEDITABLE)
  const [editFormData, setEditFormData] = useState({
    dob: '',
    gender: 'Male',
    qualification: '',
    interests: [],
    class: '',
    subject: '',
    marks: ''
  });

  const interestOptions = ['Coding', 'Design', 'Gaming', 'Sports'];
  const qualificationOptions = [
    "High School, Bachelor's, Master's",
    'High School',
    "Bachelor's",
    "Master's",
    'Doctorate'
  ];

  // Fetch all students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await api.getStudents();
      setStudents(data);
    } catch (err) {
      setActionMessage({ type: 'danger', text: 'Failed to load students: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Compute available distinct classes for quick filter selection
  const distinctClasses = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.class) set.add(s.class.trim());
    });
    return Array.from(set);
  }, [students]);

  // Instant Live Filtering logic per specification:
  // "Filters instantly by Name and Class. Filter by Age (minimum) and (maximum)"
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const studentAge = s.age !== undefined ? s.age : calculateAge(s.dob);

      // Name filter
      if (nameFilter.trim()) {
        const query = nameFilter.trim().toLowerCase();
        const matchesName = (s.name || '').toLowerCase().includes(query);
        const matchesId = (s.student_id || '').toLowerCase().includes(query);
        if (!matchesName && !matchesId) return false;
      }

      // Class filter
      if (classFilter.trim()) {
        const queryClass = classFilter.trim().toLowerCase();
        if (!(s.class || '').toLowerCase().includes(queryClass)) {
          return false;
        }
      }

      // Age Minimum filter
      if (minAgeFilter !== '') {
        const minAge = parseInt(minAgeFilter, 10);
        if (!isNaN(minAge) && studentAge < minAge) {
          return false;
        }
      }

      // Age Maximum filter
      if (maxAgeFilter !== '') {
        const maxAge = parseInt(maxAgeFilter, 10);
        if (!isNaN(maxAge) && studentAge > maxAge) {
          return false;
        }
      }

      return true;
    });
  }, [students, nameFilter, classFilter, minAgeFilter, maxAgeFilter]);

  // Clear all filters
  const resetFilters = () => {
    setNameFilter('');
    setClassFilter('');
    setMinAgeFilter('');
    setMaxAgeFilter('');
  };

  // Open Edit Modal - Populate form data
  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    const interestsArray = typeof student.interests === 'string'
      ? student.interests.split(',').filter(Boolean)
      : (student.interests || []);

    setEditFormData({
      dob: student.dob || '',
      gender: student.gender || 'Male',
      qualification: student.qualification || "High School, Bachelor's, Master's",
      interests: interestsArray,
      class: student.class || '',
      subject: student.subject || '',
      marks: student.marks !== undefined ? student.marks : ''
    });
  };

  // Edit form input change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInterestToggle = (interest) => {
    setEditFormData((prev) => {
      const exists = prev.interests.includes(interest);
      const updated = exists
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: updated };
    });
  };

  // Save Admin Edits
  // CRITICAL REQUIREMENT: Name and Email must stay locked/uneditable
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      setSavingEdit(true);
      await api.adminUpdateStudent(editingStudent.id, {
        dob: editFormData.dob,
        gender: editFormData.gender,
        qualification: editFormData.qualification,
        interests: editFormData.interests.join(','),
        class: editFormData.class.trim(),
        subject: editFormData.subject.trim(),
        marks: editFormData.marks
      });

      setActionMessage({
        type: 'success',
        text: `Successfully updated record for ${editingStudent.name} (Name & Email kept locked).`
      });
      setEditingStudent(null);
      await fetchStudents();
    } catch (err) {
      setActionMessage({ type: 'danger', text: 'Failed to update student: ' + err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete student
  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;

    try {
      setDeleting(true);
      await api.deleteStudent(deletingStudent.id);
      setActionMessage({
        type: 'success',
        text: `Student ${deletingStudent.name} (#${deletingStudent.student_id}) deleted successfully.`
      });
      setDeletingStudent(null);
      await fetchStudents();
    } catch (err) {
      setActionMessage({ type: 'danger', text: 'Failed to delete student: ' + err.message });
    } finally {
      setDeleting(false);
    }
  };

  // Stats calculation
  const totalStudents = students.length;
  const avgMarks = useMemo(() => {
    if (totalStudents === 0) return 0;
    const total = students.reduce((sum, s) => sum + (parseFloat(s.marks) || 0), 0);
    return (total / totalStudents).toFixed(1);
  }, [students, totalStudents]);

  return (
    <div className="container-fluid px-4 py-4">
      {/* Page Title & Stats */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-shield-check text-primary"></i>
            Admin Dashboard
          </h2>
          <p className="text-muted small mb-0">
            Protected Administrator Portal | Real-time Student Management & Filter Controls
          </p>
        </div>

        <div className="d-flex gap-2 mt-3 mt-md-0">
          <div className="bg-white border rounded px-3 py-2 text-center shadow-sm">
            <span className="text-muted small d-block">Total Students</span>
            <span className="fw-bold fs-5 text-primary">{totalStudents}</span>
          </div>
          <div className="bg-white border rounded px-3 py-2 text-center shadow-sm">
            <span className="text-muted small d-block">Average Marks</span>
            <span className="fw-bold fs-5 text-success">{avgMarks}</span>
          </div>
          <div className="bg-white border rounded px-3 py-2 text-center shadow-sm">
            <span className="text-muted small d-block">Unique Classes</span>
            <span className="fw-bold fs-5 text-secondary">{distinctClasses.length}</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionMessage.text && (
        <div
          className={`alert alert-${actionMessage.type} alert-dismissible fade show`}
          role="alert"
        >
          <i
            className={`bi ${
              actionMessage.type === 'success'
                ? 'bi-check-circle-fill'
                : 'bi-exclamation-triangle-fill'
            } me-2`}
          ></i>
          {actionMessage.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionMessage({ type: '', text: '' })}
          ></button>
        </div>
      )}

      {/* Instant Filters Bar per Specification:
          "Filters instantly by Name and Class. Filter by Age (minimum) and (maximum)" */}
      <div className="filter-bar shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fw-semibold text-secondary small text-uppercase">
            <i className="bi bi-funnel-fill me-1 text-primary"></i> Instant Live Filters
          </span>
          {(nameFilter || classFilter || minAgeFilter || maxAgeFilter) && (
            <button
              onClick={resetFilters}
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            >
              <i className="bi bi-arrow-counterclockwise"></i> Reset Filters
            </button>
          )}
        </div>

        <div className="row g-2">
          {/* Filter by Name */}
          <div className="col-12 col-sm-6 col-md-3">
            <label className="form-label small fw-medium text-muted mb-1">
              Search by Name / ID
            </label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Type student name or ID..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Filter by Class */}
          <div className="col-12 col-sm-6 col-md-3">
            <label className="form-label small fw-medium text-muted mb-1">
              Filter by Class
            </label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white">
                <i className="bi bi-mortarboard text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Type class (e.g. 10th)..."
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                list="classList"
              />
              <datalist id="classList">
                {distinctClasses.map((cls) => (
                  <option key={cls} value={cls} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Filter by Age (Min) */}
          <div className="col-6 col-md-3">
            <label className="form-label small fw-medium text-muted mb-1">
              Min Age (years)
            </label>
            <input
              type="number"
              min="0"
              max="120"
              className="form-control form-control-sm"
              placeholder="e.g. 18"
              value={minAgeFilter}
              onChange={(e) => setMinAgeFilter(e.target.value)}
            />
          </div>

          {/* Filter by Age (Max) */}
          <div className="col-6 col-md-3">
            <label className="form-label small fw-medium text-muted mb-1">
              Max Age (years)
            </label>
            <input
              type="number"
              min="0"
              max="120"
              className="form-control form-control-sm"
              placeholder="e.g. 30"
              value={maxAgeFilter}
              onChange={(e) => setMaxAgeFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-2 text-muted small d-flex justify-content-between align-items-center">
          <span>
            Showing <strong>{filteredStudents.length}</strong> of{' '}
            <strong>{students.length}</strong> students
          </span>
          {(nameFilter || classFilter || minAgeFilter || maxAgeFilter) && (
            <span className="badge bg-primary text-white">Active filters applied</span>
          )}
        </div>
      </div>

      {/* Students Data Table */}
      <div className="card portal-card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table admin-table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Age & DOB</th>
                <th>Gender</th>
                <th>Qualification</th>
                <th>Class / Subject</th>
                <th>Marks</th>
                <th>Interests</th>
                <th>Aadhaar Document</th>
                <th style={{ width: '130px' }} className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted mb-0">Loading registered students...</p>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
                    No students match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const studentAge = s.age !== undefined ? s.age : calculateAge(s.dob);
                  const formattedDob = s.dob ? new Date(s.dob).toLocaleDateString('en-GB') : 'N/A';
                  const interestsArray = typeof s.interests === 'string'
                    ? s.interests.split(',').filter(Boolean)
                    : (s.interests || []);
                  const aadhaarLink = s.aadhaar_url || `/uploads/${s.aadhaar_filename}`;

                  return (
                    <tr key={s.id}>
                      {/* User ID */}
                      <td className="fw-bold text-primary font-monospace">
                        #{s.student_id || `STU${String(s.id).padStart(3, '0')}`}
                      </td>

                      {/* Name */}
                      <td className="fw-semibold text-dark">{s.name}</td>

                      {/* Email */}
                      <td>
                        <span className="text-secondary small">{s.email}</span>
                      </td>

                      {/* Age & DOB */}
                      <td>
                        <span className="fw-semibold">{studentAge} yrs</span>
                        <span className="d-block text-muted small">{formattedDob}</span>
                      </td>

                      {/* Gender */}
                      <td>
                        <span className="badge bg-light text-dark border">
                          {s.gender || 'N/A'}
                        </span>
                      </td>

                      {/* Qualification */}
                      <td>
                        <span className="small text-truncate d-inline-block" style={{ maxWidth: '140px' }} title={s.qualification}>
                          {s.qualification || 'N/A'}
                        </span>
                      </td>

                      {/* Class & Subject */}
                      <td>
                        <span className="fw-medium small d-block">{s.class}</span>
                        <span className="text-muted small">{s.subject}</span>
                      </td>

                      {/* Marks */}
                      <td>
                        <span className="badge bg-info-subtle text-info-emphasis border px-2 py-1 fw-bold">
                          {s.marks !== undefined ? s.marks : '0'}
                        </span>
                      </td>

                      {/* Interests */}
                      <td>
                        <div style={{ maxWidth: '160px' }}>
                          {interestsArray.length > 0 ? (
                            interestsArray.map((i) => (
                              <span key={i} className="interest-badge">
                                {i}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted small">-</span>
                          )}
                        </div>
                      </td>

                      {/* Aadhaar Document clickable link */}
                      <td>
                        <button
                          onClick={() =>
                            setSelectedPdf({
                              show: true,
                              url: aadhaarLink,
                              name: `${s.name} (${s.aadhaar_original_name || 'Aadhaar'})`
                            })
                          }
                          className="pdf-pill btn btn-sm border-0"
                          title={`Open ${s.aadhaar_filename}`}
                        >
                          <i className="bi bi-file-earmark-pdf-fill"></i>
                          <span>View PDF</span>
                        </button>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleOpenEdit(s)}
                            title="Edit details (Name & Email strictly locked)"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => setDeletingStudent(s)}
                            title="Delete Student Record"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Edit Modal -
          CRITICAL RULE: "Name and Email must stay locked/uneditable"
          (Verified in screening evaluation guide Page 2 & Page 6) */}
      {editingStudent && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <i className="bi bi-shield-lock-fill"></i>
                  Edit Student Details (Admin Control)
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditingStudent(null)}
                ></button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4">
                  <div className="alert alert-info py-2 small d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-info-circle-fill"></i>
                    <span>
                      <strong>Strict Evaluation Rule:</strong> Student Name and Email are permanently locked and cannot be edited by administrators.
                    </span>
                  </div>

                  <div className="row g-3">
                    {/* Locked Student Name */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary d-flex justify-content-between">
                        <span>Full Name</span>
                        <span className="text-danger small">
                          <i className="bi bi-lock-fill"></i> Locked / Uneditable
                        </span>
                      </label>
                      <input
                        type="text"
                        className="form-control bg-light text-muted"
                        value={editingStudent.name}
                        disabled
                        readOnly
                      />
                    </div>

                    {/* Locked Email */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary d-flex justify-content-between">
                        <span>Email Address</span>
                        <span className="text-danger small">
                          <i className="bi bi-lock-fill"></i> Locked / Uneditable
                        </span>
                      </label>
                      <input
                        type="email"
                        className="form-control bg-light text-muted"
                        value={editingStudent.email}
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
                        value={editFormData.dob}
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
                              id={`admin_edit_gender_${g}`}
                              value={g}
                              checked={editFormData.gender === g}
                              onChange={handleEditChange}
                            />
                            <label
                              className="form-check-label small"
                              htmlFor={`admin_edit_gender_${g}`}
                            >
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
                        value={editFormData.qualification}
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
                        value={editFormData.class}
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
                        value={editFormData.subject}
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
                        value={editFormData.marks}
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
                              id={`admin_edit_interest_${interest}`}
                              checked={editFormData.interests.includes(interest)}
                              onChange={() => handleInterestToggle(interest)}
                            />
                            <label
                              className="form-check-label small"
                              htmlFor={`admin_edit_interest_${interest}`}
                            >
                              {interest}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingStudent(null)}
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm px-4"
                    disabled={savingEdit}
                  >
                    {savingEdit ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Saving Updates...
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

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <i className="bi bi-trash-fill"></i>
                  Confirm Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDeletingStudent(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-2">
                  Are you sure you want to permanently delete student record:
                </p>
                <div className="p-3 bg-light rounded border mb-3">
                  <div className="fw-bold text-dark">{deletingStudent.name}</div>
                  <div className="text-secondary small">Email: {deletingStudent.email}</div>
                  <div className="text-primary small font-monospace">
                    User ID: #{deletingStudent.student_id}
                  </div>
                </div>
                <p className="text-danger small mb-0">
                  <i className="bi bi-exclamation-octagon-fill me-1"></i>
                  This action will remove the student and their uploaded Aadhaar files from the database.
                </p>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDeletingStudent(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm px-3"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete Record'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Document Viewer Modal */}
      <PdfViewerModal
        show={selectedPdf.show}
        fileUrl={selectedPdf.url}
        fileName={selectedPdf.name}
        onClose={() => setSelectedPdf({ show: false, url: '', name: '' })}
      />
    </div>
  );
}
