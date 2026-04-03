import { FastifyReply } from "fastify";

export interface ApiResponse<T = any> {
  status: "success" | "error";
  statusCode: number;
  message?: string;
  data?: T;
  error?: string;
}

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode: number = 200,
  message?: string
): FastifyReply {
  return reply.status(statusCode).send({
    status: "success",
    statusCode,
    message: message || "Request successful",
    data
  } as ApiResponse<T>);
}

export function sendError(
  reply: FastifyReply,
  error: string | Error,
  statusCode: number = 400,
  message?: string
): FastifyReply {
  const errorMessage = error instanceof Error ? error.message : error;
  return reply.status(statusCode).send({
    status: "error",
    statusCode,
    message: message || "Request failed",
    error: errorMessage
  } as ApiResponse);
}
