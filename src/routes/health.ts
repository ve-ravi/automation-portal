import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { sendSuccess } from "../utils/response.js";

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, { message: "Welcome to Fastify API", version: "1.0.0" });
  });

  fastify.get("/health", async (request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
}
