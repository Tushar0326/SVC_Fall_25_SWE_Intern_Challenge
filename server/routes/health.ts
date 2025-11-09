import { RequestHandler } from "express";

export const handleHealth: RequestHandler = (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

