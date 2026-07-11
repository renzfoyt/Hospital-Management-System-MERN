import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Carousel from "../Components/Carousel";
import { useNav } from "../context/NavContext";
import { API_BASE_URL } from "../config/api";
import photo1 from "../Assets/Carousel/imgslide1.webp";
import photo2 from "../Assets/Carousel/imgslide2.webp";
import photo3 from "../Assets/Carousel/imgslide3.webp";
import promo from "../Assets/Carousel/olivarezvid.compressed.mp4";

import photoserv1 from "../Assets/Services/emergency.webp";
import photoserv2 from "../Assets/Services/radiology.webp";
import photoserv3 from "../Assets/Services/laboratory.webp";
import photoserv4 from "../Assets/Services/specialcare.webp";
import photoserv5 from "../Assets/Services/eyecenter.webp";
import photoserv6 from "../Assets/Services/healthpack.webp";

const slides = [
  { type: "image", src: photo1 },
  { type: "image", src: photo2 },
  { type: "image", src: photo3 },
  { type: "video", src: promo },
];

const SERVICES = [
  {
    id: "emergency-care",
    title: "Emergency Care",
    image: photoserv1,
    blurb:
      "Immediate medical attention for urgent illnesses, injuries, and life-threatening emergencies, available 24/7.",
  },
  {
    id: "radiology",
    title: "Radiology",
    image: photoserv2,
    blurb:
      "Advanced imaging services including X-rays, CT scans, MRI, ultrasound, and more for accurate diagnosis.",
  },
  {
    id: "laboratory-services",
    title: "Laboratory Services",
    image: photoserv3,
    blurb:
      "Comprehensive diagnostic testing with fast, reliable results to support your healthcare needs.",
  },
  {
    id: "special",
    title: "Special Care Units",
    image: photoserv4,
    blurb:
      "Dedicated intensive and specialized care for patients requiring continuous monitoring and advanced treatment.",
  },
  {
    id: "ophthalmology",
    title: "Eye Center",
    image: photoserv5,
    blurb:
      "Complete eye care services, including vision exams, diagnosis, treatment, and surgical care for eye conditions.",
  },
  {
    id: "health",
    title: "Health Packages",
    image: photoserv6,
    blurb:
      "Preventive health checkup packages designed to monitor your overall health and detect potential issues early.",
  },
];

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveSection } = useNav();
  const [expanded, setExpanded] = useState(null);

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    mobileNum: "",
    message: "",
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactStatus, setContactStatus] = useState({ type: "", message: "" });

  const handleContactChange = (field) => (e) => {
    const value =
      field === "mobileNum"
        ? e.target.value.replace(/\D/g, "").slice(0, 11)
        : e.target.value;
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus({ type: "", message: "" });

    if (
      !contactForm.name ||
      !contactForm.email ||
      !contactForm.mobileNum ||
      !contactForm.message
    ) {
      setContactStatus({
        type: "error",
        message: "Please fill out all fields.",
      });
      return;
    }

    try {
      setContactSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contactForm,
          mobileNum: contactForm.mobileNum,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message || "Something went wrong. Please try again.",
        );
      }

      setContactStatus({
        type: "success",
        message: "Message sent! We'll get back to you soon.",
      });
      setContactForm({ name: "", email: "", mobileNum: "", message: "" });
    } catch (err) {
      console.error("Error submitting contact form:", err);
      setContactStatus({
        type: "error",
        message:
          err.message ||
          "Unable to send your message right now. Please try again later.",
      });
    } finally {
      setContactSubmitting(false);
    }
  };

  // If we arrived here from another page via a nav-bar scroll link,
  // jump straight to the requested section instead of smooth-scrolling —
  // the route's fade-in is the transition here, so animating a scroll
  // on top of it would look like two transitions stacked on each other.
  useEffect(() => {
    const targetId = location.state?.scrollTo;
    if (targetId) {
      const el = document.getElementById(targetId);
      el?.scrollIntoView({ behavior: "auto", block: "start" });
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Scroll spy: rather than triggering the instant a single line crosses
  // into a section's bounds (too twitchy — it can fire while the previous
  // section still visually dominates the screen), this picks whichever
  // section currently occupies the most vertical space in the viewport.
  // That only flips once the new section has genuinely taken over.

  // 0.5 = dead center of the visible area below the sticky header.
// Lower it (e.g. 0.4) to trigger the underline earlier as you scroll down,
// raise it (e.g. 0.6) to trigger it later.
const CENTER_RATIO = 0.1;
  useEffect(() => {
    const ids = ["home", "about", "services", "contact"];
    let ticking = false;

    const computeActiveSection = () => {
      ticking = false;
      const header = document.querySelector("header");
      const headerHeight = header ? header.offsetHeight : 0;
      const visibleHeight = window.innerHeight - headerHeight;
      const centerY = headerHeight + visibleHeight * CENTER_RATIO;
      let bestId = null;

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= centerY && rect.bottom >= centerY) {
          bestId = id;
          break;
        }
      }

      if (bestId) setActiveSection(bestId);
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(computeActiveSection);
      }
    };

    computeActiveSection();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [setActiveSection]);

  return (
    <div className="w-full">
      <div id="home">
        <Carousel
          slides={slides}
          title="Onward to Great Health"
          subtitle="Dr. Arcadio Santos Ave, Parañaque City, 1700, Metro Manila"
        />
      </div>

      {/* About */}
      <section
        id="about"
        className="scroll-mt-24 mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <h2 className="text-center text-3xl font-bold text-green-800">
          About our Team
        </h2>
        <div className="mt-8 space-y-6 leading-relaxed text-green-900">
          <p>
            At Olivarez General Hospital, our physicians are committed to
            delivering compassionate, patient-centered care backed by years of
            clinical expertise and professional excellence. As the first
            hospital in Parañaque City, we have proudly served generations of
            families by bringing together a diverse team of trusted specialists
            across multiple medical and surgical disciplines.
          </p>
          <p>
            Our doctors work collaboratively with highly trained nurses, allied
            health professionals, and dedicated support staff to provide
            comprehensive and personalized treatment for every patient. Through
            a multidisciplinary approach, we ensure that each individual
            receives coordinated care tailored to their unique health needs,
            from preventive consultations to advanced medical interventions.
          </p>
          <p>
            Committed to continuous learning and innovation, our physicians stay
            updated with the latest medical advancements, evidence-based
            practices, and modern treatment techniques. Supported by the
            hospital's advanced facilities and patient-focused environment, they
            strive to deliver quality healthcare that promotes healing,
            wellness, and improved quality of life for the communities we
            proudly serve.
          </p>
        </div>
      </section>

      {/* Services */}
      <section
        id="services"
        className="scroll-mt-24 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <h2 className="text-center text-3xl font-bold text-green-800">
          Services
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Tap a card for a quick overview, or open the full page for details.
        </p>

        <div className="mt-8 grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => {
            const isOpen = expanded === service.id;
            return (
              <div
                key={service.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="relative h-48 w-full">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-green-900/30" />
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : service.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="font-semibold text-green-800">
                    {service.title}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`h-5 w-5 text-green-800 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 01-1.08 0l-4.25-4.65a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-4 pb-4 text-sm text-gray-600">
                      {service.blurb}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="scroll-mt-24 mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <h2 className="text-center text-3xl font-bold text-green-800">
          Contact Us
        </h2>

        <form onSubmit={handleContactSubmit} className="mt-8 space-y-6">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-green-900">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={contactForm.name}
              onChange={handleContactChange("name")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-green-900">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              value={contactForm.email}
              onChange={handleContactChange("email")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-green-900">
              Mobile Number <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              placeholder="e.g. 0917 123 4567"
              value={contactForm.mobileNum}
              onChange={handleContactChange("mobileNum")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-green-900">
              Your Message <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={4}
              value={contactForm.message}
              onChange={handleContactChange("message")}
              className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            />
          </div>

          {contactStatus.message && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                contactStatus.type === "success"
                  ? "border border-green-200 bg-green-50 text-green-800"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {contactStatus.message}
            </div>
          )}

          <button
            type="submit"
            disabled={contactSubmitting}
            className="flex items-center gap-2 rounded-md bg-green-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {contactSubmitting && (
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
            {contactSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default Home;
