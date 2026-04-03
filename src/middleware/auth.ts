import { FastifyRequest, FastifyReply } from "fastify";
import { extractToken, verifyToken } from "../config/jwt.js";
import { sendError } from "../utils/response.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
    };
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = extractToken(request.headers.authorization);

  if (!token) {
    return sendError(reply, "Missing authorization token", 401, "Unauthorized");
  }

  const payload = verifyToken(token);
  if (!payload) {
    return sendError(reply, "Invalid or expired token", 401, "Unauthorized");
  }

  request.user = payload;
}
