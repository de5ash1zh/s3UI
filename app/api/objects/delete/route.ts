import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
  region: process.env.AWS_REGION || "eu-north-1",
});

// In-memory activity log
export const activityLog: any[] =
  globalThis._activityLog || (globalThis._activityLog = []);

export async function POST(request: NextRequest) {
  const { key, isFolder } = await request.json();
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }
  try {
    if (isFolder) {
      // List all objects under the folder
      const list = await client.send(
        new ListObjectsV2Command({
          Bucket: process.env.AWS_BUCKET_NAME || "s3ui--bucket",
          Prefix: key,
        })
      );
      const objects = list.Contents || [];
      if (objects.length > 0) {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: process.env.AWS_BUCKET_NAME || "s3ui--bucket",
            Delete: { Objects: objects.map((obj) => ({ Key: obj.Key! })) },
          })
        );
        // Log each deleted object
        for (const obj of objects) {
          activityLog.push({
            type: "delete",
            key: obj.Key,
            timestamp: Date.now(),
          });
        }
      }
    } else {
      // Delete single file
      await client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME || "s3ui--bucket",
          Key: key,
        })
      );
      // Log the delete
      activityLog.push({ type: "delete", key, timestamp: Date.now() });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting object:", err);
    return NextResponse.json(
      { error: "Failed to delete object" },
      { status: 500 }
    );
  }
}
