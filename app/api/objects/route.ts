import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
  region: "eu-north-1",
});

export async function GET(request: NextRequest) {
  const prefix = request.nextUrl.searchParams.get("prefix") ?? "";
  // Ensure prefix ends with / if not empty
  const normalizedPrefix = prefix
    ? prefix.endsWith("/")
      ? prefix
      : `${prefix}/`
    : "";
  const command = new ListObjectsV2Command({
    Bucket: "s3ui--bucket",
    Delimiter: "/",
    Prefix: normalizedPrefix,
  });
  const result = await client.send(command);

  // Get root-level folders
  const folders = result.CommonPrefixes || [];

  // Get root-level files
  const files = result.Contents?.filter((e) => !e.Key?.endsWith("/")) || [];

  // For each folder, fetch its children files (not recursive)
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
          Size: e.Size,
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

  // Format root files
  const rootFiles = files.map((e) => ({
    Key: e.Key,
    Size: e.Size,
    LastModified: e.LastModified,
    type: "file",
  }));

  return NextResponse.json({
    items: [...folderItems, ...rootFiles],
  });
}
