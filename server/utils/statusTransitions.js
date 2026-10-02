/**
 * Extracted from trashReportController.js and routeController.js, where this
 * logic was previously duplicated inline as local VALID_TRANSITIONS objects.
 * Pulling it out here makes it both reusable and independently testable.
 */

export const REPORT_TRANSITIONS = {
  Pending: ["InProgress", "Completed"],
  InProgress: ["Completed", "Pending"],
  Completed: ["Pending", "InProgress"],
};

export const ROUTE_TRANSITIONS = {
  Pending: ["InProgress", "Completed", "Archived"],
  InProgress: ["Completed", "Pending"],
  Completed: ["Pending", "InProgress", "Archived"],
  Archived: ["Pending"],
};

export function isValidTransition(transitionMap, currentStatus, newStatus) {
  return !!transitionMap[currentStatus]?.includes(newStatus);
}

/**
 * Mirrors determineRouteStatusFromReports from the status-cascade patch —
 * given the statuses of all reports in a route, what should the route's
 * overall status become?
 */
export function determineRouteStatusFromReports(reportStatuses) {
  if (reportStatuses.length === 0) return "Pending";
  if (reportStatuses.every((s) => s === "Completed")) return "Completed";
  if (reportStatuses.some((s) => s === "InProgress")) return "InProgress";
  if (reportStatuses.every((s) => s === "Pending")) return "Pending";
  return "InProgress"; // mixed pending/completed
}
