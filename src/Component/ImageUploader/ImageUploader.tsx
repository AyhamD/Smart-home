// src/components/ImageUploader.tsx
import { useState } from "react";
import { FaCirclePlus } from "react-icons/fa6";

type ImageUploaderProps = {
  onImagesSelected: (images: string[]) => void;
};

const ImageUploader = ({ onImagesSelected }: ImageUploaderProps) => {

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageArray: string[] = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          imageArray.push(e.target.result as string);
          if (imageArray.length === files.length) {
            onImagesSelected(imageArray);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="uploader-container">
      <label className="upload-button">
        <FaCirclePlus></FaCirclePlus>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
      </label>
    </div>
  );
};

export default ImageUploader;
