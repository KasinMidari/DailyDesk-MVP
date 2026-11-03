import "./mocks/install";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/literata/500.css";
import "@fontsource/literata/600.css";
import { lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App.tsx";
import "./index.css";
import Layout from "./Layout.tsx";
import { Kanban } from "./pages/kanban";
import Tasks from "./pages/tasks.tsx";
import TasksPage from "./features/tasks/tasks-page.tsx";
import { Navigate } from "react-router";
import ProfilePage from "./pages/profile.tsx";

import NotFound from "@/pages/not-found.tsx";
import SignInPage from "./pages/sign-in.tsx";

const Doc = lazy(() => import("@/pages/doc/doc.tsx"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />} errorElement={<h1>error</h1>}>
          <Route path="/" element={<TasksPage />} />
          <Route path="/boards" element={<App />} />
          <Route path="/board/:boardId" element={<Kanban />} />
          <Route path="/lich" element={<Tasks />} />
          <Route path="/tasks" element={<Navigate to="/" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/doc" element={<Doc />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
