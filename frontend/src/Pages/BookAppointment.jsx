import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config/api";

const TIME_SLOTS = [
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
];

const INITIAL_FORM = {
  department: "",
  service: "",
  preferredDate: "",
  preferredTime: "",
  firstName: "",
  lastName: "",
  mobileNum: "",
  email: "",
  message: "",
};

const todayISO = () => new Date().toISOString().split("T")[0];

const inputClasses =
  "w-full rounded-lg border border-gray-200 bg-green-50/50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700 disabled:cursor-not-allowed disabled:opacity-60";

const labelClasses = "mb-1.5 block text-sm font-bold text-green-900";

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const [bookedTimes, setBookedTimes] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Whenever the chosen date changes, ask the backend which times are
  // already taken for that day so we can grey them out before the user
  // even tries to submit.
  const fetchBookedSlots = useCallback(async (date, signal) => {
    if (!date) {
      setBookedTimes([]);
      return;
    }
    try {
      setLoadingSlots(true);
      const res = await fetch(`${API_BASE_URL}/booking/slots?date=${date}`, {
        signal,
      });
      if (!res.ok) throw new Error("Failed to load booked slots");
      const data = await res.json();
      setBookedTimes(Array.isArray(data.bookedTimes) ? data.bookedTimes : []);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching booked slots:", err);
        setBookedTimes([]);
      }
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchBookedSlots(form.preferredDate, controller.signal);
    return () => controller.abort();
  }, [form.preferredDate, fetchBookedSlots]);

  // Pull department/service options from real doctor records in the database
  useEffect(() => {
    const controller = new AbortController();

    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await fetch(`${API_BASE_URL}/doctors`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load doctors");
        const data = await res.json();
        setDoctors(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching doctors:", err);
        }
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
    return () => controller.abort();
  }, []);

  const departmentOptions = useMemo(
    () => [...new Set(doctors.map((d) => d.department).filter(Boolean))].sort(),
    [doctors],
  );

  const serviceOptions = useMemo(() => {
    if (!form.department) return [];
    return [
      ...new Set(
        doctors
          .filter((d) => d.department === form.department)
          .map((d) => d.specialty)
          .filter(Boolean),
      ),
    ].sort();
  }, [doctors, form.department]);

  const handleChange = (field) => (e) => {
    const value =
      field === "mobileNum"
        ? e.target.value.replace(/\D/g, "").slice(0, 11)
        : e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
      // Reset service whenever department changes, since options depend on it
      ...(field === "department" ? { service: "" } : {}),
      // Reset time whenever date changes, since availability is per-date
      ...(field === "preferredDate" ? { preferredTime: "" } : {}),
    }));
  };

  const handleClearAll = () => {
    setForm(INITIAL_FORM);
    setStatus({ type: "", message: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (
      !form.department ||
      !form.service ||
      !form.preferredDate ||
      !form.preferredTime ||
      !form.firstName ||
      !form.lastName ||
      !form.mobileNum ||
      !form.email
    ) {
      setStatus({
        type: "error",
        message: "Please fill out all required fields.",
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          mobileNum: form.mobileNum,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Someone else grabbed this slot between our last check and this
          // submission — refresh the taken-slots list and clear the pick.
          fetchBookedSlots(form.preferredDate);
          setForm((prev) => ({ ...prev, preferredTime: "" }));
        }
        throw new Error(
          data?.message || "Something went wrong. Please try again.",
        );
      }

      setStatus({
        type: "success",
        message:
          "Your appointment request has been received. We'll contact you shortly to confirm.",
      });
      setForm(INITIAL_FORM);
    } catch (err) {
      console.error("Error submitting booking:", err);
      setStatus({
        type: "error",
        message:
          err.message ||
          "Unable to submit your request right now. Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-center text-3xl font-bold text-green-900">
        Book an Appointment
      </h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        Fill up this form to book an appointment with our specialists.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
      >
        {/* Department */}
        <div>
          <label className={labelClasses}>
            Department <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <select
              value={form.department}
              onChange={handleChange("department")}
              disabled={loadingDoctors}
              className={inputClasses}
            >
              <option value="">
                {loadingDoctors
                  ? "Loading departments..."
                  : "Select Department"}
              </option>
              {departmentOptions.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
            {loadingDoctors && (
              <svg
                className="pointer-events-none absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-green-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Service */}
        <div className="mt-6">
          <label className={labelClasses}>
            Select Service <span className="text-red-600">*</span>
          </label>
          <select
            value={form.service}
            onChange={handleChange("service")}
            disabled={!form.department}
            className={inputClasses}
          >
            <option value="">
              {form.department ? "Select Service" : "Select Department First"}
            </option>
            {serviceOptions.map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))}
          </select>
        </div>

        {/* Preferred Date / Time */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className={labelClasses}>
              Preferred Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              min={todayISO()}
              value={form.preferredDate}
              onChange={handleChange("preferredDate")}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>
              Preferred Time <span className="text-red-600">*</span>
            </label>
            <select
              value={form.preferredTime}
              onChange={handleChange("preferredTime")}
              disabled={!form.preferredDate || loadingSlots}
              className={inputClasses}
            >
              <option value="">
                {!form.preferredDate
                  ? "Select Date First"
                  : loadingSlots
                    ? "Checking availability..."
                    : "Select Time"}
              </option>
              {TIME_SLOTS.map((t) => {
                const isBooked = bookedTimes.includes(t);
                return (
                  <option key={t} value={t} disabled={isBooked}>
                    {isBooked ? `${t} (Booked)` : t}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* First / Last Name */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className={labelClasses}>
              First Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange("firstName")}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>
              Last Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange("lastName")}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Mobile / Email */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className={labelClasses}>
              Mobile Number <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              placeholder="e.g. 0917 123 4567"
              value={form.mobileNum}
              onChange={handleChange("mobileNum")}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange("email")}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Message */}
        <div className="mt-6">
          <label className={labelClasses}>Your Message</label>
          <textarea
            rows={4}
            placeholder="Anything else we should know? (optional)"
            value={form.message}
            onChange={handleChange("message")}
            className={`${inputClasses} resize-y`}
          />
        </div>

        {/* Status message */}
        {status.message && (
          <div
            className={`mt-6 rounded-lg px-4 py-3 text-sm ${
              status.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {status.message}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-3 rounded-md bg-green-800 pl-5 pr-2 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center gap-2">
              {submitting && (
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {submitting ? "Booking..." : "Book an Appointment"}
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded bg-green-900/40 text-base leading-none">
              +
            </span>
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-md border border-green-700 px-5 py-2.5 text-sm font-semibold text-green-800 transition-colors hover:bg-green-700 hover:text-white"
          >
            Clear All
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookAppointment;