/**
 * useAppHighlights Hook Tests
 */

import { renderHook, waitFor } from "@testing-library/react";
import { useAppHighlights } from "@/hooks/useAppHighlights";

// Mock fetch
global.fetch = jest.fn();

jest.mock("@/lib/app-highlights", () => ({
  updateHighlightsCache: jest.fn(),
}));

describe("useAppHighlights", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should start loading without highlights", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ highlights: {} }),
    });

    const { result } = renderHook(() => useAppHighlights("miniapp-lottery"));
    expect(result.current.loading).toBe(true);
    expect(result.current.highlights).toBeUndefined();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.highlights).toBeUndefined();
  });

  it("should fetch dynamic highlights", async () => {
    const highlights = [{ label: "Dynamic", value: "200", icon: "🚀" }];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          highlights: {
            "miniapp-neoburger": highlights,
          },
        }),
    });

    const { result } = renderHook(() => useAppHighlights("miniapp-neoburger"));

    await waitFor(() => {
      expect(result.current.highlights).toEqual(highlights);
    });

    const { updateHighlightsCache } = jest.requireMock("@/lib/app-highlights") as {
      updateHighlightsCache: jest.Mock;
    };
    expect(updateHighlightsCache).toHaveBeenCalledWith("miniapp-neoburger", highlights);
  });

  it("should handle fetch error gracefully", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAppHighlights("miniapp-lottery"));

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
    });

    expect(result.current.highlights).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });
});
