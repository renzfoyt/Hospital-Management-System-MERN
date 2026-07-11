import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { adminFetch, clearAdminToken } from "../../config/adminAuth";

const TABS = [
  { key: "bookings", label: "Bookings" },
  { key: "contacts", label: "Contacts" },
  { key: "doctors", label: "Doctors" },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("bookings");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const emptyDoctorForm = {
    firstName: "",
    lastName: "",
    specialty: "",
    department: "",
    subSpecialty: "",
    credentials: "",
    email: "",
    contactNumber: "",
    gender: "",
    clinicDays: "",
    clinicHourIn: "",
    clinicHourOut: "",
    hmoAccepted: "",
    bio: "",
    status: "active",
  };
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);

  const endpointFor = (tab) => `/${tab === "bookings" ? "admin/bookings" : tab === "contacts" ? "admin/contacts" : "admin/doctors"}`;

  const load = useCallback(async (tab) => {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch(endpointFor(tab));
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.message === "SESSION_EXPIRED") {
        navigate("/admin/login", { replace: true });
        return;
      }
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load(activeTab);
  }, [activeTab, load]);

  const handleLogout = async () => {
    try {
      // Best-effort: revoke the token server-side so it can't be reused
      // even if someone got hold of it before it naturally expires.
      await adminFetch("/auth/logout", { method: "POST" });
    } catch (err) {
      // Token may already be expired/invalid — that's fine, we're
      // logging out either way. No need to surface this to the user.
    } finally {
      clearAdminToken();
      navigate("/admin/login", { replace: true });
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const nextStatus = currentStatus === "pending" ? "handled" : "pending";
    try {
      await adminFetch(`${endpointFor(activeTab)}/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success("Status updated");
      load(activeTab);
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    }
  };

  const handleDoctorStatusToggle = async (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await adminFetch(`/admin/doctors/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success("Doctor status updated");
      load(activeTab);
    } catch (err) {
      toast.error(err.message || "Failed to update doctor.");
    }
  };

  const handleDoctorFormChange = (e) => {
    const { name, value } = e.target;
    setDoctorForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddDoctorForm = () => {
    setDoctorForm(emptyDoctorForm);
    setEditingDoctorId(null);
    setShowDoctorForm(true);
  };

  const openEditDoctorForm = (doctor) => {
    setDoctorForm({
      firstName: doctor.firstName || "",
      lastName: doctor.lastName || "",
      specialty: doctor.specialty || "",
      department: doctor.department || "",
      subSpecialty: doctor.subSpecialty || "",
      credentials: doctor.credentials || "",
      email: doctor.email || "",
      contactNumber: doctor.contactNumber || "",
      gender: doctor.gender || "",
      clinicDays: Array.isArray(doctor.clinicDays) ? doctor.clinicDays.join(", ") : "",
      clinicHourIn: doctor.clinicHourIn || "",
      clinicHourOut: doctor.clinicHourOut || "",
      hmoAccepted: Array.isArray(doctor.hmoAccepted) ? doctor.hmoAccepted.join(", ") : "",
      bio: doctor.bio || "",
      status: doctor.status || "active",
    });
    setEditingDoctorId(doctor._id);
    setShowDoctorForm(true);
  };

  const closeDoctorForm = () => {
    if (savingDoctor) return;
    setShowDoctorForm(false);
    setEditingDoctorId(null);
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();

    if (!doctorForm.firstName || !doctorForm.lastName || !doctorForm.specialty || !doctorForm.department) {
      toast.error("First name, last name, specialty, and department are required.");
      return;
    }

    const payload = {
      firstName: doctorForm.firstName,
      lastName: doctorForm.lastName,
      specialty: doctorForm.specialty,
      department: doctorForm.department,
      subSpecialty: doctorForm.subSpecialty || undefined,
      credentials: doctorForm.credentials || undefined,
      email: doctorForm.email || undefined,
      contactNumber: doctorForm.contactNumber || undefined,
      gender: doctorForm.gender || undefined,
      clinicHourIn: doctorForm.clinicHourIn || undefined,
      clinicHourOut: doctorForm.clinicHourOut || undefined,
      bio: doctorForm.bio || undefined,
      status: doctorForm.status || "active",
      clinicDays: doctorForm.clinicDays
        ? doctorForm.clinicDays.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      hmoAccepted: doctorForm.hmoAccepted
        ? doctorForm.hmoAccepted.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };

    const isEditing = Boolean(editingDoctorId);

    try {
      setSavingDoctor(true);
      await adminFetch(isEditing ? `/admin/doctors/${editingDoctorId}` : "/admin/doctors", {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(isEditing ? "Doctor updated" : "Doctor added");
      setShowDoctorForm(false);
      setEditingDoctorId(null);
      if (activeTab === "doctors") {
        load("doctors");
      } else {
        setActiveTab("doctors");
      }
    } catch (err) {
      if (err.message === "SESSION_EXPIRED") {
        navigate("/admin/login", { replace: true });
        return;
      }
      toast.error(err.message || (isEditing ? "Failed to update doctor." : "Failed to add doctor."));
    } finally {
      setSavingDoctor(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    try {
      await adminFetch(`${endpointFor(activeTab)}/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      load(activeTab);
    } catch (err) {
      toast.error(err.message || "Failed to delete.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-800">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Olivarez General Hospital</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6 flex items-center justify-between border-b border-gray-200">
          <div className="flex gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab.key
                    ? "border-green-800 text-green-800"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "doctors" && (
            <button
              onClick={openAddDoctorForm}
              className="mb-2 rounded-md bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              + Add Doctor
            </button>
          )}
        </div>

        {loading && <p className="text-sm text-gray-500">Loading...</p>}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-gray-500">No records found.</p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-800">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === "bookings" && (
                    <>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Patient</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Department / Service</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Preferred Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Contact</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                    </>
                  )}
                  {activeTab === "contacts" && (
                    <>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Message</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Contact</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                    </>
                  )}
                  {activeTab === "doctors" && (
                    <>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Specialty</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Department</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeTab === "bookings" &&
                  items.map((b) => (
                    <tr key={b._id}>
                      <td className="px-4 py-3">{b.firstName} {b.lastName}</td>
                      <td className="px-4 py-3">{b.department} — {b.service}</td>
                      <td className="px-4 py-3">
                        {b.preferredDate ? new Date(b.preferredDate).toLocaleDateString() : "—"} {b.preferredTime}
                      </td>
                      <td className="px-4 py-3">{b.email}<br />{b.mobileNum}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          b.status === "handled" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => handleStatusToggle(b._id, b.status)} className="text-green-700 hover:underline">
                          Mark {b.status === "pending" ? "Handled" : "Pending"}
                        </button>
                        <button onClick={() => handleDelete(b._id)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                {activeTab === "contacts" &&
                  items.map((c) => (
                    <tr key={c._id}>
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3 max-w-xs truncate" title={c.message}>{c.message}</td>
                      <td className="px-4 py-3">{c.email}<br />{c.mobileNum}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          c.status === "handled" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => handleStatusToggle(c._id, c.status)} className="text-green-700 hover:underline">
                          Mark {c.status === "pending" ? "Handled" : "Pending"}
                        </button>
                        <button onClick={() => handleDelete(c._id)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                {activeTab === "doctors" &&
                  items.map((d) => (
                    <tr key={d._id}>
                      <td className="px-4 py-3">{d.firstName} {d.lastName}</td>
                      <td className="px-4 py-3">{d.specialty}</td>
                      <td className="px-4 py-3">{d.department}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          d.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => openEditDoctorForm(d)} className="text-blue-700 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => handleDoctorStatusToggle(d._id, d.status)} className="text-green-700 hover:underline">
                          Mark {d.status === "active" ? "Inactive" : "Active"}
                        </button>
                        <button onClick={() => handleDelete(d._id)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showDoctorForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeDoctorForm}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-green-800">
                {editingDoctorId ? "Edit Doctor" : "Add Doctor"}
              </h2>
              <button
                onClick={closeDoctorForm}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-4 text-gray-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-green-900">
                    First Name *
                  </label>
                  <input
                    name="firstName"
                    value={doctorForm.firstName}
                    onChange={handleDoctorFormChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-green-900">
                    Last Name *
                  </label>
                  <input
                    name="lastName"
                    value={doctorForm.lastName}
                    onChange={handleDoctorFormChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-green-900">
                    Specialty *
                  </label>
                  <input
                    name="specialty"
                    value={doctorForm.specialty}
                    onChange={handleDoctorFormChange}
                    placeholder="e.g. Cardiology"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-green-900">
                    Department *
                  </label>
                  <input
                    name="department"
                    value={doctorForm.department}
                    onChange={handleDoctorFormChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-green-900">
                    Sub-specialty
                  </label>
                  <input
                    name="subSpecialty"
                    value={doctorForm.subSpecialty}
                    onChange={handleDoctorFormChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-green-900">
                    Credentials
                  </label>
                  <input
                    name="credentials"
                    value={doctorForm.credentials}
                    onChange={handleDoctorFormChange}
                    placeholder="e.g. MD, FPCP"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-green-900">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={doctorForm.email}
                    onChange={handleDoctorFormChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-green-900">
                    Contact Number
                  </label>
                  <input
                    name="contactNumber"
                    value={doctorForm.contactNumber}
                    onChange={handleDoctorFormChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-green-900">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={doctorForm.gender}
                    onChange={handleDoctorFormChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                  >
                    <option value="">—</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-green-900">
                    Status
                  </label>
                  <select
                    name="status"
                    value={doctorForm.status}
                    onChange={handleDoctorFormChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-green-900">
                    Clinic Hour In
                  </label>
                  <input
                    name="clinicHourIn"
                    value={doctorForm.clinicHourIn}
                    onChange={handleDoctorFormChange}
                    placeholder="e.g. 8:00 AM"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-green-900">
                    Clinic Hour Out
                  </label>
                  <input
                    name="clinicHourOut"
                    value={doctorForm.clinicHourOut}
                    onChange={handleDoctorFormChange}
                    placeholder="e.g. 5:00 PM"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-green-900">
                  Clinic Days
                </label>
                <input
                  name="clinicDays"
                  value={doctorForm.clinicDays}
                  onChange={handleDoctorFormChange}
                  placeholder="Comma-separated, e.g. Mon, Wed, Fri"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-green-900">
                  HMOs Accepted
                </label>
                <input
                  name="hmoAccepted"
                  value={doctorForm.hmoAccepted}
                  onChange={handleDoctorFormChange}
                  placeholder="Comma-separated, e.g. Maxicare, Medicard"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-green-900">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={doctorForm.bio}
                  onChange={handleDoctorFormChange}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeDoctorForm}
                  disabled={savingDoctor}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDoctor}
                  className="rounded-md bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingDoctor ? "Saving..." : editingDoctorId ? "Update Doctor" : "Save Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;