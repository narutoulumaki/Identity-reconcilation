import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Bitespeed Identity Reconciliation API",
    endpoints: {
      identify: "POST /identify"
    }
  });
});

app.post("/identify", async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    const emailStr = email ? String(email) : null;
    const phone = phoneNumber ? String(phoneNumber) : null;

    if (!emailStr && !phone) {
      return res.status(400).json({ error: "Need at least email or phoneNumber" });
    }

    // find all contacts that match by email or phone
    const whereConditions: any[] = [];
    if (emailStr) whereConditions.push({ email: emailStr });
    if (phone) whereConditions.push({ phoneNumber: phone });

    const matchedContacts = await prisma.contact.findMany({
      where: { OR: whereConditions },
    });

    // no match -> new primary contact
    if (matchedContacts.length === 0) {
      const newContact = await prisma.contact.create({
        data: {
          email: emailStr,
          phoneNumber: phone,
          linkPrecedence: "primary",
        },
      });

      return res.status(200).json({
        contact: {
          primaryContatctId: newContact.id,
          emails: emailStr ? [emailStr] : [],
          phoneNumbers: phone ? [phone] : [],
          secondaryContactIds: [],
        },
      });
    }

    // figure out which primary contacts are involved
    const primaryIds = new Set<number>();
    for (const c of matchedContacts) {
      if (c.linkPrecedence === "primary") {
        primaryIds.add(c.id);
      } else if (c.linkedId) {
        primaryIds.add(c.linkedId);
      }
    }

    const primaryContacts = await prisma.contact.findMany({
      where: { id: { in: Array.from(primaryIds) } },
      orderBy: { createdAt: "asc" },
    });

    // oldest primary wins
    const primaryContact = primaryContacts[0];

    // if we matched contacts from multiple primary groups, merge them
    if (primaryContacts.length > 1) {
      const otherPrimaryIds = primaryContacts.slice(1).map((c) => c.id);

      // turn the other primaries into secondaries
      await prisma.contact.updateMany({
        where: { id: { in: otherPrimaryIds } },
        data: {
          linkedId: primaryContact.id,
          linkPrecedence: "secondary",
        },
      });

      // re-link their secondaries to the winning primary
      await prisma.contact.updateMany({
        where: { linkedId: { in: otherPrimaryIds } },
        data: {
          linkedId: primaryContact.id,
        },
      });
    }

    // get all contacts in this group
    let allContacts = await prisma.contact.findMany({
      where: {
        OR: [{ id: primaryContact.id }, { linkedId: primaryContact.id }],
      },
      orderBy: { createdAt: "asc" },
    });

    // check if the request brings any new info
    const existingEmails = new Set(allContacts.map((c) => c.email).filter(Boolean));
    const existingPhones = new Set(allContacts.map((c) => c.phoneNumber).filter(Boolean));

    const hasNewEmail = emailStr && !existingEmails.has(emailStr);
    const hasNewPhone = phone && !existingPhones.has(phone);

    if (hasNewEmail || hasNewPhone) {
      await prisma.contact.create({
        data: {
          email: emailStr,
          phoneNumber: phone,
          linkedId: primaryContact.id,
          linkPrecedence: "secondary",
        },
      });

      // re-fetch after creating the new secondary
      allContacts = await prisma.contact.findMany({
        where: {
          OR: [{ id: primaryContact.id }, { linkedId: primaryContact.id }],
        },
        orderBy: { createdAt: "asc" },
      });
    }

    // build response — primary's email and phone should be first
    const emails: string[] = [];
    const phoneNumbers: string[] = [];
    const secondaryContactIds: number[] = [];

    for (const c of allContacts) {
      if (c.email && !emails.includes(c.email)) emails.push(c.email);
      if (c.phoneNumber && !phoneNumbers.includes(c.phoneNumber)) phoneNumbers.push(c.phoneNumber);
      if (c.id !== primaryContact.id) secondaryContactIds.push(c.id);
    }

    return res.status(200).json({
      contact: {
        primaryContatctId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
