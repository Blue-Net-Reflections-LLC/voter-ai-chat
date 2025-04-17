"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Voter } from '../types';

interface VoterTableProps {
  voters: Voter[];
  isLoading?: boolean;
}

export function VoterTable({ voters, isLoading = false }: VoterTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading voters...
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">
            <Button variant="ghost" size="sm" disabled>
              ID <ArrowUpDown size={12} className="ml-1 inline"/>
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" size="sm" disabled>
              Full Name <ArrowUpDown size={12} className="ml-1 inline"/>
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" size="sm" disabled>
              County <ArrowUpDown size={12} className="ml-1 inline"/>
            </Button>
          </TableHead>
          <TableHead className="text-right">
            <Button variant="ghost" size="sm" disabled>
              Status <ArrowUpDown size={12} className="ml-1 inline"/>
            </Button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {voters.length > 0 ? (
          voters.map((voter) => (
            <TableRow key={voter.id}>
              <TableCell className="font-mono text-xs">
                <a href={`/ga/voter/profile/${voter.id}`} className="text-blue-600 hover:underline">
                  {voter.id}
                </a>
              </TableCell>
              <TableCell className="font-medium">{voter.name}</TableCell>
              <TableCell>{voter.county}</TableCell>
              <TableCell className="text-right">{voter.status}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
              No voters found matching your criteria
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default VoterTable; 