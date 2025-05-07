"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PaginationControls({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  // Calculate pagination values
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  
  // Handle pagination changes
  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize, 10);
    onPageSizeChange(size);
  };
  
  const goToNextPage = () => {
    if (hasNextPage) {
      onPageChange(currentPage + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (hasPrevPage) {
      onPageChange(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    onPageChange(page);
  };

  // Function to generate page number buttons - now with responsive handling
  const renderPageNumbers = () => {
    const pageNumbers = [];
    
    // Determine if we're in mobile view based on how many pages there are
    // For very large page counts, we'll use a more compact display
    const isCompactView = totalPages > 100;
    const maxPageButtons = isCompactView ? 1 : 3; // Show fewer buttons in compact mode
    
    // On mobile or with large page counts, just show current/total instead of numbers
    if (isCompactView) {
      return (
        <span className="text-xs font-medium px-1 whitespace-nowrap">
          {currentPage} / {totalPages}
        </span>
      );
    }
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    // First page button
    if (startPage > 1) {
      pageNumbers.push(
        <Button 
          key="first" 
          variant="outline" 
          size="sm" 
          className="h-6 w-6 text-xs hidden sm:inline-flex"
          onClick={() => goToPage(1)}
        >
          1
        </Button>
      );
      
      // Ellipsis if needed - hide on smaller screens
      if (startPage > 2) {
        pageNumbers.push(
          <span key="ellipsis1" className="px-1 text-xs hidden sm:inline-block">...</span>
        );
      }
    }
    
    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button 
          key={i} 
          variant={i === currentPage ? "default" : "outline"} 
          size="sm" 
          className="h-6 w-6 text-xs"
          onClick={() => goToPage(i)}
        >
          {i}
        </Button>
      );
    }
    
    // Last page button - hide on smaller screens
    if (endPage < totalPages) {
      // Ellipsis if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <span key="ellipsis2" className="px-1 text-xs hidden sm:inline-block">...</span>
        );
      }
      
      pageNumbers.push(
        <Button 
          key="last" 
          variant="outline" 
          size="sm" 
          className="h-6 w-6 text-xs hidden sm:inline-flex"
          onClick={() => goToPage(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }
    
    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-end w-full h-full">
      <div className="flex items-center gap-1">
        <Select 
          value={pageSize.toString()} 
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger className="w-[60px] h-6 text-xs">
            <SelectValue placeholder="12" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12</SelectItem>
            <SelectItem value="24">24</SelectItem>
            <SelectItem value="36">36</SelectItem>
            <SelectItem value="48">48</SelectItem>
            <SelectItem value="60">60</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Page numbers with responsive handling */}
        <div className="flex items-center gap-1 ml-1">
          {/* Previous button */}
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6" 
            disabled={!hasPrevPage}
            onClick={goToPrevPage}
            aria-label="Previous page"
          >
            <ChevronLeft size={12} />
          </Button>
          
          {/* Page numbers */}
          {renderPageNumbers()}
          
          {/* Next button */}
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6" 
            disabled={!hasNextPage}
            onClick={goToNextPage}
            aria-label="Next page"
          >
            <ChevronRight size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PaginationControls; 