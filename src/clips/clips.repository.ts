export type FileMetaData = {
  filename: string,
  size: number,
}

/** Repository for uploading and retrieving clips in S3 buckets */
export interface ClipsS3Repository {
  generatePresignedURL(fileMetaData: FileMetaData): Promise<string>
  checkIfClipExists(bucket: string, key: string): Promise<boolean>
}
