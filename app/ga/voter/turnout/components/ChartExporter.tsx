import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { saveAs } from 'file-saver';

interface ChartExporterProps {
  chartRef: React.RefObject<HTMLDivElement>;
  chartType: string;
}

// Actions that this component exposes
export interface ChartExporterActions {
  exportToSVG: () => void;
  exportToPNG: () => Promise<void>;
}

export const ChartExporter = forwardRef<ChartExporterActions, ChartExporterProps>((
  { chartRef, chartType }, 
  ref
) => {
  
  const exportToSVG = () => {
    if (!chartRef.current) return;
    
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) {
      console.error('No SVG element found in the chart container');
      return;
    }
    
    const svgClone = svgElement.cloneNode(true) as SVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    const svgString = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    saveAs(blob, `ga-voter-turnout-${chartType.toLowerCase()}-chart.svg`);
  };
  
  const exportToPNG = async () => {
    // Return a promise to match ChartTabActions and allow await in parent
    return new Promise<void>((resolve, reject) => {
      if (!chartRef.current) {
        console.error('Chart container ref not available for PNG export');
        reject(new Error('Chart container ref not available'));
        return;
      }
      
      const svgElement = chartRef.current.querySelector('svg');
      if (!svgElement) {
        console.error('No SVG element found in the chart container for PNG export');
        reject(new Error('No SVG element found'));
        return;
      }
      
      const svgWidth = svgElement.clientWidth || 800;
      const svgHeight = svgElement.clientHeight || 600;
      const svgClone = svgElement.cloneNode(true) as SVGElement;
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      
      const svgString = new XMLSerializer().serializeToString(svgClone);
      const img = new Image();
      // Ensure proper encoding for characters like '#' in SVG data
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svgWidth;
        canvas.height = svgHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          console.error('Failed to get canvas context for PNG export');
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `ga-voter-turnout-${chartType.toLowerCase()}-chart.png`);
            resolve();
          } else {
            console.error('Failed to create blob for PNG export');
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      };

      img.onerror = (error) => {
        console.error('Error loading SVG image for PNG conversion:', error);
        reject(new Error('Error loading SVG image for PNG conversion'));
      };
    });
  };

  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    exportToSVG,
    exportToPNG
  }));
  
  // This component no longer renders anything itself, it only provides functionality via ref.
  return null;
});

ChartExporter.displayName = 'ChartExporter'; 