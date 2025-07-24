import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { logMove } from "@/lib/activityLogger";

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
  region: "eu-north-1",
});

export async function POST(request: NextRequest) {
  const { oldKey, newKey } = await request.json();
  if (!oldKey || !newKey) {
    return NextResponse.json(
      { error: "Missing oldKey or newKey" },
      { status: 400 }
    );
  }
  try {
    // If renaming a folder, recursively copy and delete all objects under oldKey
    if (oldKey.endsWith("/")) {
      // List all objects under the folder
      const list = await client.send(
        new ListObjectsV2Command({
          Bucket: "s3ui--bucket",
          Prefix: oldKey,
        })
      );
      // Skip the folder placeholder itself
      const objects = (list.Contents || []).filter((obj) => obj.Key !== oldKey);
      // Copy each object to the new prefix
      for (const obj of objects) {
        const srcKey = obj.Key!;
        // Ensure no double slashes in the new key
        const destKey =
          newKey.replace(/\/+$/, "/") + srcKey.slice(oldKey.length);
        await client.send(
          new CopyObjectCommand({
            Bucket: "s3ui--bucket",
            CopySource: `s3ui--bucket/${encodeURIComponent(srcKey)}`,
            Key: destKey,
          })
        );
        // Log the move
        logMove(srcKey, destKey);
      }
      // Delete all old objects (except placeholder)
      if (objects.length > 0) {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: "s3ui--bucket",
            Delete: { Objects: objects.map((obj) => ({ Key: obj.Key! })) },
          })
        );
      }
      // Optionally: delete the old folder placeholder if it exists
      await client.send(
        new DeleteObjectCommand({
          Bucket: "s3ui--bucket",
          Key: oldKey,
        })
      );
      // Always create a placeholder for the new folder
      await client.send(
        new PutObjectCommand({
          Bucket: "s3ui--bucket",
          Key: newKey.replace(/\/+$/, "/"),
          Body: "",
        })
      );
    } else {
      // Single file: copy then delete
      await client.send(
        new CopyObjectCommand({
          Bucket: "s3ui--bucket",
          CopySource: `s3ui--bucket/${encodeURIComponent(oldKey)}`,
          Key: newKey,
        })
      );
      await client.send(
        new DeleteObjectCommand({
          Bucket: "s3ui--bucket",
          Key: oldKey,
        })
      );
      // Log the move
      logMove(oldKey, newKey);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error renaming object:", err);
    return NextResponse.json(
      { error: "Failed to rename object" },
      { status: 500 }
    );
  }
}
