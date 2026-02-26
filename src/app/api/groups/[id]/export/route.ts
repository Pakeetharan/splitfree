import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import {
  getGroupsCollection,
  getMembersCollection,
  getExpensesCollection,
  getSettlementsCollection,
} from "@/lib/mongodb/collections";
import { serializeDoc } from "@/lib/utils";
import { generateGroupXlsx } from "@/lib/export/xlsx-generator";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
    }

    const groupOid = new ObjectId(id);
    const userOid = new ObjectId(user.id);

    // Verify group exists and user is a member
    const groups = await getGroupsCollection();
    const group = await groups.findOne({ _id: groupOid, deletedAt: null });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const membersCol = await getMembersCollection();
    const membership = await membersCol.findOne({
      groupId: groupOid,
      userId: userOid,
      deletedAt: null,
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all members
    const memberDocs = await membersCol
      .find({ groupId: groupOid, deletedAt: null })
      .toArray();
    const members = memberDocs.map(serializeDoc);

    // Fetch all expenses (no pagination for export)
    const expensesCol = await getExpensesCollection();
    const expenseDocs = await expensesCol
      .find({ groupId: groupOid, deletedAt: null })
      .sort({ date: -1 })
      .toArray();
    const expenses = expenseDocs.map(serializeDoc);

    // Fetch all settlements
    const settlementsCol = await getSettlementsCollection();
    const settlementDocs = await settlementsCol
      .find({ groupId: groupOid, deletedAt: null })
      .sort({ date: -1 })
      .toArray();
    const settlements = settlementDocs.map(serializeDoc);

    // Generate workbook
    const xlsxBuffer = await generateGroupXlsx(
      { name: group.name, currency: group.currency },
      members,
      expenses,
      settlements,
    );

    // Sanitize filename
    const safeName = group.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = `${safeName}-expenses.xlsx`;

    return new Response(new Uint8Array(xlsxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": xlsxBuffer.length.toString(),
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[export]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
