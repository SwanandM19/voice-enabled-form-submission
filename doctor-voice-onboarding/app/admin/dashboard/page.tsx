'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LogOut, Trash2, RefreshCw, Users } from 'lucide-react';

interface Patient {
  _id: string;
  fullName: string;
  age: number;
  gender: string;
  contactNumber: string;
  email?: string;
  chiefComplaint: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchPatients = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/patients', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.data);
      } else {
        toast.error('Failed to fetch patients');
        if (response.status === 401) {
          router.push('/admin/login');
        }
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patient record?')) return;

    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Patient deleted');
        fetchPatients();
      } else {
        toast.error('Failed to delete patient');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchPatients}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Patient Records ({patients.length})
          </h2>

          {patients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No patient records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Age</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Gender</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Chief Complaint</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900">{patient.fullName}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{patient.age}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{patient.gender}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{patient.contactNumber}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{patient.chiefComplaint}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <button
                          onClick={() => handleDelete(patient._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
