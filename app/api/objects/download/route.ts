import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
  region: process.env.AWS_REGION || "eu-north-1",
});

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  
  if (!key) {
    return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
  }
  
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || "s3ui--bucket",
      Key: key,
    });
    
    // Generate a presigned URL that expires in 15 minutes
    const presignedUrl = await getSignedUrl(client, command, { expiresIn: 900 });
    
    return NextResponse.json({ url: presignedUrl });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}