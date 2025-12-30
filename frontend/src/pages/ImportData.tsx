import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { importsApi } from '../api';
import type { ImportJob } from '../api/types';

export default function ImportData() {
  const [file, setFile] = useState<File | null>(null);
  const [propertyType, setPropertyType] = useState<'MDU' | 'Subdivision'>('MDU');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportJob | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        setError('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      setFile(selectedFile);
      setError('');
      setImportResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.match(/\.(xlsx|xls)$/)) {
        setError('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      setFile(droppedFile);
      setError('');
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError('');
    setImportResult(null);

    try {
      const result = await importsApi.upload(file, propertyType);
      setImportResult(result);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Import failed. Please check your file format.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Import Data</h1>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Excel Import Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Upload Excel files (.xlsx or .xls) containing property data</li>
          <li>Required columns: <strong>Name</strong> and <strong>County</strong></li>
          <li>Recommended columns: City, Address, Units/Lots, Status, Break Ground Date</li>
          <li>The system will automatically map common column names</li>
          <li>Existing properties (same name + county) will be updated</li>
        </ul>
      </div>

      {/* Upload Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-6">
          {/* Property Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Import Type
            </label>
            <div className="flex space-x-4">
              <label className={`flex-1 relative flex cursor-pointer rounded-lg border p-4 ${
                propertyType === 'MDU' ? 'border-gvtc-primary bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="propertyType"
                  value="MDU"
                  checked={propertyType === 'MDU'}
                  onChange={() => setPropertyType('MDU')}
                  className="sr-only"
                />
                <div className="flex flex-1">
                  <div className="flex flex-col">
                    <span className="block text-sm font-medium text-gray-900">MDU (Multifamily)</span>
                    <span className="mt-1 flex items-center text-sm text-gray-500">
                      Apartments, condos, multi-unit buildings
                    </span>
                  </div>
                </div>
                {propertyType === 'MDU' && (
                  <CheckCircleIcon className="h-5 w-5 text-gvtc-primary" />
                )}
              </label>

              <label className={`flex-1 relative flex cursor-pointer rounded-lg border p-4 ${
                propertyType === 'Subdivision' ? 'border-gvtc-primary bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="propertyType"
                  value="Subdivision"
                  checked={propertyType === 'Subdivision'}
                  onChange={() => setPropertyType('Subdivision')}
                  className="sr-only"
                />
                <div className="flex flex-1">
                  <div className="flex flex-col">
                    <span className="block text-sm font-medium text-gray-900">Subdivision</span>
                    <span className="mt-1 flex items-center text-sm text-gray-500">
                      Single-family developments, neighborhoods
                    </span>
                  </div>
                </div>
                {propertyType === 'Subdivision' && (
                  <CheckCircleIcon className="h-5 w-5 text-gvtc-primary" />
                )}
              </label>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Excel File
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center space-x-3">
                  <DocumentArrowUpIcon className="h-8 w-8 text-green-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <>
                  <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Drag and drop your Excel file here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gvtc-primary hover:text-blue-700 font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    .xlsx or .xls files up to 50MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Import Button */}
          <div className="flex justify-end">
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gvtc-primary hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                  Import Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`rounded-lg p-6 ${
          importResult.status === 'Completed' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            {importResult.status === 'Completed' ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
            ) : (
              <ExclamationCircleIcon className="h-6 w-6 text-red-600 mr-3" />
            )}
            <div className="flex-1">
              <h3 className={`text-lg font-medium ${
                importResult.status === 'Completed' ? 'text-green-900' : 'text-red-900'
              }`}>
                Import {importResult.status}
              </h3>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Total Rows</p>
                  <p className="text-lg font-semibold text-gray-900">{importResult.total_rows || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Imported</p>
                  <p className="text-lg font-semibold text-green-600">{importResult.imported_count}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Updated</p>
                  <p className="text-lg font-semibold text-blue-600">{importResult.updated_count}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Errors</p>
                  <p className="text-lg font-semibold text-red-600">{importResult.error_count}</p>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Errors</h4>
                  <div className="bg-white rounded-lg border border-red-200 max-h-48 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Row</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {importResult.errors.map((err, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 text-sm text-gray-900">{err.row || '-'}</td>
                            <td className="px-4 py-2 text-sm text-red-600">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Link
                  to="/properties"
                  className="text-sm text-gvtc-primary hover:text-blue-700 font-medium"
                >
                  View imported properties →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expected Columns */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Expected Excel Columns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">MDU Imports</h4>
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-gray-500">Column</th>
                  <th className="text-left text-gray-500">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { col: 'Name / Property Name', req: true },
                  { col: 'County', req: true },
                  { col: 'City', req: false },
                  { col: 'Address', req: false },
                  { col: 'Units / Unit Count', req: false },
                  { col: 'Buildings', req: false },
                  { col: 'Stories', req: false },
                  { col: 'Status', req: false },
                  { col: 'Break Ground Date', req: false },
                  { col: 'GVTC Distance', req: false },
                ].map(({ col, req }) => (
                  <tr key={col}>
                    <td className="py-1 text-gray-900">{col}</td>
                    <td className="py-1">
                      {req ? (
                        <span className="text-red-600">Required</span>
                      ) : (
                        <span className="text-gray-400">Optional</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Subdivision Imports</h4>
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-gray-500">Column</th>
                  <th className="text-left text-gray-500">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { col: 'Name / Subdivision Name', req: true },
                  { col: 'County', req: true },
                  { col: 'City', req: false },
                  { col: 'Address', req: false },
                  { col: 'Lots / Total Lots', req: false },
                  { col: 'Phases', req: false },
                  { col: 'Current Phase', req: false },
                  { col: 'Status', req: false },
                  { col: 'Break Ground Date', req: false },
                  { col: 'GVTC Distance', req: false },
                ].map(({ col, req }) => (
                  <tr key={col}>
                    <td className="py-1 text-gray-900">{col}</td>
                    <td className="py-1">
                      {req ? (
                        <span className="text-red-600">Required</span>
                      ) : (
                        <span className="text-gray-400">Optional</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
