import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.STORAGE_ENDPOINT || "";
const bucket = process.env.STORAGE_BUCKET || "";
const accessKeyId = process.env.STORAGE_ACCESS_KEY || "";
const secretAccessKey = process.env.STORAGE_SECRET_KEY || "";

export const s3 = new S3Client({
  region: "auto",
  endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

export async function getPresignedPutUrl(key: string, contentType: string) {
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, ACL: "public-read" });
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
  const publicBase = process.env.STORAGE_PUBLIC_BASE_URL || "";
  return { uploadUrl, key, publicUrl: `${publicBase}${key}` };
}

export async function headObject(key: string) {
  return s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
}