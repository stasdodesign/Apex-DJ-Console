export interface Case {
  id: string;
  categoryId: string;
  imageUrl: string;
  mediaType?: 'image' | 'video';
  thumbnailUrl?: string;
  titleEn: string;
  titleRu: string;
  descriptionEn: string;
  descriptionRu: string;
  prompt: string;
  altText: string;
  createdAt: number;
}
