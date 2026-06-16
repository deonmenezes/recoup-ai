// Application handoff (PRD §7.7). In-memory lead capture — a hackathon doesn't
// need a real DB, and we explicitly DON'T build a utility integration.

import { NextResponse } from "next/server";
import type { ApplicationLead, PropertyType } from "@/lib/types";

// Module-scoped store. Resets on server restart — fine for a demo.
const leads: ApplicationLead[] = [];

const VALID_TYPES: PropertyType[] = ["new_build", "land", "adu", "load_upgrade"];

interface LeadRequest {
  estimateId?: string;
  name?: string;
  email?: string;
  phone?: string;
  propertyType?: PropertyType;
}

export async function POST(request: Request) {
  let body: LeadRequest;
  try {
    body = (await request.json()) as LeadRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { estimateId, name, email, phone, propertyType } = body;

  if (!name || !email || !phone || !propertyType) {
    return NextResponse.json(
      { error: "name, email, phone, and propertyType are required" },
      { status: 400 }
    );
  }
  if (!VALID_TYPES.includes(propertyType)) {
    return NextResponse.json({ error: "Invalid propertyType" }, { status: 400 });
  }

  const lead: ApplicationLead = {
    estimateId: estimateId ?? "unknown",
    name,
    email,
    phone,
    propertyType,
    submittedAt: new Date().toISOString(),
  };
  leads.push(lead);

  return NextResponse.json({ ok: true, confirmation: `GP-${leads.length.toString().padStart(4, "0")}` });
}

export async function GET() {
  return NextResponse.json({ count: leads.length, leads });
}
