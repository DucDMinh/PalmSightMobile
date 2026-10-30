export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: {
    fields?: ApiFieldError[];
    creditBalance?: number;
    readingId?: string;
    [key: string]: unknown;
  };
}

export interface ResponseCommon<T> {
  data: T;
  message?: string;
  status?: number;
}
