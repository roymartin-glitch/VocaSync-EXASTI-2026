import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';

// Initialize Cloudinary config with API Key from .env.local
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || '625797439385457';
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, productName = 'Produk', folder = 'vokasync_promosi' } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Data gambar (base64) wajib disertakan.' },
        { status: 400 }
      );
    }

    // Check if full Cloudinary credentials (cloud name + secret) are present
    if (cloudName && apiSecret) {
      try {
        const cleanName = productName.toLowerCase().replace(/\s+/g, '_');
        const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
          folder,
          public_id: `promo_${cleanName}_${Date.now()}`,
          overwrite: true,
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto',
          transformation: [
            { effect: 'improve:outdoor' }, // AI Food & Product Lighting Auto-Enhancement
            { effect: 'vibrance:30' },     // AI Rich Fresh Color Saturation Booster
            { effect: 'auto_contrast' },   // Auto balance highlights and shadows
          ],
        });

        return NextResponse.json({
          success: true,
          provider: 'cloudinary',
          url: uploadResponse.secure_url,
          public_id: uploadResponse.public_id,
          message: 'Brosur berhasil diunggah ke Cloudinary!',
        });
      } catch (cloudErr: any) {
        console.warn('Cloudinary upload error:', cloudErr.message);
        return NextResponse.json({
          success: true,
          provider: 'local',
          url: null,
          message: 'Cloudinary upload error: ' + cloudErr.message,
        });
      }
    }

    // If Cloudinary cloud_name or api_secret are not yet defined
    return NextResponse.json({
      success: true,
      provider: 'local',
      url: null,
      message: 'Cloudinary API Key aktif. Silakan lengkapi CLOUDINARY_CLOUD_NAME dan CLOUDINARY_API_SECRET di .env.local.',
    });
  } catch (error: any) {
    console.error('POST /api/upload-studio-flyer error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses gambar.' },
      { status: 500 }
    );
  }
}
