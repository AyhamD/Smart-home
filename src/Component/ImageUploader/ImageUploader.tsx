// src/components/ImageUploader.tsx
import React, { ChangeEvent } from 'react';
import { FaCirclePlus } from 'react-icons/fa6';
import { ImageUploaderProps } from '../../types';

const ImageUploader: React.FC<ImageUploaderProps> = ({onImagesSelected }) => {

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const imageUrls = files.map((file) => URL.createObjectURL(file));
      onImagesSelected (imageUrls);
    }
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