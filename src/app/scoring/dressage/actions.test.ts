import { recordDressageAction } from "@/app/scoring/dressage/actions";
import { prisma } from "@/lib/db";
import { describe, it, expect, beforeAll } from "vitest";

describe("recordDressageAction", () => {
  it("should record a dressage score", async () => {
    const event = await prisma.event.findFirst({ where: { discipline: "Dressage" }, include: { entries: true } });
    if (!event || event.entries.length === 0) {
      console.log("No dressage event/entries found for test");
      return;
    }

    const formData = new FormData();
    formData.append("eventId", event.id);
    formData.append("entryId", event.entries[0].id);
    formData.append("errorsOfCourse", "0");
    formData.append("judgeCount", "1");
    formData.append("judges[0].name", "Test Judge");
    formData.append("judges[0].movements[0].movementNo", "1");
    formData.append("judges[0].movements[0].coefficient", "1");
    formData.append("judges[0].movements[0].mark", "8");

    const result = await recordDressageAction(formData);
    expect(result).toHaveProperty("ok", true);
  });
});
