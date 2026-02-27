/**
 * Shared API response types.
 *
 * Use these to ensure consistent typing across all API routes and client-side fetches.
 *
 * @example
 * ```ts
 * // Server — return type
 * export default defineEventHandler(async (): Promise<ApiResponse<{ user: User }>> => {
 *   return { success: true, data: { user } }
 * })
 *
 * // Client — fetch type
 * const { data } = await $fetch<ApiResponse<{ user: User }>>('/api/users/me')
 * ```
 */

/** Standard successful API response */
export interface ApiResponse<T = unknown> {
  success: true
  data: T
}

/** Standard error API response */
export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  success: true
  data: {
    items: T[]
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}

/** Union type for any API response */
export type ApiResult<T = unknown> = ApiResponse<T> | ApiError

/** Common pagination query parameters */
export interface PaginationQuery {
  page?: number
  perPage?: number
  sort?: string
  order?: 'asc' | 'desc'
}

/** Common filter + search query parameters */
export interface SearchQuery extends PaginationQuery {
  q?: string
  filter?: Record<string, string>
}
