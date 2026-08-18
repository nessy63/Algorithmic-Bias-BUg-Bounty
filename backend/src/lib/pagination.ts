// Clamp page/limit query params to sane integers. Without this, a non-numeric
// value produces NaN, which Prisma rejects with a 500 and which would also
// propagate into the response totalPages field.

export function parsePagination(
  query: Record<string, unknown>,
  defaults: { page: number; limit: number; maxLimit: number } = {
    page: 1,
    limit: 20,
    maxLimit: 100,
  }
) {
  const rawPage = parseInt(query.page as string, 10);
  const rawLimit = parseInt(query.limit as string, 10);

  const page = Number.isFinite(rawPage) ? Math.max(rawPage, 1) : defaults.page;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), defaults.maxLimit)
    : defaults.limit;

  return { page, limit, skip: (page - 1) * limit };
}
