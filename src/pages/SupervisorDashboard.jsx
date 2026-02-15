import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

export default function SupervisorDashboard() {
  const [cases, setCases] = useState([]);
  const [ptpAlerts, setPTPAlerts] = useState([]);
  const [fakeVisits, setFakeVisits] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [overloaded, setOverloaded] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cases');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'cases') {
        const response = await axios.get('/cases?limit=50');
        setCases(response.data.data);
      } else if (activeTab === 'ptp') {
        const response = await axios.get('/feedbacks/alerts/ptp?filter=today');
        setPTPAlerts(response.data.data);
      } else if (activeTab === 'audit') {
        const response = await axios.get('/feedbacks/audit/fake-visits');
        setFakeVisits(response.data.data.list);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    setUploadFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!uploadFile) return alert('Select a file to upload');
    const form = new FormData();
    form.append('file', uploadFile);
    try {
      setUploading(true);
      // Let the browser set the Content-Type (including boundary) for multipart/form-data
      const res = await axios.post('/cases/upload', form);
      if (res.data.success) {
        alert(`Uploaded ${res.data.data.created} cases`);
        setOverloaded(res.data.data.overloaded || []);
        fetchData();
      } else {
        alert('Upload failed: ' + (res.data.message || 'unknown'));
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      setUploadFile(null);
    }
  };

  const fetchPerformance = async (employeeId) => {
    try {
      const id = employeeId || selectedEmployee;
      if (!id) return;
      const res = await axios.get(`/cases/performance/${id}`);
      setPerformance(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch performance', err);
      setPerformance([]);
    }
  };

  const handleRejectFakeVisit = async (feedbackId) => {
    if (window.confirm('Are you sure you want to reject this feedback?')) {
      try {
        await axios.delete(`/feedbacks/${feedbackId}`);
        setFakeVisits(fakeVisits.filter((v) => v.id !== feedbackId));
      } catch (error) {
        console.error('Failed to reject feedback:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Supervisor Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor cases, track PTP alerts, and audit field visits</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'cases' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
            }`}
          >
            Cases
          </button>
          <button
            onClick={() => setActiveTab('ptp')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'ptp' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
            }`}
          >
            PTP Alerts ({ptpAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'audit' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
            }`}
          >
            Audit Queue ({fakeVisits.length})
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'performance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
            }`}
          >
            Performance
          </button>
        </div>

        {/* Cases Tab */}
        {activeTab === 'cases' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">All Cases ({cases.length})</h3>
                <p className="text-sm text-gray-500">Upload Excel to bulk add cases (file will be encrypted on server)</p>
              </div>
              <div className="flex items-center gap-3">
                <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} />
                <button onClick={handleUpload} disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded">
                  {uploading ? 'Uploading...' : 'Upload & Distribute'}
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Cases ({cases.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Executive</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Feedbacks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cases.map((caseItem) => (
                    <tr key={caseItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{caseItem.acc_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{caseItem.customer_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">₹{caseItem.pos_amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{caseItem.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{caseItem.executive?.firstName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{caseItem.feedbacks?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Overloaded notification */}
        {overloaded.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <h4 className="font-semibold">Distribution Stopped - High ACR</h4>
              <p className="text-sm text-gray-700">The following employees exceeded the threshold (100 cases):</p>
              <ul className="mt-2 list-disc list-inside">
                {overloaded.map(o => (
                  <li key={o.id}>{o.id} — {o.count} cases</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Performance Tab (quick) */}
        {activeTab === 'performance' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex gap-4 items-center mb-4">
              <input placeholder="Employee ID (emp_id or user id)" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="px-3 py-2 border rounded" />
              <button onClick={() => fetchPerformance()} className="px-4 py-2 bg-blue-600 text-white rounded">Fetch</button>
            </div>
            <div>
              {performance && performance.length ? (
                <pre className="text-sm bg-gray-50 p-3 rounded">{JSON.stringify(performance, null, 2)}</pre>
              ) : (
                <p className="text-sm text-gray-500">No performance data. Provide an employee id and click Fetch.</p>
              )}
            </div>
          </div>
        )}

        {/* PTP Alerts Tab */}
        {activeTab === 'ptp' && (
          <div className="space-y-4">
            {ptpAlerts.length > 0 ? (
              ptpAlerts.map((alert) => (
                <div key={alert.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{alert.case.customer_name}</h4>
                      <p className="text-sm text-gray-600">Account: {alert.case.acc_id}</p>
                      <p className="text-sm text-gray-600">Phone: {alert.case.phone_number}</p>
                      <p className="text-sm text-gray-600">Amount: ₹{alert.case.pos_amount}</p>
                      <p className="text-sm font-medium text-red-600 mt-2">
                        PTP Date: {new Date(alert.ptp_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Executive: {alert.executive?.firstName}</p>
                      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                        Follow Up
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">No PTP alerts for today</div>
            )}
          </div>
        )}

        {/* Audit Queue Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            {fakeVisits.length > 0 ? (
              fakeVisits.map((visit) => (
                <div key={visit.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{visit.case.customer_name}</h4>
                      <p className="text-sm text-gray-600">Account: {visit.case.acc_id}</p>
                      <p className="text-sm text-gray-600">Executive: {visit.executive?.firstName}</p>
                      <p className="text-sm text-red-600 font-medium mt-2">
                        ⚠️ Distance: {visit.distance_from_address ? Math.round(visit.distance_from_address) : 'N/A'}m from known address
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Remarks: {visit.remarks}</p>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleRejectFakeVisit(visit.id)}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Reject
                      </button>
                      <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">No fake visits detected</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

