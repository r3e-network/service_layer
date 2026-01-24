// =============================================================================
// Header Component Tests
// =============================================================================

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "../Header";

vi.mock("../../../../../shared/i18n/react", () => {
  const catalog = {
    admin: {
      dashboard: {
        title: "Admin Dashboard",
        overview: "Overview",
      },
    },
  };

  const resolveKey = (key: string) => {
    const segments = key.split(".");
    let current: unknown = catalog.admin ?? {};
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
    useTranslation: () => ({
      t: (key: string) => resolveKey(key),
    }),
    useI18n: () => ({
      locale: "en",
      locales: ["en", "zh"],
      localeNames: { en: "English", zh: "Chinese" },
      setLocale: vi.fn(),
    }),
  };
});

describe("Header Component", () => {
  it("should render header", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("should display title", () => {
    render(<Header />);
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
  });

  it("should display subtitle", () => {
    render(<Header />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });

  it("should display environment indicator", () => {
    render(<Header />);
    expect(screen.getByText("Local Development")).toBeInTheDocument();
  });

  it("should have sticky positioning class", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky");
    expect(header).toHaveClass("top-0");
  });
});
