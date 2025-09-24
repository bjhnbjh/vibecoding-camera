# Task 10: Supabase Storage 설정 (이미지 파일 저장용)

## 📋 작업 개요
- **작업명**: Supabase Storage 설정 (이미지 파일 저장용)
- **우선순위**: 중간 (이미지 저장 인프라)
- **예상 소요시간**: 3-4시간

## 🎯 목표
사용자가 업로드한 음식 이미지를 안전하고 효율적으로 저장하고 관리할 수 있는 Supabase Storage 시스템을 설정한다.

## 📝 상세 요구사항

### 기능적 요구사항
1. **Storage Bucket 설정**
   - 이미지 전용 버킷 생성
   - 적절한 보안 정책 설정
   - 파일 크기 및 형식 제한

2. **이미지 업로드 기능**
   - 클라이언트에서 직접 업로드
   - 파일명 중복 방지 (UUID 사용)
   - 업로드 진행률 표시

3. **이미지 최적화**
   - 자동 이미지 리사이징
   - WebP 형식 변환 (지원 브라우저)
   - 썸네일 생성

4. **보안 및 접근 제어**
   - 사용자별 폴더 구조
   - RLS (Row Level Security) 적용
   - 공개 URL 생성

### 비기능적 요구사항
- **성능**: 빠른 업로드 및 다운로드 속도
- **보안**: 무단 접근 방지 및 데이터 보호
- **확장성**: 대용량 파일 및 많은 사용자 지원

## 🛠 기술 구현 사항

### 1. Storage Bucket 생성 및 설정
```sql
-- Supabase 대시보드에서 실행하거나 SQL 에디터에서 실행
-- 1. food-images 버킷 생성 (대시보드에서 수동으로 생성)

-- 2. Storage 정책 설정
-- 사용자는 자신의 이미지만 업로드 가능
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'food-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 사용자는 자신의 이미지만 조회 가능
CREATE POLICY "Users can view their own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'food-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 사용자는 자신의 이미지만 삭제 가능
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'food-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 공개 읽기 정책 (food_logs 테이블에 저장된 URL로 접근 시)
CREATE POLICY "Public can view food images" ON storage.objects
FOR SELECT USING (bucket_id = 'food-images');
```

### 2. 이미지 업로드 유틸리티
```typescript
// lib/storage.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export class StorageService {
  private supabase = createClientComponentClient();
  private bucketName = 'food-images';

  async uploadImage(
    file: File, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // 파일명 생성 (중복 방지)
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      // 파일 유효성 검사
      this.validateFile(file);

      // 이미지 압축 (필요시)
      const compressedFile = await this.compressImage(file);

      // Supabase Storage에 업로드
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // 공개 URL 생성
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      return urlData.publicUrl;

    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  private validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      throw new Error('파일 크기가 10MB를 초과합니다.');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('JPEG, PNG, WebP 형식만 지원됩니다.');
    }
  }

  private async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // 최대 크기 설정
        const maxWidth = 1200;
        const maxHeight = 1200;
        
        let { width, height } = img;

        // 비율 유지하면서 크기 조정
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          0.8 // 압축 품질
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // URL에서 파일명 추출
      const fileName = this.extractFileNameFromUrl(imageUrl);
      
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([fileName]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Image delete error:', error);
      throw error;
    }
  }

  private extractFileNameFromUrl(url: string): string {
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === this.bucketName);
    return urlParts.slice(bucketIndex + 1).join('/');
  }

  async getImageMetadata(imageUrl: string) {
    const fileName = this.extractFileNameFromUrl(imageUrl);
    
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .list(fileName.split('/')[0], {
        search: fileName.split('/')[1]
      });

    if (error || !data.length) {
      throw new Error('Image metadata not found');
    }

    return data[0];
  }
}

export const storageService = new StorageService();
```

### 3. 이미지 업로드 훅
```typescript
// hooks/useImageUpload.ts
interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  imageUrl: string | null;
}

export function useImageUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    imageUrl: null
  });

  const { data: { user } } = useUser();

  const uploadImage = useCallback(async (file: File) => {
    if (!user) {
      setUploadState(prev => ({ ...prev, error: '로그인이 필요합니다.' }));
      return null;
    }

    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      imageUrl: null
    });

    try {
      const imageUrl = await storageService.uploadImage(
        file,
        user.id,
        (progress) => {
          setUploadState(prev => ({ ...prev, progress }));
        }
      );

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        imageUrl
      }));

      return imageUrl;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '업로드 실패';
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage
      }));

      return null;
    }
  }, [user]);

  const resetUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      imageUrl: null
    });
  }, []);

  return {
    ...uploadState,
    uploadImage,
    resetUpload
  };
}
```

### 4. 이미지 최적화 컴포넌트
```typescript
// components/OptimizedFoodImage.tsx
interface OptimizedFoodImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
}

export function OptimizedFoodImage({
  src,
  alt,
  width = 400,
  height = 300,
  className = '',
  sizes = '(max-width: 768px) 100vw, 50vw'
}: OptimizedFoodImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Supabase Storage URL을 최적화된 URL로 변환
  const optimizedSrc = useMemo(() => {
    if (!src.includes('supabase')) return src;
    
    // 썸네일 버전 URL 생성 (Supabase의 이미지 변환 기능 사용)
    const url = new URL(src);
    url.searchParams.set('width', width.toString());
    url.searchParams.set('height', height.toString());
    url.searchParams.set('resize', 'cover');
    url.searchParams.set('quality', '80');
    
    return url.toString();
  }, [src, width, height]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      {!error ? (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`
            w-full h-full object-cover transition-opacity duration-300
            ${isLoading ? 'opacity-0' : 'opacity-100'}
          `}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded">
          <div className="text-center">
            <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">이미지를 불러올 수 없습니다</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 5. 이미지 관리 API
```typescript
// app/api/images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { storageService } from '@/lib/storage';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    // 이미지 삭제
    await storageService.deleteImage(imageUrl);

    // 데이터베이스에서 관련 레코드도 업데이트 (필요시)
    await supabase
      .from('food_logs')
      .update({ image_url: null })
      .eq('image_url', imageUrl)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Image deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    const metadata = await storageService.getImageMetadata(imageUrl);
    return NextResponse.json(metadata);

  } catch (error) {
    console.error('Image metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to get image metadata' },
      { status: 500 }
    );
  }
}
```

## 🔧 Storage 최적화 설정

### 1. CDN 및 캐싱 설정
```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['your-project-id.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600, // 1시간 캐싱
  },
  // 정적 파일 캐싱
  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### 2. 배치 정리 작업
```typescript
// utils/cleanupStorage.ts
export async function cleanupUnusedImages() {
  const supabase = createClientComponentClient();

  // 데이터베이스에서 참조되지 않는 이미지 찾기
  const { data: allImages } = await supabase.storage
    .from('food-images')
    .list();

  const { data: usedImages } = await supabase
    .from('food_logs')
    .select('image_url');

  const usedImagePaths = new Set(
    usedImages?.map(log => 
      storageService.extractFileNameFromUrl(log.image_url)
    ) || []
  );

  // 사용되지 않는 이미지 삭제
  const unusedImages = allImages?.filter(
    image => !usedImagePaths.has(image.name)
  ) || [];

  if (unusedImages.length > 0) {
    const { error } = await supabase.storage
      .from('food-images')
      .remove(unusedImages.map(img => img.name));

    if (error) {
      console.error('Cleanup error:', error);
    } else {
      console.log(`Cleaned up ${unusedImages.length} unused images`);
    }
  }
}
```

## ✅ 완료 기준 (Definition of Done)
- [ ] Supabase Storage 버킷 생성 및 설정 완료
- [ ] 보안 정책 (RLS) 설정 완료
- [ ] 이미지 업로드 서비스 구현 완료
- [ ] 이미지 압축 및 최적화 기능 구현 완료
- [ ] 이미지 삭제 기능 구현 완료
- [ ] 에러 처리 및 유효성 검사 구현 완료
- [ ] 업로드 진행률 표시 기능 구현 완료
- [ ] 다양한 이미지 형식으로 테스트 완료
- [ ] 대용량 파일 업로드 테스트 완료

## 🔗 관련 작업
- Task 02: Database Schema (image_url 필드 참조)
- Task 04: Image Upload (Storage 서비스 사용)
- Task 05: n8n Webhook (업로드된 이미지 URL 저장)
- Task 07: Dashboard (이미지 표시)

## 📚 참고 자료
- [Supabase Storage 공식 문서](https://supabase.com/docs/guides/storage)
- [이미지 최적화 가이드](https://web.dev/fast/)
- [Next.js Image Component](https://nextjs.org/docs/api-reference/next/image)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
