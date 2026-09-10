import van from "./core/van.js";
import { RouterView, currentRoute, navigate } from "./core/router.js";
import { HomePage } from "./pages/HomePage.js";
import { ComponentsPage } from "./pages/ComponentsPage.js";
import { LayoutPage } from "./pages/LayoutPage.js";
import { BenchmarkPage } from "./pages/BenchmarkPage.js";
import "./styles/subset.css";

const { a, div, header, main, nav, span } = van.tags;

const routes = {
  "/": HomePage,
  "/benchmark": BenchmarkPage,
  "/components": ComponentsPage,
  "/layout": LayoutPage,
};

function App() {
  const navItems = [
    { label: "概要 (Home)", path: "/" },
    { label: "UIコンポーネント", path: "/components" },
    { label: "CSSレイアウト", path: "/layout" },
    { label: "ベンチマーク", path: "/benchmark" },
  ];

  return div(
    { id: "app-root" },

    // App Header
    header(
      { class: "c-header" },
      div(
        { class: "c-header-title" },
        "VanJS Light WebApp",
        span({ class: "c-header-badge" }, "PoC v1.0"),
      ),
      div({ style: "font-size: 12px; color: #94a3b8;" }, "Cobalt / Webf / Lynx / Servo Safe"),
    ),

    // Navigation Bar
    nav(
      { class: "c-nav-bar" },
      navItems.map((item) =>
        a(
          {
            class: () =>
              `c-nav-item ${currentRoute.val === item.path || (item.path === "/" && !currentRoute.val) ? "is-active" : ""}`,
            href: `#${item.path}`,
            onclick: (e) => {
              e.preventDefault();
              navigate(item.path);
            },
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
