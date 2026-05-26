export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string | null;
  errors: { field: string; message: string }[] | null;
  meta: Record<string, unknown>;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message: message || null,
    errors: null,
    meta: {},
  };
}

export function errorResponse(
  message: string,
  errors?: { field: string; message: string }[],
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    message,
    errors: errors || null,
    meta: {},
  };
}

export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): ApiResponse<T[]> {
  return {
    success: true,
    data: items,
    message: null,
    errors: null,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
