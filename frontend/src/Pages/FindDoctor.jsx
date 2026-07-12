import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../config/api";

const DAYS = [
  { code: "Sun", label: "Sunday" },
  { code: "Mon", label: "Monday" },
  { code: "Tue", label: "Tuesday" },
  { code: "Wed", label: "Wednesday" },
  { code: "Thu", label: "Thursday" },
  { code: "Fri", label: "Friday" },
  { code: "Sat", label: "Saturday" },
];

const timeToMinutes = (t) => {
  if (!t) return null;
  const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let [, h, m, period] = match;
  h = parseInt(h, 10);
  m = parseInt(m, 10);
  if (period.toUpperCase() === "PM" && h !== 12) h += 12;
  if (period.toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + m;
};

const getInitials = (first, last) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

const FindDoctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  const [nameInput, setNameInput] = useState("");
  const [filters, setFilters] = useState({
    name: "",
    specialty: "",
    subSpecialty: "",
    clinicDays: [],
    clinicHourIn: "",
    clinicHourOut: "",
    gender: "",
    hmo: "",
  });

  const [popup, setPopup] = useState({ show: false, fading: false, count: 0 });
  const [visibleCount, setVisibleCount] = useState(6);
  const showTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const resultsRef = useRef(null);

  // Fetch doctors from the backend, auto-retrying on failure. This covers
  // the case where the frontend starts before the backend has finished
  // connecting to MongoDB (common right after `npm run dev`).
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let attempt = 0;
    const maxAttempts = 6;

    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/doctors`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load doctors");
        const data = await res.json();
        if (cancelled) return;
        setDoctors(Array.isArray(data) ? data : []);
        setError("");
        setRetryAttempt(0);
        setLoading(false);
      } catch (err) {
        if (err.name === "AbortError" || cancelled) return;
        attempt += 1;
        if (attempt < maxAttempts) {
          setRetryAttempt(attempt);
          setTimeout(fetchDoctors, Math.min(1000 * attempt, 4000));
        } else {
          console.error("Error fetching doctors:", err);
          setError("Unable to load doctors right now. Please try again later.");
          setLoading(false);
        }
      }
    };

    fetchDoctors();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadToken]);

  const handleRetryClick = () => {
    setError("");
    setRetryAttempt(0);
    setReloadToken((t) => t + 1);
  };

  // Debounce the name search input into the active filter
  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((prev) => ({ ...prev, name: nameInput.trim() }));
    }, 350);
    return () => clearTimeout(id);
  }, [nameInput]);

  // Dropdown option lists, derived from the fetched doctors
  const specialtyOptions = useMemo(
    () => [...new Set(doctors.map((d) => d.specialty).filter(Boolean))].sort(),
    [doctors],
  );

  const subSpecialtyOptions = useMemo(() => {
    const pool = filters.specialty
      ? doctors.filter((d) => d.specialty === filters.specialty)
      : doctors;
    return [...new Set(pool.map((d) => d.subSpecialty).filter(Boolean))].sort();
  }, [doctors, filters.specialty]);

  const clinicHourInOptions = useMemo(
    () =>
      [...new Set(doctors.map((d) => d.clinicHourIn).filter(Boolean))].sort(
        (a, b) => timeToMinutes(a) - timeToMinutes(b),
      ),
    [doctors],
  );

  const clinicHourOutOptions = useMemo(
    () =>
      [...new Set(doctors.map((d) => d.clinicHourOut).filter(Boolean))].sort(
        (a, b) => timeToMinutes(a) - timeToMinutes(b),
      ),
    [doctors],
  );

  const genderOptions = useMemo(
    () => [...new Set(doctors.map((d) => d.gender).filter(Boolean))].sort(),
    [doctors],
  );

  const hmoOptions = useMemo(
    () => [...new Set(doctors.flatMap((d) => d.hmoAccepted || []))].sort(),
    [doctors],
  );

  // Apply all active filters
  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      if (filters.name.length >= 2) {
        const fullName = `${d.firstName} ${d.lastName}`.toLowerCase();
        if (!fullName.includes(filters.name.toLowerCase())) return false;
      }
      if (filters.specialty && d.specialty !== filters.specialty) return false;
      if (filters.subSpecialty && d.subSpecialty !== filters.subSpecialty)
        return false;
      if (
        filters.clinicDays.length > 0 &&
        !filters.clinicDays.some((day) => (d.clinicDays || []).includes(day))
      )
        return false;
      if (filters.clinicHourIn && d.clinicHourIn !== filters.clinicHourIn)
        return false;
      if (filters.clinicHourOut && d.clinicHourOut !== filters.clinicHourOut)
        return false;
      if (filters.gender && d.gender !== filters.gender) return false;
      if (filters.hmo && !(d.hmoAccepted || []).includes(filters.hmo))
        return false;
      return true;
    });
  }, [doctors, filters]);

  const hasActiveFilters =
    filters.name.length >= 2 ||
    filters.specialty ||
    filters.subSpecialty ||
    filters.clinicDays.length > 0 ||
    filters.clinicHourIn ||
    filters.clinicHourOut ||
    filters.gender ||
    filters.hmo;

  // Reset to the first 6 results whenever the active filters change
  useEffect(() => {
    setVisibleCount(6);
  }, [filters]);

  // Match-count popup: appears on filter change, lingers 5s, fades over the last 0.5s
  useEffect(() => {
    clearTimeout(showTimerRef.current);
    clearTimeout(fadeTimerRef.current);

    if (!hasActiveFilters || loading) {
      setPopup({ show: false, fading: false, count: 0 });
      return;
    }

    setPopup({ show: true, fading: false, count: filteredDoctors.length });

    fadeTimerRef.current = setTimeout(() => {
      setPopup((prev) => ({ ...prev, fading: true }));
    }, 4500);

    showTimerRef.current = setTimeout(() => {
      setPopup({ show: false, fading: false, count: 0 });
    }, 5000);

    return () => {
      clearTimeout(showTimerRef.current);
      clearTimeout(fadeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, loading]);

  // Clear the popup and any pending timers immediately if this page unmounts (page switch)
  useEffect(() => {
    return () => {
      clearTimeout(showTimerRef.current);
      clearTimeout(fadeTimerRef.current);
    };
  }, []);

  const handleDayToggle = (code) => {
    setFilters((prev) => ({
      ...prev,
      clinicDays: prev.clinicDays.includes(code)
        ? prev.clinicDays.filter((d) => d !== code)
        : [...prev.clinicDays, code],
    }));
  };

  const handleClearAll = () => {
    setNameInput("");
    setFilters({
      name: "",
      specialty: "",
      subSpecialty: "",
      clinicDays: [],
      clinicHourIn: "",
      clinicHourOut: "",
      gender: "",
      hmo: "",
    });
  };

  const handlePopupClick = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPopup({ show: false, fading: false, count: 0 });
    clearTimeout(showTimerRef.current);
    clearTimeout(fadeTimerRef.current);
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-center text-3xl font-bold text-green-900">
        Find a Doctor
      </h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        Search our directory by name, specialty, availability, or coverage.
      </p>

      {/* Filters card */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-green-900">
              Doctor's Name
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Type 2 or more characters..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-green-900">
              Specialty
            </label>
            <select
              value={filters.specialty}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  specialty: e.target.value,
                  subSpecialty: "",
                }))
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            >
              <option value="">Select Specialty</option>
              {specialtyOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-green-900">
              Sub-specialty
            </label>
            <select
              value={filters.subSpecialty}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  subSpecialty: e.target.value,
                }))
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            >
              <option value="">Select Sub-specialty</option>
              {subSpecialtyOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-green-900">
            Clinic Day
          </label>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {DAYS.map((day) => (
              <label
                key={day.code}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  checked={filters.clinicDays.includes(day.code)}
                  onChange={() => handleDayToggle(day.code)}
                  className="relative h-4 w-4 shrink-0 appearance-none rounded border border-gray-300 bg-white checked:border-green-700 checked:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-700 after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-[10px] after:font-bold after:text-white after:content-[''] checked:after:content-['✓']"
                />
                {day.label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-green-900">
              Clinic Hour In
            </label>
            <select
              value={filters.clinicHourIn}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  clinicHourIn: e.target.value,
                }))
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            >
              <option value="">Select Clinic Hour In</option>
              {clinicHourInOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-green-900">
              Clinic Hour Out
            </label>
            <select
              value={filters.clinicHourOut}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  clinicHourOut: e.target.value,
                }))
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            >
              <option value="">Select Clinic Hour Out</option>
              {clinicHourOutOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-green-900">
              Filter by Gender
            </label>
            <select
              value={filters.gender}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, gender: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            >
              <option value="">Select Gender</option>
              {genderOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-green-900">
              Filter by HMO
            </label>
            <select
              value={filters.hmo}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, hmo: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            >
              <option value="">Select HMO</option>
              {hmoOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-md border border-green-700 px-5 py-2 text-sm font-semibold text-green-800 transition-colors hover:bg-green-700 hover:text-white"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Results */}
      <div ref={resultsRef} className="mt-10 scroll-mt-24">
        {loading && (
          <div>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-1/3 animate-loadingBar rounded-full bg-green-700" />
            </div>
            <p className="mb-4 text-center text-sm text-gray-500">
              {retryAttempt > 0
                ? `Connecting to server… (attempt ${retryAttempt + 1})`
                : "Loading doctors…"}
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm"
                >
                  <div className="mx-auto h-32 w-32 rounded-full bg-gray-200" />
                  <div className="mx-auto mt-4 h-4 w-32 rounded bg-gray-200" />
                  <div className="mx-auto mt-2 h-3 w-24 rounded bg-gray-200" />
                  <div className="mt-5 space-y-2">
                    <div className="h-3 w-full rounded bg-gray-200" />
                    <div className="h-3 w-5/6 rounded bg-gray-200" />
                    <div className="h-3 w-2/3 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-center text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={handleRetryClick}
              className="rounded-md border border-green-700 px-5 py-2 text-sm font-semibold text-green-800 transition-colors hover:bg-green-700 hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="mb-4 text-sm text-gray-500">
              Showing {Math.min(visibleCount, filteredDoctors.length)} of{" "}
              {filteredDoctors.length} doctors
            </p>

            {filteredDoctors.length === 0 ? (
              <p className="text-center text-sm text-gray-500">
                No doctors match your current filters.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDoctors.slice(0, visibleCount).map((doc) => (
                    <div
                      key={doc._id}
                      className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm"
                    >
                      <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-green-700 text-4xl font-semibold text-white">
                        {getInitials(doc.firstName, doc.lastName)}
                      </div>
                      <h3 className="mt-3 text-base font-bold text-gray-900">
                        Dr. {doc.firstName} {doc.lastName}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-green-700">
                        {doc.specialty}
                      </p>
                      <div className="mt-4 space-y-1 text-left text-sm text-gray-700">
                        {doc.gender && (
                          <p>
                            <span className="font-semibold">Gender:</span>{" "}
                            {doc.gender}
                          </p>
                        )}
                        {doc.clinicDays?.length > 0 && (
                          <p>
                            <span className="font-semibold">Clinic Days:</span>{" "}
                            {doc.clinicDays.join(", ")}
                          </p>
                        )}
                        {(doc.clinicHourIn || doc.clinicHourOut) && (
                          <p>
                            <span className="font-semibold">Clinic Hours:</span>{" "}
                            {doc.clinicHourIn} – {doc.clinicHourOut}
                          </p>
                        )}
                        {doc.contactNumber && (
                          <p>
                            <span className="font-semibold">Contact:</span>{" "}
                            {doc.contactNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {visibleCount < filteredDoctors.length && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + 6)}
                      className="rounded-md border border-green-700 px-6 py-2.5 text-sm font-semibold text-green-800 transition-colors hover:bg-green-700 hover:text-white"
                    >
                      View More
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Match-count popup */}
      {popup.show && (
        <button
          type="button"
          onClick={handlePopupClick}
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-green-800 px-5 py-3 text-sm font-medium text-white shadow-lg transition-opacity duration-500 ease-out hover:bg-green-700 ${
            popup.fading ? "opacity-0" : "opacity-90"
          }`}
        >
          {popup.count} {popup.count === 1 ? "doctor matches" : "doctors match"}{" "}
          your search — tap to view
        </button>
      )}
    </div>
  );
};

export default FindDoctor;
