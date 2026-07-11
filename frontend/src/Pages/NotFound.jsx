import React from "react";
import { Link } from "react-router";

const NotFound = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
        404
      </p>
      <h1 className="mt-2 text-2xl font-bold text-green-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-green-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;