import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
  region: process.env.AWS_REGION || "eu-north-1",
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Expose-Headers": "ETag",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key");
    if (!key) {
      return NextResponse.json(
        { error: "Key parameter is required" },
        { status: 400 }
      );
    }

    console.log("Generating presigned URL for key:", key);

    // Create command for PUT operation
    const contentType =
      request.headers.get("content-type") || "application/octet-stream";
    console.log("Content-Type for presigned URL:", contentType);

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || "s3ui--bucket",
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned URL for PUT operation
    const url = await getSignedUrl(client, command, {
      expiresIn: 3600, // URL valid for 1 hour
    });

    console.log("Generated presigned URL:", url);

    return new NextResponse(
      JSON.stringify({
        url,
        bucket: "s3ui--bucket",
        key: key,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "http://localhost:3000",
          "Access-Control-Allow-Methods":
            "GET, PUT, POST, DELETE, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Expose-Headers": "ETag",
        },
      }
    );
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(
      JSON.stringify({
        error: "Failed to generate upload URL",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "http://localhost:3000",
        },
      }
    );
  }
}
