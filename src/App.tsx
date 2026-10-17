import { useEffect, useState } from "react";

import Landing from "@/components/landing/landing-shell";
import MonitorDashboard from "@/components/monitor/monitor-dashboard";
import SignIn from "@/components/auth/sign-in";
import {
  ExpertsSection,
  FaqSection,
  GreenSection,
  LivePreview,
  ProblemSection,
  PublicMapSection,
  SolutionSection,
  WhatToDoSection,
} from "@/components/landing/sections";
import { AlertToasts } from "@/components/monitor/status-alert";
import { CitizenAlertBanner } from "@/components/landing/citizen-alert-banner";
import { Chatbot } from "@/components/chat/chatbot";
import { useReservoirSim } from "@/hooks/use-reservoir-sim";
import { useAuth } from "@/lib/auth";

// Dos vistas con hash: "#/" portada pública y "#/monitor" tablero para personal autorizado
// ("#/monitor/<sección>" abre en esa sección). Comparten la misma simulación y el mismo asistente.
function useRoute() {
  const read = () => (window.location.hash.startsWith("#/monitor") ? "monitor" : "landing");
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onHash = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

export default function App() {
  const sim = useReservoirSim();
  const route = useRoute();
  const auth = useAuth();
  const openMonitor = () => {
    window.location.hash = "#/monitor";
  };
  const goHome = () => {
    window.location.hash = "#/";
  };

  if (route === "monitor") {
    if (!auth.session) return <SignIn onSignIn={auth.signIn} onSignUp={auth.signUp} onBack={goHome} />;
    return (
      <>
        <MonitorDashboard sim={sim} user={auth.session} onSignOut={auth.signOut} />
        <Chatbot sim={sim} side="right" />
      </>
    );
  }

  return (
    <>
      <Landing
        onOpenMonitor={openMonitor}
        banner={<CitizenAlertBanner sim={sim} />}
        preview={<LivePreview sim={sim} onOpenMonitor={openMonitor} />}
      >
        <PublicMapSection sim={sim} />
        <WhatToDoSection sim={sim} />
        <ProblemSection />
        <GreenSection sim={sim} />
        <SolutionSection onOpenMonitor={openMonitor} />
        <ExpertsSection />
        <FaqSection sim={sim} />
      </Landing>
      <AlertToasts toasts={sim.toasts.filter((t) => !t.test)} onClose={sim.dismissToast} />
      <Chatbot sim={sim} side="left" />
    </>
  );
}
