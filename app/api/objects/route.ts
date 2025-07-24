import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { activityLog } from "./delete/route";

// Initialize S3 client with credentials and region
const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
  region: "eu-north-1",
});

// API route to list objects and folders in the S3 bucket
export async function GET(request: NextRequest) {
  // Get the prefix (folder path) from the query string
  const prefix = request.nextUrl.searchParams.get("prefix") ?? "";
  // Ensure prefix ends with / if not empty
  const normalizedPrefix = prefix
    ? prefix.endsWith("/")
      ? prefix
      : `${prefix}/`
    : "";

  // List objects and folders at the given prefix
  const command = new ListObjectsV2Command({
    Bucket: "s3ui--bucket",
    Delimiter: "/",
    Prefix: normalizedPrefix,
  });
  const result = await client.send(command);

  // Get folders (CommonPrefixes) at this level
  const folders = result.CommonPrefixes || [];

  // Get files (Contents) at this level, excluding folder placeholders
  const files = result.Contents?.filter((e) => !e.Key?.endsWith("/")) || [];

  // Calculate total file count and total size for this prefix (always fresh from S3)
  const totalCount = files.length;
  const totalSize = files.reduce((sum, f) => sum + (f.Size || 0), 0);

  // For each folder, fetch its immediate children files (not recursive)
  const folderItems = await Promise.all(
    folders.map(async (p) => {
      const folderCommand = new ListObjectsV2Command({
        Bucket: "s3ui--bucket",
        Delimiter: "/",
        Prefix: p.Prefix,
      });
      const folderResult = await client.send(folderCommand);
      const children = (folderResult.Contents || [])
        .filter((e) => !e.Key?.endsWith("/"))
        .map((e) => ({
          Key: e.Key,
          Size: e.Size, // always from S3
          LastModified: e.LastModified,
          type: "file",
        }));
      return {
        Key: p.Prefix,
        type: "folder",
        children,
      };
    })
  );

  // Format files at this level
  const rootFiles = files.map((e) => ({
    Key: e.Key,
    Size: e.Size, // always from S3
    LastModified: e.LastModified,
    type: "file",
  }));

  // Return folders (with children) and files in a single array
  return NextResponse.json({
    items: [...folderItems, ...rootFiles],
    totalCount,
    totalSize,
  });
}

// Add a handler for /api/objects/activity
export async function GET_ACTIVITY(request: NextRequest) {
  return NextResponse.json({ log: activityLog.slice(-100).reverse() }); // last 100 actions, most recent first
}

// POST handler to create a new folder (empty object with trailing slash)
export async function POST(request: NextRequest) {
  const prefix = request.nextUrl.searchParams.get("prefix");
  if (!prefix || !prefix.endsWith("/")) {
    return NextResponse.json({ error: "Invalid folder name" }, { status: 400 });
  }
  try {
    const command = new PutObjectCommand({
      Bucket: "s3ui--bucket",
      Key: prefix, // S3 treats keys ending with / as folders
      Body: "",
    });
    await client.send(command);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error creating folder:", err);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}
