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

    const clipMetadata = await this.minioClient.statObject(this.bucketName, filename)
      .catch(() => null);

    if (clipMetadata) {
      throw new Error('A clip with this filename already exists');
    }

    await this.minioClient.putObject(this.bucketName, filename, file)
      .catch(() => {
        throw new Error('Error uploading the file');
      });

    return filename;
  }

  find(id: string): Promise<ClipFile> {
    throw new Error('Method not implemented.');
  }

  findAll(): Promise<ClipFile[]> {
    throw new Error('Method not implemented.');
  }
}
