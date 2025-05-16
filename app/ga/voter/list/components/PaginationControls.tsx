"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMobileView } from "@/hooks/useWindowSize";
import { cn } from "@/lib/utils";

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
  
  // Use the custom hook to detect mobile view
  const isMobileView = useMobileView();
  
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

  // Function to generate page number buttons
  const renderPageNumbers = () => {
    // Always show simplified view on mobile
    if (isMobileView) {
      return (
        <span className="text-xs font-medium px-1 whitespace-nowrap">
          {currentPage} / {totalPages}
        </span>
      );
    }
    
    const pageElements = []; // Changed from pageNumbers to pageElements for clarity
    const maxPageButtons = 3; 
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    // First page button
    if (startPage > 1) {
      pageElements.push(
        <span 
          key="first" 
          className="text-xs px-1 cursor-pointer hover:text-primary hover:underline"
          onClick={() => goToPage(1)}
        >
          1
        </span>
      );
      
      if (startPage > 2) {
        pageElements.push(
          <span key="ellipsis1" className="px-1 text-xs text-muted-foreground">...</span>
        );
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageElements.push(
        <span 
          key={i} 
          className={cn(
            "text-xs px-1 cursor-pointer hover:text-primary hover:underline",
            i === currentPage ? "font-bold text-primary" : "text-muted-foreground"
          )}
          onClick={() => goToPage(i)}
        >
          {i}
        </span>
      );
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageElements.push(
          <span key="ellipsis2" className="px-1 text-xs text-muted-foreground">...</span>
        );
      }
      pageElements.push(
        <span 
          key="last" 
          className="text-xs px-1 cursor-pointer hover:text-primary hover:underline"
          onClick={() => goToPage(totalPages)}
        >
          {totalPages}
        </span>
      );
    }
    
    return pageElements;
  };

  return (
    <div className="flex items-center justify-end w-full h-full">
      <div className="flex items-center gap-1">
        <Select 
          value={pageSize.toString()} 
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger className="w-[60px] h-6 text-xs">
            <SelectValue placeholder="24" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12</SelectItem>
            <SelectItem value="24">24</SelectItem>
            <SelectItem value="36">36</SelectItem>
            <SelectItem value="48">48</SelectItem>
            <SelectItem value="60">60</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Page numbers - now visible on all screen sizes */}
        <div className="flex items-center gap-1 mr-2">
          {renderPageNumbers()}
        </div>
        
        {/* Previous/Next buttons */}
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
  );
}

export default PaginationControls; 