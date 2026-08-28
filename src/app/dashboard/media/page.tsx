import { getMedia } from "@/app/actions/media";
import { getToursAdmin } from "@/app/actions/tours";
import { getProgressUpdates } from "@/app/actions/progress";
import { getFeatures } from "@/app/actions/features";
import MediaDashboard from "@/components/dashboard/media/MediaDashboard";
import { getAssetUrl } from "@/utils/assets";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { phase1Amenities } from "@/data/urbanization/amenities-tab";
import { apartmentGalleryForUnit } from "@/data/urbanization/towers";
import { apartmentTypes } from "@/data/urbanization/apartments";
import { lotBlocks } from "@/data/urbanization/lots";
import { lotMeasuredPlanImage, lotPlanImage } from "@/data/urbanization/assets";
import { ApartmentView } from "@/data/urbanization/enums";

export const metadata = {
  title: "Multimedia General - Dashboard",
};

export default async function MediaPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const [mediaList, toursList, progressList] = await Promise.all([
    getMedia(),
    getToursAdmin(),
    getProgressUpdates(),
  ]);

  const allMedia: any[] = [];

  // 1. Amenidades oficiales de Olimpo Tumbes
  phase1Amenities.forEach((amenity) => {
    amenity.gallery.forEach((imgPath, idx) => {
      allMedia.push({
        id: `amenity-${amenity.id}-${idx + 1}`,
        title: `${amenity.title} - Foto ${idx + 1}${idx === 0 ? " (Portada)" : ""}`,
        url: getAssetUrl(imgPath),
        type: "image",
        category: "AMENITIES_GALLERY",
        isActive: true,
        createdAt: null,
        typology: amenity.title,
        subTypology: "gallery",
      });
    });
  });

  // 2. Galerías de Departamentos (20 unidades × 8 fotos = 160 fotos 4K)
  for (let level = 1; level <= 5; level++) {
    for (let slot = 1; slot <= 4; slot++) {
      const unitNumber = `${level}0${slot}`;
      const gallery = apartmentGalleryForUnit(level, slot);
      gallery.forEach((imgPath, idx) => {
        allMedia.push({
          id: `unit-depa-${unitNumber}-photo-${idx + 1}`,
          title: `Departamento ${unitNumber} - Foto ${idx + 1}`,
          url: getAssetUrl(imgPath),
          type: "image",
          category: "UNIDADES",
          isActive: true,
          createdAt: null,
          typology: `Piso ${level}`,
          subTypology: "gallery",
        });
      });
    }
  }

  // 3. Planos y Vistas de Tipologías de Departamentos (4 tipologías × 3 vistas)
  apartmentTypes.forEach((aptType) => {
    const typeName = `Depa 0${aptType.unitNumber}`;
    const furnishedImg = aptType.images[ApartmentView.FURNISHED];
    const measuredImg = aptType.images[ApartmentView.MEASURED];
    const bareImg = aptType.images[ApartmentView.BARE];

    if (furnishedImg) {
      allMedia.push({
        id: `apt-plan-${aptType.id}-furnished`,
        title: `${typeName} - Plano Amoblado`,
        url: getAssetUrl(furnishedImg),
        type: "image",
        category: "UNIDADES",
        isActive: true,
        createdAt: null,
        typology: "Planos y Vistas",
        subTypology: "furnished",
      });
    }
    if (measuredImg) {
      allMedia.push({
        id: `apt-plan-${aptType.id}-measured`,
        title: `${typeName} - Plano con Medidas`,
        url: getAssetUrl(measuredImg),
        type: "image",
        category: "UNIDADES",
        isActive: true,
        createdAt: null,
        typology: "Planos y Vistas",
        subTypology: "plans",
      });
    }
    if (bareImg) {
      allMedia.push({
        id: `apt-plan-${aptType.id}-bare`,
        title: `${typeName} - Plano Sin Amoblar`,
        url: getAssetUrl(bareImg),
        type: "image",
        category: "UNIDADES",
        isActive: true,
        createdAt: null,
        typology: "Planos y Vistas",
        subTypology: "unfurnished",
      });
    }
  });

  // 4. Lotes / Terrenos (133 lotes con renders y planos acotados)
  lotBlocks.forEach((block) => {
    block.lots.forEach((lotNumber, index) => {
      const fileNumber = block.firstFileNumber === undefined ? lotNumber : block.firstFileNumber + index;
      const cleanImg = lotPlanImage(block.id, fileNumber);
      const measuredImg = lotMeasuredPlanImage(block.id, fileNumber);

      if (measuredImg) {
        allMedia.push({
          id: `lot-${block.id}-${lotNumber}-measured`,
          title: `Mz. ${block.letter} Lote ${lotNumber} - Medidas`,
          url: getAssetUrl(measuredImg),
          type: "image",
          category: "LOTES",
          isActive: true,
          createdAt: null,
          typology: `Mz. ${block.letter}`,
          subTypology: "measured",
        });
      }

      if (cleanImg) {
        allMedia.push({
          id: `lot-${block.id}-${lotNumber}-clean`,
          title: `Mz. ${block.letter} Lote ${lotNumber} - Render`,
          url: getAssetUrl(cleanImg),
          type: "image",
          category: "LOTES",
          isActive: true,
          createdAt: null,
          typology: `Mz. ${block.letter}`,
          subTypology: "clean",
        });
      }
    });
  });

  // 5. Recorridos 360°
  toursList.filter((t) => t.thumbnailUrl).forEach((t) => {
    allMedia.push({
      id: `tour-${t.id}`,
      title: t.title,
      url: getAssetUrl(t.thumbnailUrl),
      type: "image",
      category: "RECORRIDOS",
      isActive: t.isActive,
      createdAt: t.createdAt,
    });
  });

  // 6. Avances de Obra
  progressList.filter((p) => p.mediaUrl).forEach((p) => {
    allMedia.push({
      id: `progress-${p.id}`,
      title: p.title,
      url: getAssetUrl(p.mediaUrl),
      type: "video",
      category: "AVANCES_DE_OBRA",
      isActive: true,
      createdAt: p.date,
    });
  });

  // 7. Video institucional y portada
  allMedia.push({
    id: "video-portada-intro",
    title: "Video Portada (Showroom Intro)",
    url: getAssetUrl("homepage/intro_video.mp4"),
    type: "video",
    category: "VIDEO_PORTADA",
    isActive: true,
    createdAt: null,
  });

  allMedia.push({
    id: "video-sidebar-oficial",
    title: "Video Institucional Oficial",
    url: getAssetUrl("video/video.mp4"),
    type: "video",
    category: "VIDEO_SIDEBAR",
    isActive: true,
    createdAt: null,
  });

  // 8. Medios subidos dinámicamente en la base de datos
  mediaList.forEach((m) => {
    allMedia.push({
      id: m.id,
      title: m.title,
      url: m.url ? getAssetUrl(m.url) : "",
      type: m.type,
      category: m.category || "EXTRA",
      isActive: m.isActive ?? false,
      createdAt: m.createdAt,
    });
  });

  const features = await getFeatures();
  const isIdentityEnabled = features.some((f) => f.id === "identity" && f.active);

  return (
    <MediaDashboard
      initialMedia={allMedia}
      currentUserRole={(session.user.role as string) || "SELLER"}
      isIdentityEnabled={isIdentityEnabled}
    />
  );
}
