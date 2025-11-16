import { supabase } from "./supabase";

/**
 * Upload image file to Supabase storage
 * @param file - Image file to upload
 * @param bucket - Storage bucket name
 * @param folder - Optional folder path within bucket
 * @returns Public URL of uploaded image or null on error
 */
export const uploadImageToStorage = async (
  file: File,
  bucket: string,
  folder: string = ''
): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("کاربر وارد نشده است");

    const fileExt = file.name.split('.').pop();
    const fileName = `${folder ? folder + '/' : ''}${user.id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return null;
  }
};

/**
 * Delete image from Supabase storage
 * @param url - Public URL of image to delete
 * @param bucket - Storage bucket name
 */
export const deleteImageFromStorage = async (
  url: string,
  bucket: string
): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
    if (urlParts.length < 2) return false;
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return false;
  }
};
