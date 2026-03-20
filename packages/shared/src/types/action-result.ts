export type AppError = {
  code: string
  message: string
}

export type ActionResult<T = void> =
  | { data: T extends void ? null : T; error: null }
  | { data: null; error: AppError }
