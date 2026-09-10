import van from "./core/van.js";
import { Link, RouterView, currentRoute } from "./core/router.js";
import { HomePage } from "./pages/HomePage.js";
import { ComponentsPage } from "./pages/ComponentsPage.js";
import { LayoutPage } from "./pages/LayoutPage.js";
import { BenchmarkPage } from "./pages/BenchmarkPage.js";
import { StatePage } from "./pages/StatePage.js";
import { UserDetailPage } from "./pages/UserDetailPage.js";
import { authStore } from "./core/store.js";
import "./styles/subset.css";

const { div, header, main, nav, span } = van.tags;

const routes = {
  "/": HomePage,
  "/benchmark": BenchmarkPage,
  "/components": ComponentsPage,
  "/layout": LayoutPage,
  "/state": StatePage,
  "/state/users/:id": StatePage,
  "/api": UserDetailPage,
  "/api/users/:id": UserDetailPage,
};

const navItems = [
  { label: "概要 (Home)", path: "/" },
  { label: "UIコンポーネント", path: "/components" },
  { label: "CSSレイアウト", path: "/layout" },
  { label: "状態 & ルーティング", path: "/state" },
  { label: "REST / SWR", path: "/api/users/1" },
  { label: "ベンチマーク", path: "/benchmark" },
];

function App() {
  return div(
    { id: "app-root" },

    // App Header
    header(
      { class: "c-header" },
      div(
        { class: "u-flex u-items-center u-space-x-sm" },
        div(
          { class: "c-header-title" },
          "VanJS Light WebApp",
          span({ class: "c-header-badge" }, "PoC v1.0"),
        ),
        // Reactive global store status in header
        () =>
          authStore.isAuthenticated.val
            ? span(
                { class: "c-badge c-badge-success", style: "font-size: 11px;" },
                `👤 ${authStore.user.val?.name || ""}`,
              )
            : span(""),
      ),
      div({ style: "font-size: 12px; color: #94a3b8;" }, "Cobalt / Webf / Lynx / Servo Safe"),
    ),

    // Navigation Bar
    nav(
      { class: "c-nav-bar" },
      navItems.map((item) =>
        Link(
          {
            class: () => {
              const cur = currentRoute.val || "/";
              const isActive =
                cur === item.path || (item.path !== "/" && cur.startsWith(item.path));
              return `c-nav-item ${isActive ? "is-active" : ""}`;
            },
            to: item.path,
          },
          item.label,
        ),
      ),
    ),

    // Main Scroll Area (Prevents body-level fixed scroll glitches)
    main({ class: "c-main-scroll" }, RouterView(routes)),
  );
}

// Mount to document.body
const mountPoint = document.getElementById("app") || document.body;
van.add(mountPoint, App());
