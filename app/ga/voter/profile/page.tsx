"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VoterProfilePage() {
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Voter Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Voter Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section is under development. Soon you will be able to view and manage individual voter profiles here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 