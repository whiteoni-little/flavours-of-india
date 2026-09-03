import { Router } from "express";
import { db } from "../db";

export const publicProductsRouter = Router();

publicProductsRouter.get("/", async (req, res) => {
  try {
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const page =
      typeof req.query.page === "string" ? parseInt(req.query.page, 10) : 1;
    const pageSize =
      typeof req.query.pageSize === "string"
        ? parseInt(req.query.pageSize, 10)
        : 12;
    const sort =
      typeof req.query.sort === "string" ? req.query.sort : undefined;

    const result = await db.getPublicProducts({
      category,
      search,
      page,
      pageSize,
      sort,
    });

    return res.json(result);
  } catch (err: any) {
    console.error("Error fetching public products:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not retrieve products catalogue",
    });
  }
});

publicProductsRouter.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await db.getPublicProductBySlug(slug);

    if (!product) {
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found or not currently available",
      });
    }

    return res.json(product);
  } catch (err: any) {
    console.error("Error fetching product detail:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not retrieve product detail",
    });
  }
});
