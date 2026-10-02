import {
  REPORT_TRANSITIONS,
  ROUTE_TRANSITIONS,
  isValidTransition,
  determineRouteStatusFromReports,
} from "../utils/statusTransitions.js";

describe("report status transitions", () => {
  test.each([
    ["Pending", "InProgress", true],
    ["Pending", "Completed", true],
    ["InProgress", "Completed", true],
    ["InProgress", "Pending", true],
    ["Completed", "Pending", true],
    ["Completed", "InProgress", true],
  ])("%s -> %s is valid: %s", (from, to, expected) => {
    expect(isValidTransition(REPORT_TRANSITIONS, from, to)).toBe(expected);
  });

  test("rejects a nonsense status entirely", () => {
    expect(isValidTransition(REPORT_TRANSITIONS, "Pending", "Deleted")).toBe(false);
  });

  test("rejects transitioning from a status that doesn't exist", () => {
    expect(isValidTransition(REPORT_TRANSITIONS, "NotARealStatus", "Pending")).toBe(false);
  });
});

describe("route status transitions", () => {
  test("Archived can only go back to Pending, nothing else", () => {
    expect(isValidTransition(ROUTE_TRANSITIONS, "Archived", "Pending")).toBe(true);
    expect(isValidTransition(ROUTE_TRANSITIONS, "Archived", "InProgress")).toBe(false);
    expect(isValidTransition(ROUTE_TRANSITIONS, "Archived", "Completed")).toBe(false);
  });

  test("Pending can be archived directly", () => {
    expect(isValidTransition(ROUTE_TRANSITIONS, "Pending", "Archived")).toBe(true);
  });
});

describe("determineRouteStatusFromReports (the cascade logic)", () => {
  test("all completed -> route is Completed", () => {
    expect(determineRouteStatusFromReports(["Completed", "Completed", "Completed"])).toBe("Completed");
  });

  test("all pending -> route is Pending", () => {
    expect(determineRouteStatusFromReports(["Pending", "Pending"])).toBe("Pending");
  });

  test("any InProgress -> route is InProgress, even with a mix", () => {
    expect(determineRouteStatusFromReports(["Pending", "InProgress", "Completed"])).toBe("InProgress");
  });

  test("mixed Pending + Completed with NO InProgress -> still InProgress (partial progress)", () => {
    expect(determineRouteStatusFromReports(["Pending", "Completed"])).toBe("InProgress");
  });

  test("single report, Completed -> route is Completed", () => {
    expect(determineRouteStatusFromReports(["Completed"])).toBe("Completed");
  });

  test("empty report list defaults to Pending rather than throwing", () => {
    expect(determineRouteStatusFromReports([])).toBe("Pending");
  });
});
