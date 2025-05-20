import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { saveAs } from 'file-saver';

interface ChartExporterProps {
  chartRef: React.RefObject<HTMLDivElement>;
  chartType: string;
  disabled: boolean;
}

export const ChartExporter: React.FC<ChartExporterProps> = ({ 
  chartRef, 
  chartType,
  disabled 
}) => {
  
  const exportToSVG = () => {
    if (!chartRef.current) return;
    
    // Find the SVG element inside the chart container
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) {
      console.error('No SVG element found in the chart container');
      return;
    }
    
    // Clone the SVG to avoid modifying the original
    const svgClone = svgElement.cloneNode(true) as SVGElement;
    
    // Add required namespaces
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // Generate SVG string
    const svgString = new XMLSerializer().serializeToString(svgClone);
    
    // Create blob and download
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    saveAs(blob, `ga-voter-turnout-${chartType.toLowerCase()}-chart.svg`);
  };
  
  const exportToPNG = async () => {
    if (!chartRef.current) return;
    
    // Find the SVG element inside the chart container
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) {
      console.error('No SVG element found in the chart container');
      return;
    }
    
    // Get SVG dimensions
    const svgWidth = svgElement.clientWidth || 800;
    const svgHeight = svgElement.clientHeight || 600;
    
    // Clone the SVG to avoid modifying the original
    const svgClone = svgElement.cloneNode(true) as SVGElement;
    
    // Add required namespaces
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // Generate SVG string
    const svgString = new XMLSerializer().serializeToString(svgClone);
    
    // Create an Image object to draw on canvas
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    
    img.onload = () => {
      // Create a canvas and draw the image
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth;
      canvas.height = svgHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        return;
      }
      
      // Fill canvas with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Convert canvas to PNG
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `ga-voter-turnout-${chartType.toLowerCase()}-chart.png`);
        }
      }, 'image/png');
    };
  };
  
  return (
    <div className="space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={exportToSVG}
        disabled={disabled}
      >
        Download Chart (SVG)
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={exportToPNG}
        disabled={disabled}
      >
        Download Chart (PNG)
      </Button>
    </div>
  );
}; 