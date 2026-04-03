import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { registerUser, loginUser } from "../services/user.js";
import { generateToken } from "../config/jwt.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

export async function authRoutes(fastify: FastifyInstance) {
  // Register endpoint
  fastify.post("/auth/register", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { name, email, password } = request.body as {
        name: string;
        email: string;
        password: string;
      };

      if (!name || !email || !password) {
        return sendError(reply, "Missing required fields", 400);
      }

      if (password.length < 6) {
        return sendError(reply, "Password must be at least 6 characters", 400);
      }

      const user = await registerUser({ name, email, password });
      const token = generateToken({ id: user.id, email: user.email });

      return sendSuccess(reply, { user, token }, 201, "User registered successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      return sendError(reply, message, 400);
    }
  });

  // Login endpoint
  fastify.post("/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      if (!email || !password) {
        return sendError(reply, "Missing email or password", 400);
      }

      const user = await loginUser(email, password);
      const token = generateToken({ id: user.id, email: user.email });

      return sendSuccess(reply, { user, token }, 200, "Login successful");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      return sendError(reply, message, 401);
    }
  });

  // Protected endpoint example
  fastify.get(
    "/auth/me",
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return sendSuccess(reply, { user: request.user }, 200, "User profile retrieved");
    }
  );
}
