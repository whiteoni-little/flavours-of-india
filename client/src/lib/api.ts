import { supabase } from "./supabase";

/**
 * Fetch wrapper that automatically attaches Supabase Auth token (if available)
 * and safely parses responses without throwing unexpected JSON token syntax errors.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: any; rawText?: string; error?: string }> {
  try {
    const headers = new Headers(init?.headers || {});

    // Attach Bearer token from Supabase session if not already attached
    if (!headers.has("Authorization")) {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    if (!headers.has("Content-Type") && init?.body && typeof init.body === "string") {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(input, {
      ...init,
      headers,
    });

    const contentType = res.headers.get("content-type") || "";
    let data: any = null;
    let rawText = "";

    if (contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch {
        rawText = await res.text().catch(() => "");
      }
    } else {
      rawText = await res.text().catch(() => "");
    }

    if (!res.ok) {
      const errMsg =
        data?.message ||
        data?.error ||
        (rawText && rawText.length < 200 ? rawText : `Request failed with status ${res.status}`);
      return {
        ok: false,
        status: res.status,
        data,
        rawText,
        error: errMsg,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: data !== null ? data : rawText,
      rawText,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || "Network error. Please check your connection.",
    };
  }
}

/**
 * Uploads an image file directly to Supabase Storage 'product-images' bucket
 * and returns the public CDN URL.
 */
export async function uploadProductImageDirect(
  file: File,
  productId?: string
): Promise<{ success: boolean; publicUrl?: string; storagePath?: string; error?: string }> {
  try {
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const cleanName = file.name
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const folder = productId ? `products/${productId}` : "products";
    const filePath = `${folder}/${Date.now()}_${uniqueId}_${cleanName}.${ext}`;

    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (error) {
      console.warn("Direct Supabase Storage upload failed:", error.message);
      return { success: false, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl,
      storagePath: filePath,
    };
  } catch (err: any) {
    console.error("Direct upload error:", err);
    return {
      success: false,
      error: err?.message || "Failed to upload image file",
    };
  }
}
