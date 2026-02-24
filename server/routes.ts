import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import catalogData from "./catalog.json";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Public Catalog Routes for Guest Experience
  app.get("/api/catalog/parents", (_req, res) => {
    res.json({ success: true, data: catalogData.parents });
  });

  app.get("/api/catalog/by-parent/:id", (req, res) => {
    const parentId = req.params.id;
    const children = catalogData.children[parentId as keyof typeof catalogData.children] || [];
    res.json({ success: true, data: children });
  });

  app.get("/api/catalog/service/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const allChildren = Object.values(catalogData.children).flat();
    const service = allChildren.find(s => s.id === id);
    if (service) {
      res.json({ success: true, data: service });
    } else {
      // Fallback: check parents if it's a category
      const parent = catalogData.parents.find(p => p.id === id);
      if (parent) {
        res.json({ success: true, data: parent });
      } else {
        res.status(404).json({ success: false, message: "Service not found" });
      }
    }
  });

  app.get("/api/catalog/menus-grouped", (req, res) => {
    const serviceId = req.query.serviceId as string;
    const menus = catalogData.menus[serviceId as keyof typeof catalogData.menus] || [];
    res.json({ success: true, data: menus });
  });

  return httpServer;
}
