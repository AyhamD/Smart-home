// src/components/ImageCarousel.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

type ImageCarouselProps = {
  city: string | null;
};

const ImageCarousel = ({ city }: ImageCarouselProps) => {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchLocalImages = async () => {
      if (!city) return;
      
      try {
        const response = await axios.get(
          `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${
            import.meta.env.VITE_FLICKR_API_KEY
          }&text=${encodeURIComponent(city)} city&format=json&nojsoncallback=1&per_page=5`
        );

        const photos = response.data.photos.photo.map((photo: any) => 
          `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_b.jpg`
        );
        
        setImages(photos);
      } catch (err) {
        console.error('Failed to fetch images');
      }
    };

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 5000);

    fetchLocalImages();
    return () => clearInterval(timer);
  }, [city, images.length]);

  if (!images.length) return <div className="image-placeholder">Loading local images...</div>;

  return (
    <div className="carousel-container">
      {images.map((img, index) => (
        <img
          key={img}
          src={img}
          alt={`${city} landscape`}
          className={`carousel-image ${index === currentIndex ? 'active' : ''}`}
        />
      ))}
    </div>
  );
};

export default ImageCarousel;