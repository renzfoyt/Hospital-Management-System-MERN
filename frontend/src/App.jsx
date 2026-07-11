import React, { useLayoutEffect } from 'react'
import { Routes, Route, useLocation, NavLink } from 'react-router';
import Header from './Components/Header';
import Footer from './Components/Footer';
import Home from './Pages/Home';
import FindDoctor from './Pages/FindDoctor';
import BookAppointment from './Pages/BookAppointment';
import AdminLogin from './Pages/Admin/AdminLogin';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import NotFound from './Pages/NotFound';
import RequireAdminAuth from './Components/RequireAdminAuth';
import ErrorBoundary from './Components/ErrorBoundary';
import { NavProvider } from './context/NavContext';

const App = () => {
  const location = useLocation();
  const isOnFindDoctor = location.pathname === '/FindDoctor';
  const isAdminRoute = location.pathname.startsWith('/admin');

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <NavProvider>
      <div>
        {!isAdminRoute && <Header />}
        <div key={location.pathname} className="animate-page-fade">
          <ErrorBoundary>
            <Routes location={location}>
              <Route path='/' element={<Home />} />
              <Route path='/FindDoctor' element={<FindDoctor />} />
              <Route path='/BookAppointment' element={<BookAppointment />} />
              <Route path='/admin/login' element={<AdminLogin />} />
              <Route
                path='/admin'
                element={
                  <RequireAdminAuth>
                    <AdminDashboard />
                  </RequireAdminAuth>
                }
              />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </div>

        {!isAdminRoute && <Footer />}

        {/* Lingering Find A Doctor button — half-submerged tab */}
        {!isAdminRoute && (
          <NavLink
            to="/FindDoctor"
            className={`fixed left-[24px] z-40 flex h-[160px] w-[112px] items-start justify-center rounded-t-lg bg-orange-700 px-2 pt-4 text-center text-[13px] font-medium leading-snug text-white shadow-lg transition-all duration-500 ease-in-out hover:bg-orange-600 ${
              isOnFindDoctor ? 'bottom-[-220px]' : 'bottom-[-112px]'
            }`}
          >
            Find A Doctor
          </NavLink>
        )}
      </div>
    </NavProvider>
  )
}

export default App