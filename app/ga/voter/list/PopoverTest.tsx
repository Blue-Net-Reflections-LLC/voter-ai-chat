"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * A simple component to test just the Popover functionality
 */
export const PopoverTest: React.FC = () => {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Popover Test</h3>
      
      {/* Test 1: Basic Popover with Button trigger */}
      <div className="mb-6 p-4 border rounded">
        <h4 className="text-xs font-medium mb-2">Test 1: Button Trigger</h4>
        <Popover>
          <PopoverTrigger>
            <Button variant="outline">Click me to open popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-2">
              <h4 className="font-medium">Popover Content</h4>
              <p className="text-sm text-muted-foreground">
                This is a basic popover with a button trigger.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Test 2: Controlled Popover with Input and asChild */}
      <div className="mb-6 p-4 border rounded">
        <h4 className="text-xs font-medium mb-2">Test 2: Input with asChild (controlled)</h4>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Input 
              placeholder="Click or focus me to open popover..." 
              onFocus={() => setOpen(true)}
              className="w-full"
            />
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-2">
              <h4 className="font-medium">Popover from Input</h4>
              <p className="text-sm text-muted-foreground">
                This tests the asChild pattern with an Input as trigger.
              </p>
              <Button size="sm" onClick={() => setOpen(false)}>Close</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Test 3: Just a standard input for comparison */}
      <div className="mb-6 p-4 border rounded">
        <h4 className="text-xs font-medium mb-2">Test 3: Regular Input (for comparison)</h4>
        <Input 
          placeholder="Standard input (no popover)..." 
          className="w-full"
        />
      </div>
    </div>
  );
}; 