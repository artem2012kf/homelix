"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    ymaps3?: {
      ready: Promise<void>;
      YMap: new (
        element: HTMLElement,
        config: {
          location: {
            center: [number, number];
            zoom: number;
          };
        },
        children?: unknown[]
      ) => {
        addChild: (child: unknown) => void;
        destroy?: () => void;
      };
      YMapDefaultSchemeLayer: new (props: Record<string, never>) => unknown;
      YMapDefaultFeaturesLayer: new (props: Record<string, never>) => unknown;
      YMapMarker: new (
        props: {
          coordinates: [number, number];
        },
        element: HTMLElement
      ) => unknown;
    };
  }
}

type ProjectPoint = {
  title: string;
  description: string;
  coordinates: [number, number];
};

// Яндекс.Карты API v3 использует порядок координат: [долгота, широта].
const TYUMEN_CENTER: [number, number] = [65.534328, 57.153033];

const PROJECT_POINTS: ProjectPoint[] = [
  {
    title: "ЖК «Солнечный квартал»",
    description: "г. Тюмень, ул. Солнечная, 12",
    coordinates: [65.534328, 57.153033]
  }
];

function loadYandexMaps(apiKey: string) {
  const existingScript = document.querySelector<HTMLScriptElement>("script[data-yandex-maps-api='true']");

  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      if (window.ymaps3) {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Не удалось загрузить Яндекс.Карты")), {
        once: true
      });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.dataset.yandexMapsApi = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Не удалось загрузить Яндекс.Карты"));
    document.head.appendChild(script);
  });
}

function createMarkerElement(point: ProjectPoint) {
  const marker = document.createElement("div");
  marker.className = "yandex-map-marker";

  const pin = document.createElement("span");
  const title = document.createElement("strong");
  const description = document.createElement("small");

  title.textContent = point.title;
  description.textContent = point.description;

  marker.append(pin, title, description);

  return marker;
}

export function YandexMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<{ destroy?: () => void } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

      if (!apiKey) {
        setError("Добавьте ключ NEXT_PUBLIC_YANDEX_MAPS_API_KEY в Vercel Environment Variables.");
        return;
      }

      await loadYandexMaps(apiKey);

      if (cancelled || !mapRef.current || !window.ymaps3) return;

      await window.ymaps3.ready;

      if (cancelled || !mapRef.current || !window.ymaps3) return;

      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = window.ymaps3;

      const map = new YMap(
        mapRef.current,
        {
          location: {
            center: TYUMEN_CENTER,
            zoom: 13
          }
        },
        [new YMapDefaultSchemeLayer({}), new YMapDefaultFeaturesLayer({})]
      );

      PROJECT_POINTS.forEach((point) => {
        const marker = new YMapMarker(
          {
            coordinates: point.coordinates
          },
          createMarkerElement(point)
        );

        map.addChild(marker);
      });

      mapInstanceRef.current = map;
    }

    initMap().catch(() => {
      setError("Не удалось загрузить Яндекс.Карту. Проверьте ключ API и ограничения домена.");
    });

    return () => {
      cancelled = true;
      mapInstanceRef.current?.destroy?.();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <>
      <style>{`
        .yandex-map-card {
          overflow: hidden;
          min-height: 460px;
          border: 1px solid var(--line);
          border-radius: var(--radius-xl);
          background: #ffffff;
          box-shadow: var(--shadow);
        }

        .yandex-map {
          width: 100%;
          height: 520px;
        }

        .yandex-map-error {
          padding: 16px 18px;
          color: #ffffff;
          background: #F93E3E;
          font-weight: 800;
        }

        .yandex-map-marker {
          position: relative;
          display: grid;
          gap: 2px;
          min-width: 210px;
          padding: 12px 14px 12px 40px;
          border: 1px solid rgba(0, 59, 166, 0.12);
          border-radius: 18px;
          color: #003BA6;
          background: #ffffff;
          box-shadow: 0 16px 36px rgba(0, 59, 166, 0.22);
          transform: translate(-20px, -58px);
        }

        .yandex-map-marker span {
          position: absolute;
          left: 13px;
          top: 16px;
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: #F93E3E;
          box-shadow: 0 0 0 7px rgba(249, 62, 62, 0.14);
        }

        .yandex-map-marker strong {
          font-size: 14px;
          line-height: 1.25;
        }

        .yandex-map-marker small {
          color: rgba(0, 59, 166, 0.72);
          font-size: 12px;
          line-height: 1.35;
        }

        @media (max-width: 680px) {
          .yandex-map-card {
            min-height: 360px;
            border-radius: 24px;
          }

          .yandex-map {
            height: 380px;
          }

          .yandex-map-marker {
            min-width: 176px;
            padding: 10px 12px 10px 34px;
            transform: translate(-18px, -52px);
          }
        }
      `}</style>
      <div className="yandex-map-card">
        {error ? <div className="yandex-map-error">{error}</div> : null}
        <div ref={mapRef} className="yandex-map" />
      </div>
    </>
  );
}
