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
import { SocketProvider } from "./contexts/SocketContext";
import { BrandingProvider } from "./contexts/BrandingContext";

// Lazy loading das páginas
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Events = lazy(() => import("./pages/Events"));
const EventDetails = lazy(() => import("./pages/EventDetails"));
const MyEnrollments = lazy(() => import("./pages/MyEnrollments"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const Admin = lazy(() => import("./pages/Admin"));
const EventEnrollments = lazy(() => import("./pages/EventEnrollments")); // NOVA ROTA

const Evaluations = lazy(() => import("./pages/Evaluations"));
const EvaluateEnrollment = lazy(() => import("./pages/EvaluateEnrollment"));
const Profile = lazy(() => import("./pages/Profile"));
const Rankings = lazy(() => import("./pages/Rankings"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const PresentationPage = lazy(() => import("./pages/PresentationPage"));
const InteractionsSelection = lazy(() => import("./pages/InteractionsSelection"));
const InteractionsRoom = lazy(() => import("./pages/InteractionsRoom"));
const MyTracks = lazy(() => import("./pages/MyTracks"));
const AdminTracks = lazy(() => import("./pages/AdminTracks"));

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

import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrandingProvider>
          <NotificationProvider>
            <AuthProvider>
              <SocketProvider>
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

                    <Route
                      path="/events/:id"
                      element={
                        <LazyWrapper>
                          <EventDetails />
                        </LazyWrapper>
                      }
                    />

                    {/* Rotas protegidas */}
                    <Route
                      path="/events/:id/presentation"
                      element={
                        <ProtectedRoute>
                          <LazyWrapper>
                            <PresentationPage />
                          </LazyWrapper>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/interactions"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LazyWrapper>
                              <InteractionsSelection />
                            </LazyWrapper>
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/interactions/:id"
                      element={
                        <ProtectedRoute>
                          <LazyWrapper>
                            <InteractionsRoom />
                          </LazyWrapper>
                        </ProtectedRoute>
                      }
                    />

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
                      path="/my-tracks"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LazyWrapper>
                              <MyTracks />
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
                      path="/admin/tracks"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LazyWrapper>
                              <AdminTracks />
                            </LazyWrapper>
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/events/:id/enrollments"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LazyWrapper>
                              <EventEnrollments />
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


                    {/* Rota Landing Page (Pública) */}
                    <Route
                      path="/"
                      element={
                        <LazyWrapper>
                          <LandingPage />
                        </LazyWrapper>
                      }
                    />

                    {/* Rota 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Router>
              </SocketProvider>
            </AuthProvider>
          </NotificationProvider>
        </BrandingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
