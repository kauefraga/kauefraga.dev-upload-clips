import { Client as MinioClient } from 'minio';
import type { ClipFile, ClipsS3Repository } from "./clips.repository";

async function ensureBucketExists(bucketName: string, minioClient: MinioClient) {
  const exists = await minioClient.bucketExists(bucketName);

  if (!exists) {
    await minioClient.makeBucket(bucketName);
    console.log(`[${new Date()}] Bucket '${bucketName}' created.`);
  }
}

export class MinIOClipsRepository implements ClipsS3Repository {
  constructor(private bucketName: string, private minioClient: MinioClient) { }

  async upload({ filename, file }: ClipFile): Promise<string> {
    await ensureBucketExists(this.bucketName, this.minioClient);

    const fileExists = await this.minioClient.statObject(this.bucketName, filename)
      .catch(() => {
        // .statObject throws an error when the object does not exist
        // in this case, we don't want to do nothing
        return null;
      });

    if (fileExists) {
      throw new Error('A clip with this filename already exists');
    }

    const uploadedFile = await this.minioClient.putObject(this.bucketName, filename, file);

    if (!uploadedFile) {
      throw new Error('Failed to upload clip file');
    }

    return filename;
  }

  async find(filename: string): Promise<ClipFile> {
    throw new Error('Method not implemented.');
  }

  findAll(): Promise<ClipFile[]> {
    throw new Error('Method not implemented.');
  }
}
