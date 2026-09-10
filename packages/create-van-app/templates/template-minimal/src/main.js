import van from "./core/van.js";
import { RouterView, navigate } from "./core/router.js";
import { HStack, VStack } from "./components/stack.js";
import "./styles/subset.css";

const { a, button, div, h1, header, main, nav, p, span, strong } = van.tags;

function HomePage() {
  const count = van.state(0);

  return div(
    { class: "c-container u-space-y-lg" },
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "Minimal VanJS Application"),
      p(
        { class: "c-card-description" },
        "Ultra-lightweight, zero-dependency SPA template targeting Mobile Safari and Embedded Engines (Cobalt, Webf, Lynx, Servo).",
      ),
      HStack(
        { spacing: 12 },
        button(
          {
            class: "c-btn c-btn-primary",
            onclick: () => count.val++,
          },
          "カウントアップ: ",
          () => count.val,
        ),
        button(
          {
            class: "c-btn",
            onclick: () => (count.val = 0),
          },
          "リセット",
        ),
      ),
    ),
  );
}

const routes = {
  "/": HomePage,
};

function App() {
  return div(
    { id: "app-root" },
    header(
      { class: "c-header" },
      div(
        { class: "c-header-title" },
        "My VanJS App",
        span({ class: "c-header-badge" }, "Minimal"),
      ),
      div({ style: "font-size: 12px; color: #94a3b8;" }, "Embedded-Safe Runtime"),
    ),
    main({ class: "c-main-scroll" }, RouterView(routes)),
  );
}

const mountPoint = document.getElementById("app") || document.body;
van.add(mountPoint, App());
