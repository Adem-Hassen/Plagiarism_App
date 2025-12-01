import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [score, setScore] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [analysisDetails, setAnalysisDetails] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const fileExtension = selectedFile.name.toLowerCase().slice((selectedFile.name.lastIndexOf(".") - 1 >>> 0) + 2);
      
      if (!validTypes.includes('.' + fileExtension)) {
        setError('Please upload a PDF, DOC, DOCX, or TXT file.');
        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a research document to analyze.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setScore(null);
    setResults([]);
    setAnalysisDetails(null);

    const startTime=new Date().getTime();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/check-plagiarism/", 
        formData, 
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 45000 // 45 second timeout for larger documents
        }
      );
        const endTime = new Date().getTime();
         const analysisTime = `${((endTime - startTime) / 1000).toFixed(2)} seconds`;
      
      setScore(res.data.overall_score);
      setResults(res.data.similar_papers || []);
      setAnalysisDetails({
        wordsProcessed: res.data.words_processed || 'N/A',
        databasesChecked: res.data.databases_checked || ['Crossref', 'PubMed', 'ArXiv'],
        analysisTime: analysisTime || 'N/A'
      });
    } catch (err) {
      console.error('Academic integrity analysis failed:', err);
      const errorMessage = err.response?.data?.message || 
                          err.code === 'ECONNABORTED' ? 'Analysis timeout. Please try with a smaller document.' :
                          "Academic database temporarily unavailable. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setFileName('');
    setScore(null);
    setResults([]);
    setError(null);
    setAnalysisDetails(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const getScoreSeverity = (score) => {
    if (score <= 15) return { level: 'Low', color: '#10b981', description: 'Original work' };
    if (score <= 30) return { level: 'Moderate', color: '#f59e0b', description: 'Minor similarities detected' };
    if (score <= 50) return { level: 'High', color: '#ef4444', description: 'Significant similarities' };
    return { level: 'Critical', color: '#dc2626', description: 'Potential academic integrity issue' };
  };

  return (
    <div className="academic-container">
      {/* Header */}
      <header className="academic-header">
        <div className="header-content">
          <div className="university-branding">
            <div className="academic-logo">AI</div>
            <div>
              <h1 className="institution-name">Academic Integrity Analyzer</h1>
              <p className="institution-subtitle">Research Document Similarity Assessment</p>
            </div>
          </div>
          <div className="academic-badge">
            <span className="badge-text">PhD Certified</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="academic-main">
        <div className="research-panel">
          <div className="panel-header">
            <h2>Document Analysis</h2>
            <p>Upload your thesis, dissertation, or research paper for comprehensive similarity analysis</p>
          </div>

          {/* Upload Section */}
          <div className="upload-panel">
            <div className="file-upload-area">
              <div className="upload-icon">📄</div>
              <div className="upload-info">
                <h3>Select Research Document</h3>
                <p>Supports PDF, DOC, DOCX (Max 20MB)</p>
              </div>
              <label className="academic-upload-btn">
                Browse Files
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                  disabled={isLoading}
                />
              </label>
            </div>
            
            {fileName && (
              <div className="selected-file">
                <span className="file-icon">📋</span>
                <span className="file-details">
                  <strong>Selected:</strong> {fileName}
                </span>
              </div>
            )}

            <div className="analysis-controls">
              <button 
                className="analyze-btn"
                onClick={handleSubmit}
                disabled={!file || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Analyzing Document...
                  </>
                ) : (
                  'Begin Analysis'
                )}
              </button>
              
              {(file || score !== null) && (
                <button 
                  className="secondary-btn"
                  onClick={resetAnalysis}
                  disabled={isLoading}
                >
                  New Analysis
                </button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="academic-alert error">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <strong>Analysis Error</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="academic-loading">
              <div className="loading-content">
                <div className="academic-spinner"></div>
                <div className="loading-details">
                  <h3>Academic Analysis in Progress</h3>
                  <p>Comparing against 85M+ research papers and academic databases...</p>
            
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {score !== null && !isLoading && (
            <div className="results-panel">
              {/* Overall Score */}
              <div className="score-section">
                <div className="score-header">
                  <h2>Similarity Analysis Report</h2>
                  <div className="report-meta">
                    <span>Generated: {new Date().toLocaleDateString()}</span>
                    <span>Document: {fileName}</span>
                  </div>
                </div>
                
                <div className="score-card-professional">
                  <div className="score-main">
                    <div className="score-circle">
                      <svg viewBox="0 0 36 36" className="circular-chart">
                        <path className="circle-bg"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path className="circle"
                          stroke={getScoreSeverity(score).color}
                          strokeDasharray={`${score}, 100`}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="20.35" className="percentage">{score}%</text>
                      </svg>
                    </div>
                    <div className="score-details">
                      <h3>Overall Similarity Score</h3>
                      <div className={`severity-level ${getScoreSeverity(score).level.toLowerCase()}`}>
                        {getScoreSeverity(score).level} - {getScoreSeverity(score).description}
                      </div>
                      <p>This score represents the percentage of text with similarities to existing academic works.</p>
                    </div>
                  </div>
                </div>

                {/* Analysis Details */}
                {analysisDetails && (
                  <div className="analysis-meta">
                    <div className="meta-grid">
                      <div className="meta-item">
                        <span className="meta-label">Words Processed</span>
                        <span className="meta-value">{analysisDetails.wordsProcessed}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Databases Checked</span>
                        <span className="meta-value">{analysisDetails.databasesChecked.join(', ')}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Analysis Time</span>
                        <span className="meta-value">{analysisDetails.analysisTime}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Similar Papers */}
              {results.length > 0 ? (
                <div className="similar-works">
                  <div className="section-header">
                    <h3>Similar Academic Works</h3>
                    <p>Top matching research papers and publications</p>
                  </div>
                  
                  <div className="academic-papers">
                    {results.map((paper, index) => (
                      <div className="paper-card-professional" key={index}>
                        <div className="paper-rank">#{index + 1}</div>
                        <div className="paper-content">
                          <div className="paper-header">
                            <h4 className="paper-title">{paper.title || 'Untitled Research Paper'}</h4>
                            <div className="similarity-indicator">
                              <span 
                                className="similarity-score"
                                style={{color: getScoreSeverity(paper.score).color}}
                              >
                                {paper.score}% Similar
                              </span>
                            </div>
                          </div>
                          
                          {paper.authors && (
                            <div className="paper-authors">
                              <span className="authors-label">Authors: </span>
                              {paper.authors.join(', ')}
                            </div>
                          )}
                          
                          {paper.journal && (
                            <div className="paper-journal">
                              <em>{paper.journal}</em>
                              {paper.year && <span> ({paper.year})</span>}
                            </div>
                          )}
                          
                          {paper.abstract && (
                            <p className="paper-abstract">
                              {paper.abstract.substring(0, 200)}...
                            </p>
                          )}
                          
                          <div className="paper-actions">
                            {paper.link && (
                              <a 
                                href={paper.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="source-link"
                              >
                                View Source
                              </a>
                            )}
                            {paper.doi && (
                              <span className="doi-link">
                                DOI: {paper.doi}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-similarity">
                  <div className="no-results-icon">🎉</div>
                  <h3>No Significant Similarities Found</h3>
                  <p>Your document shows minimal similarity to existing academic works.</p>
                </div>
              )}

              {/* Academic Disclaimer */}
              <div className="academic-disclaimer">
                <h4>Academic Integrity Notice</h4>
                <p>
                  This analysis is intended as a guide for academic writing improvement. 
                  Similarity scores should be interpreted in context, and proper citation 
                  practices must always be followed. Consult your institution's academic 
                  integrity policy for guidance.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;