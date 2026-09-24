// ARQUIVO: src/components/AppTour.jsx

import React, { useState, useEffect, useRef } from "react";
import Joyride, { STATUS, EVENTS, ACTIONS } from "react-joyride";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useMediaQuery } from "../hooks/use-mobile";
import { useNavigate } from "react-router-dom";

// ----------------------------
// 🧩 Passos do Tour
// ----------------------------
const isMobile = window.innerWidth < 768; // breakpoint mobile padrão

// Passos para Desktop
const dashboardStepsDesktop = [
  {
    target: "#nav-link-eventos",
    content:
      'Bem-vindo! Para começar, vamos para o menu "Eventos" para ver as formações disponíveis.',
    title: "1/5: Explore os Eventos",
    placement: "right",
    disableBeacon: true,
  },
];

// Passos para Mobile
const dashboardStepsMobile = [
  {
    target: "#mobile-menu-trigger",
    content:
      "Bem-vindo! Para começar, clique aqui para abrir o menu de navegação.",
    title: "Abra o Menu",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: "#nav-link-eventos",
    content:
      'Ótimo! Agora vamos para "Eventos" para ver as formações disponíveis.',
    title: "1/5: Explore os Eventos",
    placement: "center",
    spotlightClicks: false,
  },
];

// Eventos
const eventsSteps = [
  {
    target: "#events-list",
    content:
      'Ótimo! Esta é a lista de eventos. Clique em "Ver detalhes" para saber mais e se inscrever.',
    title: "2/5: Lista de Eventos",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: "#nav-link-meu-perfil",
    content:
      'Excelente! Agora, vamos para "Meu Perfil" para ver seu crachá e gerenciar suas informações.',
    title: "3/5: Acesse seu Perfil",
    placement: isMobile ? "center" : "right",
    disableBeacon: true,
    disableOverlay: true,
  },
];

// Perfil
const profileSteps = [
  {
    target: "#profile-info-tab",
    content: "Aqui você pode visualizar e editar seus dados pessoais.",
    title: "4/5: Suas Informações",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: "#my-badge-tab",
    content:
      "Clique nesta aba para visualizar seu Crachá Universal, sua identidade para todos os eventos.",
    title: "5/5: Visualize seu Crachá",
    placement: "bottom",
    disableBeacon: true,
  },
];

// ----------------------------
// 🧭 Componente principal
// ----------------------------
const AppTour = ({ user, setSidebarOpen }) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourStage, setTourStage] = useState("dashboard"); // controla o capítulo atual
  const intervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const { updateAuthUser } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const navigate = useNavigate();

  // --- Mutação para marcar tour como completo ---
  const { mutate: completeOnboarding } = useMutation({
    mutationFn: () => api.put("/users/me/complete-onboarding"),
    onSuccess: () => {
      updateAuthUser({ hasCompletedOnboarding: true });
      queryClient.setQueryData(["user-profile", user.id], (oldData) => {
        if (oldData) return { ...oldData, hasCompletedOnboarding: true };
      });
    },
  });

  // --- Escolhe os passos com base no estágio do tour ---
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRun(false);

    if (user && !user.hasCompletedOnboarding) {
      let currentSteps = [];

      if (tourStage === "dashboard") {
        currentSteps = isMobile ? dashboardStepsMobile : dashboardStepsDesktop;
      } else if (tourStage === "events") {
        currentSteps = eventsSteps;
      } else if (tourStage === "profile") {
        currentSteps = profileSteps;
      }

      const localSeen = localStorage.getItem("has_seen_tour");

      if (currentSteps.length > 0 && !localSeen) {
        const firstTarget = currentSteps[0].target;
        intervalRef.current = setInterval(() => {
          if (document.querySelector(firstTarget)) {
            clearInterval(intervalRef.current);
            setSteps(currentSteps);
            setStepIndex(0);
            setRun(true);
          }
        }, 200);
      } else {
        setRun(false);
        setSteps([]);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, isMobile, tourStage]);

  // --- Callback de controle do tour ---
  const handleJoyrideCallback = (data) => {
    const { action, index, status, type, step } = data;

    // ⚠️ Não encerre tour por erro de visibilidade — apenas pause
    if (type === EVENTS.TARGET_NOT_VISIBLE) {
      console.warn("Target não visível, tentando novamente:", step?.target);
      setRun(false);

      // aguarda o elemento aparecer
      const retryInterval = setInterval(() => {
        if (document.querySelector(step?.target)) {
          clearInterval(retryInterval);
          console.log("Target reapareceu:", step?.target);
          setRun(true);
        }
      }, 500);
      return;
    }

    // ▶️ Controle de passos
    if (type === EVENTS.STEP_AFTER) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);

      // Caso especial: abrir menu mobile
      if (
        isMobile &&
        step.target === "#mobile-menu-trigger" &&
        action === ACTIONS.NEXT
      ) {
        setRun(false);
        setSidebarOpen(true);

        animationFrameRef.current = requestAnimationFrame(() => {
          animationFrameRef.current = requestAnimationFrame(() => {
            setStepIndex(nextStepIndex);
            setRun(true);
          });
        });
        return;
      }

      setStepIndex(nextStepIndex);
    } else if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // Se terminou ou PULOU, marca como visto para não encher o saco
      localStorage.setItem("has_seen_tour", "true");
      setRun(false);

      // Tenta persistir no backend também
      completeOnboarding();

      const finalProfileTarget = profileSteps[profileSteps.length - 1].target;

      // --- Dashboard Mobile (último passo) ---
      if (tourStage === "dashboard" && step?.target === "#nav-link-eventos") {
        navigate("/events");
        setTourStage("events");
        return;
      }

      // --- Dashboard Desktop ---
      if (tourStage === "dashboard") {
        navigate("/events");
        setTourStage("events");
        return;
      }

      // --- Events ---
      if (
        tourStage === "events" &&
        step?.target === eventsSteps[eventsSteps.length - 1].target
      ) {
        navigate("/profile");
        setTourStage("profile");
        return;
      }

      // --- Profile (último passo global) ---
      if (tourStage === "profile" && step?.target === finalProfileTarget) {
        // Já chamou completeOnboarding acima
        return;
      }

      // Se foi SKIPPED em qualquer etapa, paramos por aqui
      if (status === STATUS.SKIPPED) {
        return;
      }

      // Fallback: pausa
      setRun(false);
    }
  };

  // --- Não renderiza enquanto não há passos ---
  if (!run || steps.length === 0) {
    return null;
  }

  // --- Renderização do Joyride ---
  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      continuous
      showProgress
      showSkipButton
      styles={{ options: { zIndex: 10000, primaryColor: "#18181b" } }}
      locale={{
        back: "Anterior",
        close: "Fechar",
        last: "Entendido!",
        next: "Próximo",
        skip: "Pular",
        nextLabelWithProgress: `Avançar: etapa ${stepIndex + 1} de ${steps.length
          }`,
      }}
    />
  );
};

export default AppTour;
