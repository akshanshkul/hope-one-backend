import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import env from "../config/env.js";

const getClient = () => {
  if (!env.aws.accessKeyId || !env.aws.secretAccessKey || !env.aws.region || !env.aws.bucket) {
    const error = new Error("S3 storage is not configured");
    error.statusCode = 503;
    throw error;
  }
  return new S3Client({
    region: env.aws.region,
    credentials: {
      accessKeyId: env.aws.accessKeyId,
      secretAccessKey: env.aws.secretAccessKey
    }
  });
};

export const createUploadUrl = async ({ userId, fileName, contentType, category }) => {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `users/${userId}/${category}/${randomUUID()}-${safeName}`;
  const command = new PutObjectCommand({
    Bucket: env.aws.bucket,
    Key: key,
    ContentType: contentType
  });
  const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: 900 });
  return { key, uploadUrl, expiresIn: 900 };
};

export const createDownloadUrl = async (key) => {
  const fileName = key.split("/").pop()?.replace(/^[^/]+-/, "") || "document";
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: env.aws.bucket,
      Key: key,
      ResponseContentDisposition: `inline; filename="${fileName.replace(/"/g, "")}"`,
    }),
    { expiresIn: 900 }
  );
};
