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
  
  // Calculate displayed range for UI
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
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
    const pageNumbers = [];
    const maxPageButtons = 3; // Reduced from 5 to 3 for more compact layout
    
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
          className="h-6 w-6 text-xs"
          onClick={() => goToPage(1)}
        >
          1
        </Button>
      );
      
      // Ellipsis if needed
      if (startPage > 2) {
        pageNumbers.push(
          <span key="ellipsis1" className="px-1 text-xs">...</span>
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
    
    // Last page button
    if (endPage < totalPages) {
      // Ellipsis if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <span key="ellipsis2" className="px-1 text-xs">...</span>
        );
      }
      
      pageNumbers.push(
        <Button 
          key="last" 
          variant="outline" 
          size="sm" 
          className="h-6 w-6 text-xs"
          onClick={() => goToPage(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }
    
    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-between w-full h-full">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {totalItems > 0 
          ? `${startItem}-${endItem} of ${totalItems}` 
          : "No results"}
      </span>
      <div className="flex items-center gap-1">
        <Select 
          value={pageSize.toString()} 
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger className="w-[60px] h-6 text-xs">
            <SelectValue placeholder="25" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Page numbers */}
        <div className="hidden md:flex items-center gap-1">
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