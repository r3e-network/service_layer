// =============================================================================
// Sidebar Component Tests
// =============================================================================

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "../Sidebar";

vi.mock("../../../../../shared/i18n/react", () => {
  const catalog = {
    common: {
      navigation: {
        dashboard: "Dashboard",
        services: "Services",
        miniapps: "MiniApps",
        users: "Users",
        analytics: "Analytics",
        contracts: "Contracts",
      },
    },
    admin: {
      dashboard: {
        title: "Admin Dashboard",
      },
    },
  };

  const resolveKey = (ns: string, key: string) => {
    const segments = key.split(".");
    let current: unknown = catalog[ns as keyof typeof catalog] ?? {};
    for (const segment of segments) {
      if (current && typeof current === "object" && segment in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[segment];
      } else {
        return key;
      }
    }
    return typeof current === "string" ? current : key;
  };

  return {
    useTranslation: (ns = "common") => ({
      t: (key: string) => resolveKey(ns, key),
    }),
  };
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Sidebar Component", () => {
  it("should render sidebar", () => {
    render(<Sidebar />);
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
  });

  it("should render all navigation items", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("MiniApps")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Contracts")).toBeInTheDocument();
  });

  it("should render navigation links with correct hrefs", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Services/i })).toHaveAttribute("href", "/services");
    expect(screen.getByRole("link", { name: /MiniApps/i })).toHaveAttribute("href", "/miniapps");
    expect(screen.getByRole("link", { name: /Users/i })).toHaveAttribute("href", "/users");
    expect(screen.getByRole("link", { name: /Analytics/i })).toHaveAttribute("href", "/analytics");
    expect(screen.getByRole("link", { name: /Contracts/i })).toHaveAttribute("href", "/contracts");
  });

  it("should display version info", () => {
    render(<Sidebar />);
    expect(screen.getByText("Neo MiniApp Platform")).toBeInTheDocument();
    expect(screen.getByText("v0.1.0")).toBeInTheDocument();
  });

  it("should mark active link with aria-current", () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });

  it("should have correct sidebar width", () => {
    const { container } = render(<Sidebar />);
    const sidebar = container.firstChild;
    expect(sidebar).toHaveClass("w-64");
  });
});
