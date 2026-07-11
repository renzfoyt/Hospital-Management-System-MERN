import React, { useState, useEffect, useRef, useCallback } from "react";

// slides: array of { type: 'image' | 'video', src, alt? }
const Carousel = ({
  slides = [],
  autoPlayInterval = 5000,
  height = "50vh",
  title,
  subtitle,
}) => {
  const [current, setCurrent] = useState(0);
  const [loadedIndices, setLoadedIndices] = useState(() => new Set([0]));
  const timerRef = useRef(null);
  const videoRefs = useRef([]);

  // Lazy-load: only mount a slide's media once the carousel actually
  // reaches it. Previously-visited slides stay mounted so going back
  // doesn't re-trigger a load.
  useEffect(() => {
    setLoadedIndices((prev) => {
      if (prev.has(current)) return prev;
      const next = new Set(prev);
      next.add(current);
      return next;
    });
  }, [current]);

  const goTo = useCallback(
    (index) => {
      setCurrent((index + slides.length) % slides.length);
    },
    [slides.length],
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  const currentSlide = slides[current];
  const isOnVideoSlide = currentSlide?.type === "video";

  // Autoplay timer — only drives image slides. Video slides advance via
  // their own onEnded handler below, so the carousel waits for the full
  // video to finish before moving on.
  useEffect(() => {
    if (slides.length <= 1 || isOnVideoSlide) return;
    timerRef.current = setInterval(() => {
      setCurrent((prevIndex) => (prevIndex + 1) % slides.length);
    }, autoPlayInterval);
    return () => clearInterval(timerRef.current);
  }, [current, slides.length, autoPlayInterval, isOnVideoSlide]);

  useEffect(() => {
    videoRefs.current.forEach((videoEl, index) => {
      if (!videoEl) return;
      if (index === current) {
        videoEl.currentTime = 0;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } else {
        videoEl.pause();
      }
    });
  }, [current, loadedIndices]);

  if (!slides.length) return null;

  return (
    <div className="relative w-full overflow-hidden">
      <div className="relative w-full bg-black" style={{ height }}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === current
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {!loadedIndices.has(index) ? (
              // Not reached yet — render nothing so the browser never
              // fetches this slide's image/video until it's needed.
              <div className="h-full w-full bg-black" />
            ) : slide.type === "video" ? (
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={slide.src}
                muted
                playsInline
                disablePictureInPicture
                preload={index === current ? "auto" : "metadata"}
                className="h-full w-full object-cover"
                onEnded={next}
              />
            ) : (
              <img
                src={slide.src}
                alt={slide.alt || `Slide ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "auto"}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {/* Dark tint overlay */}
      <div className="absolute inset-0 z-[15] bg-green-950/60 pointer-events-none"></div>

      {/* Standalone centered text — independent of slides */}
      {(title || subtitle) && (
        <div className="absolute inset-0 z-[16] flex flex-col items-center justify-center px-6 text-center pointer-events-none">
          {title && (
            <h2 className="text-2xl font-bold text-white drop-shadow-md sm:text-4xl md:text-5xl">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-white/90 drop-shadow-md sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                index === current ? "bg-white" : "bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;