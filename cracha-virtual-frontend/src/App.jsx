import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy } from "react";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { NotificationProvider } from "./components/NotificationProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LazyWrapper from "./components/LazyWrapper";

// Lazy loading das páginas
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Events = lazy(() => import("./pages/Events"));
const EventDetails = lazy(() => import("./pages/EventDetails"));
const MyEnrollments = lazy(() => import("./pages/MyEnrollments"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const Admin = lazy(() => import("./pages/Admin"));
const Evaluations = lazy(() => import("./pages/Evaluations"));
const EvaluateEnrollment = lazy(() => import("./pages/EvaluateEnrollment"));
const Profile = lazy(() => import("./pages/Profile"));
const Rankings = lazy(() => import("./pages/Rankings"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

import "./App.css";

// Configurar React Query com otimizações
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Rotas públicas */}
              <Route
                path="/login"
                element={
                  <LazyWrapper>
                    <Login />
                  </LazyWrapper>
                }
              />
              <Route
                path="/register"
                element={
                  <LazyWrapper>
                    <Register />
                  </LazyWrapper>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <LazyWrapper>
                    <ForgotPassword />
                  </LazyWrapper>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <LazyWrapper>
                    <ResetPassword />
                  </LazyWrapper>
                }
              />

              {/* Rotas protegidas */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LazyWrapper>
                        <Dashboard />
                      </LazyWrapper>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LazyWrapper>
                        <Events />
                      </LazyWrapper>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LazyWrapper>
                        <EventDetails />
                      </LazyWrapper>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-enrollments"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LazyWrapper>
                        <MyEnrollments />
                      </LazyWrapper>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/check-in"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LazyWrapper>
                        <CheckIn />
                      </LazyWrapper>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LazyWrapper>
                        <Admin />
                      </LazyWrapper>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/evaluations"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LazyWrapper>
                        <Evaluations />
                      </LazyWrapper>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/evaluate/:enrollmentId"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LazyWrapper>
                        <EvaluateEnrollment />
                      </LazyWrapper>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LazyWrapper>
                        <Profile />
                      </LazyWrapper>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ranking"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LazyWrapper>
                        <Rankings />
                      </LazyWrapper>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Rota padrão */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Rota 404 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
