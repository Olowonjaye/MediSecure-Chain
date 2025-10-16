import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { FaNotesMedical, FaUserMd, FaClipboardList } from "react-icons/fa";
import ConsultationForm from "../forms/ConsultationForm";

const ConsultantDashboard = () => {
  const { user, logout } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConsultantCases = async () => {
      try {
        const res = await api.get("/cases/consultant");
        setCases(res.data);
      } catch (err) {
        console.error("Error loading consultant cases:", err);
      } finally {
        setLoading(false);
      }
    };
    loadConsultantCases();
  }, []);

  const handleSelectCase = (c) => {
    setSelectedCase(c);
    setDiagnosis(c.diagnosis || "");
  };

  const handleSaveDiagnosis = async () => {
    if (!selectedCase) return alert("No case selected.");
    try {
      await api.put(`/cases/${selectedCase.id}/diagnosis`, { diagnosis });
      alert("Diagnosis updated successfully.");
      setSelectedCase({ ...selectedCase, diagnosis });
    } catch (err) {
      console.error("Error saving diagnosis:", err);
      alert("Failed to update diagnosis.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading consultant dashboard...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-3">
        <h1 className="text-2xl font-bold text-blue-800 flex items-center gap-2">
          <FaUserMd /> Consultant Dashboard
        </h1>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Welcome Section */}
      <div className="bg-white shadow-md rounded-lg p-5 mb-6">
        <h2 className="text-xl font-semibold text-gray-700">Welcome, {user?.name || "Consultant"}</h2>
        <p className="text-gray-500">You are logged in as <strong>{user?.role}</strong>.</p>
      </div>

      {/* Assigned Cases */}
      <section className="bg-white shadow-md rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <FaClipboardList /> Assigned Cases
          </h3>
        </div>

        {cases.length === 0 ? (
          <p className="text-gray-500">No assigned cases found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-3 border">Patient</th>
                  <th className="py-2 px-3 border">Symptoms</th>
                  <th className="py-2 px-3 border">Date Assigned</th>
                  <th className="py-2 px-3 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 border">{c.patientName}</td>
                    <td className="py-2 px-3 border">{c.symptoms}</td>
                    <td className="py-2 px-3 border">{new Date(c.assignedAt).toLocaleString()}</td>
                    <td className="py-2 px-3 border">
                      <button
                        onClick={() => handleSelectCase(c)}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Diagnosis Editor */}
      {selectedCase && (
        <section className="bg-white shadow-md rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            <FaNotesMedical className="inline-block mr-2" />
            Diagnosis for {selectedCase.patientName}
          </h3>

          <textarea
            className="w-full border rounded-md p-3 text-sm mb-4"
            rows={6}
            placeholder="Write diagnosis notes here..."
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          ></textarea>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setSelectedCase(null)}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDiagnosis}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Save Diagnosis
            </button>
          </div>
        </section>
      )}

      <section className="mt-6 bg-white shadow-md rounded-lg p-5">
        <h3 className="text-lg font-semibold mb-3">Create Consultation Note</h3>
        <ConsultationForm />
      </section>
    </div>
  );
};

export default ConsultantDashboard;
