import { BusboyFileStream } from '@fastify/busboy';
import type { Clip } from "./clip.entity";

/** Repository for creating and finding clips data in database */
export interface ClipsRepository {
  create(clip: Clip): Promise<Clip>
  find(id: string): Promise<Clip>
  findAll(): Promise<Clip[]>
}

export type ClipFile = {
  filename: string,
  file: BusboyFileStream
}

/** Repository for uploading and retrieving clips in S3 buckets */
export interface ClipsS3Repository {
  upload(clip: ClipFile): Promise<string>
  find(id: string): Promise<ClipFile>
  findAll(): Promise<ClipFile[]>
}
