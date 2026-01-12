import { RefreshCcw, Upload } from 'lucide-react';

const FileUpload = ({ rawData, isLoading, error, fileInputRef, handleFileUpload, resetUpload }) => {
  return (
    <div className="file-upload-section">
      <input
        type="file"
        hidden
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx,.xls"
        aria-label="Upload timetable file"
      />
      {rawData.length === 0 ? (
        <div className="upload-area">
          <div className="upload-content" onClick={() => fileInputRef.current?.click()}>
            <Upload size={48} className="upload-icon" />
            {isLoading ? (
              <h3>Processing file...</h3>
            ) : (
              <>
                <h3>Upload Your Timetable</h3>
                <p>Click or drag & drop Excel file here</p>
                <p className="upload-hint">Supports .xlsx and .xls files up to 10MB</p>
              </>
            )}
          </div>
          {error && <div className="error-text">{error}</div>}
        </div>
      ) : (
        <div className="file-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} /> Change File
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetUpload}
          >
            <RefreshCcw size={16} /> Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
