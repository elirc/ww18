/**
 * What this file does:
 * Standardizes operational errors so routes can translate domain failures into HTTP responses consistently.
 * What calls it:
 * Auth, validation, and service-layer files across the codebase.
 * What it calls:
 * No downstream modules; it defines the shared error shape.
 * One thing a junior engineer would likely get wrong:
 * Throwing raw strings or generic Errors and making it impossible to preserve status-code intent at the route boundary.
 */

export class AppError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function getErrorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json({ error: error.message }, { status: error.statusCode });
  }

  if (error instanceof Error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ error: "Unknown server error." }, { status: 500 });
}
