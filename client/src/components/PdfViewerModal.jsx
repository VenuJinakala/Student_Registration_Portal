import React from 'react';

export default function PdfViewerModal({ show, onClose, fileUrl, fileName }) {
  if (!show || !fileUrl) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content shadow-lg">
          <div className="modal-header bg-light">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <i className="bi bi-file-earmark-pdf-fill text-danger fs-4"></i>
              <span>Aadhaar Document: <strong>{fileName || 'Document'}</strong></span>
            </h5>
            <div className="d-flex gap-2">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
              >
                <i className="bi bi-box-arrow-up-right"></i>
                Open in New Tab
              </a>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
          </div>
          <div className="modal-body p-0" style={{ height: '75vh' }}>
            <iframe
              src={fileUrl}
              title="Aadhaar PDF Viewer"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            >
              <p>Your browser does not support inline PDFs. <a href={fileUrl} target="_blank" rel="noreferrer">Click here to download.</a></p>
            </iframe>
          </div>
          <div className="modal-footer bg-light py-2">
            <span className="text-muted small me-auto">
              Verified PDF Document | Server Upload Security Checked
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
