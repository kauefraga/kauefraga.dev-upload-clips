import { CreateBucketCommand, HeadBucketCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { ClipsS3Repository, FileMetaData } from './clips.repository';

async function ensureBucketExists(bucketName: string, s3Client: S3Client) {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`[${new Date()}] Bucket '${bucketName}' created.`);
    } else {
      throw error;
    }
  }
}

export class S3ClipsRepository implements ClipsS3Repository {
  constructor(private bucketName: string, private s3: S3Client) {}

  async generatePresignedURL({ filename, size }: FileMetaData): Promise<string> {
    await ensureBucketExists(this.bucketName, this.s3);

    console.log(`[${new Date()}] Generating presigned URL for '${filename}'`);

    const url = await getSignedUrl(this.s3, new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `clips/${filename}`,
      ContentType: 'video/mp4',
      ContentLength: size,
    }), { expiresIn: 60 });

    return url;
  }

  async checkIfClipExists(key: string): Promise<boolean> {
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.bucketName, Key: key }));

      return true; // Object exists
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false; // Object does not exist
      }

      throw err;
    }
  }
}
