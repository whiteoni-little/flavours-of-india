import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import {
  getSupabaseAdmin,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "./db/supabaseClient";

export interface PresignedUploadResult {
  uploadUrl: string;
  storagePath: string;
  publicUrl: string;
  method: "PUT" | "POST";
  headers?: Record<string, string>;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export class StorageService {
  private s3Client: S3Client | null = null;
  private bucket: string | null = null;
  private endpoint: string | null = null;
  private region: string = "us-east-1";

  constructor() {
    this.bucket = process.env.OBJECT_STORAGE_BUCKET || null;
    this.endpoint = process.env.OBJECT_STORAGE_ENDPOINT || null;
    this.region = process.env.OBJECT_STORAGE_REGION || "us-east-1";

    const accessKeyId = process.env.OBJECT_STORAGE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY;

    if (this.bucket && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: this.region,
        endpoint: this.endpoint || undefined,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: Boolean(this.endpoint),
      });
    }
  }

  public validateFileMeta(contentType: string, sizeInBytes?: number): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(contentType.toLowerCase())) {
      return {
        valid: false,
        error: `Unsupported image format (${contentType}). Allowed formats: JPEG, PNG, WebP, AVIF, GIF.`,
      };
    }

    if (sizeInBytes && sizeInBytes > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File exceeds maximum allowed size of 5MB.`,
      };
    }

    return { valid: true };
  }

  public async getPresignedUploadUrl(
    filename: string,
    contentType: string = "image/jpeg",
    productId?: string
  ): Promise<PresignedUploadResult> {
    const validation = this.validateFileMeta(contentType);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const ext = filename.includes(".") ? filename.split(".").pop() : "jpg";
    const uniqueId = nanoid(10);
    const sanitizedBase = filename.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
    const parentFolder = productId ? `products/${productId}` : "products";
    const storagePath = `${parentFolder}/${uniqueId}-${sanitizedBase}.${ext}`;

    // 1. Supabase Storage (Production primary)
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const supabaseUrl = getSupabaseUrl();

      if (supabase && supabaseUrl) {
        // Create signed upload URL in 'product-images' bucket
        const { data, error } = await supabase.storage
          .from("product-images")
          .createSignedUploadUrl(storagePath);

        if (!error && data) {
          const publicUrl = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/product-images/${storagePath}`;
          return {
            uploadUrl: data.signedUrl,
            storagePath,
            publicUrl,
            method: "PUT",
            headers: {
              "Content-Type": contentType,
            },
          };
        }
      }
    }

    // 2. AWS S3 / Compatible Object Storage
    if (this.s3Client && this.bucket) {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 900,
      });

      let publicUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${storagePath}`;
      if (this.endpoint) {
        publicUrl = `${this.endpoint.replace(/\/+$/, "")}/${this.bucket}/${storagePath}`;
      }

      return {
        uploadUrl,
        storagePath,
        publicUrl,
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
      };
    }

    // 3. Local development fallback
    const localKey = storagePath.replace(/\//g, "_");
    const publicUrl = `/manus-storage/${localKey}`;
    const uploadUrl = `/api/storage/upload/${encodeURIComponent(localKey)}`;

    return {
      uploadUrl,
      storagePath,
      publicUrl,
      method: "POST",
    };
  }
}

export const storageService = new StorageService();
