import React from 'react';
import type { GalleryImage } from '../../data/galleries';

interface GalleryGridProps {
  images: GalleryImage[];
  onImageClick: (image: GalleryImage, index: number) => void;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ images, onImageClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
      {images.map((image, index) => (
        <div 
          key={image.id} 
          className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg aspect-[4/3] bg-gray-900"
          onClick={() => onImageClick(image, index)}
        >
          <img
            src={image.src}
            alt={image.alt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4 text-center">
            <h3 className="text-xl font-bold mb-2">{image.title || image.alt}</h3>
            {image.description && <p className="text-sm font-light">{image.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GalleryGrid;
