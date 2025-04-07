import { connectDB } from "@/lib/mongodb";
import Registration from "@/models/Registration";
import { NextResponse } from "next/server";

// GET handler with optional event filtering
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const event = searchParams.get("event");

  try {
    await connectDB();

    let data;
    if (event) {
      data = await Registration.find({ event });
    } else {
      data = await Registration.find({});
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
  }
}

// DELETE handler using query parameter for ID
export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await Registration.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting registration:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

// ✅ PUT handler for updating a registration
export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, participants } = body;

    if (!id || !participants) {
      return NextResponse.json({ success: false, error: "Missing data" }, { status: 400 });
    }

    const updated = await Registration.findByIdAndUpdate(
      id,
      { participants },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
