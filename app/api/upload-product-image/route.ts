import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawProductId = formData.get("productId") as string | null;
    const productId = rawProductId || `new_${Date.now()}`;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File gambar wajib diisi." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Format file tidak didukung. Gunakan JPG, PNG, atau WEBP." },
        { status: 400 }
      );
    }

    // Validate file size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Ukuran file maksimal 5 MB." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Build storage path: products/{productId}/{timestamp}.{ext}
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `products/${productId}/${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(path);

    const publicUrl = urlData?.publicUrl;

    // Optional: Update product image_url in DB if column exists
    try {
      await supabase
        .from("products")
        .update({ image_url: publicUrl })
        .eq("id", productId);
    } catch (_) {}

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err: any) {
    console.error("POST /api/upload-product-image error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
