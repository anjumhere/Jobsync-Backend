import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    });
    console.log('File uploaded to cloudinary successfully!');
    fs.unlinkSync(localFilePath);
    console.log('file deleted from localstorage');
    return response;
  } catch (error) {
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (unlinkError) {
      console.error('Error while deleting files from temp folder', unlinkError);
    }
    return null;
  }
};

const deleteFromCloudinary = async (url) => {
  try {
    const publicId = url.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.log('Error while deleting the old file', error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
