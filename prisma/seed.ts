import { PrismaClient } from "@prisma/client";
import { TIME_ALLOWED_MS } from "../src/lib/scoring/tent-pegging";

const prisma = new PrismaClient();

async function main() {
  // Wipe in dependency order.
  await prisma.score.deleteMany();
  await prisma.run.deleteMany();
  await prisma.result.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.spareHorseDeclaration.deleteMany();
  await prisma.officialAssignment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.stallAssignment.deleteMany();
  await prisma.stall.deleteMany();
  await prisma.vetInspection.deleteMany();
  await prisma.vetDocument.deleteMany();
  await prisma.biosecurityAlert.deleteMany();
  await prisma.horseGrade.deleteMany();
  await prisma.horse.deleteMany();
  await prisma.waiver.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.rider.deleteMany();
  await prisma.official.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.feeSchedule.deleteMany();
  await prisma.officialNotice.deleteMany();
  await prisma.notification.deleteMany();

  // ── Riders ───────────────────────────────────────────────────────────────
  const riderSeed = [
    { efiId: "EFI-IND-1001", firstName: "Vikram", lastName: "Singh", dob: "1996-03-14", gender: "M", unit: "61 Cavalry", category: "Senior" },
    { efiId: "EFI-IND-1002", firstName: "Priya", lastName: "Sharma", dob: "1999-07-22", gender: "F", unit: "ASC Centre", category: "Senior" },
    { efiId: "EFI-IND-1003", firstName: "Arjun", lastName: "Kapoor", dob: "2002-01-09", gender: "M", unit: "RVC", category: "YoungRider" },
    { efiId: "EFI-IND-1004", firstName: "Meera", lastName: "Patil", dob: "2008-09-30", gender: "F", unit: "Embassy Riding School", category: "Junior" },
    { efiId: "EFI-IND-1005", firstName: "Rahul", lastName: "Gupta", dob: "1990-11-02", gender: "M", unit: "61 Cavalry", category: "Senior" },
    { efiId: "EFI-IND-1006", firstName: "Anaya", lastName: "Desai", dob: "1998-05-18", gender: "F", unit: "Bombay Riding Club", category: "Senior" },
    { efiId: "EFI-IND-1007", firstName: "Karan", lastName: "Malhotra", dob: "1995-12-01", gender: "M", unit: "Delhi Riding Club", category: "Senior" },
    { efiId: "EFI-IND-1008", firstName: "Saanvi", lastName: "Iyer", dob: "2010-04-12", gender: "F", unit: "Madras Equestrian Centre", category: "ChildrenI" },
  ];
  const riders = await Promise.all(
    riderSeed.map((r) =>
      prisma.rider.create({
        data: {
          efiId: r.efiId,
          firstName: r.firstName,
          lastName: r.lastName,
          dateOfBirth: new Date(r.dob),
          gender: r.gender,
          unitOrClub: r.unit,
          category: r.category,
          efiIdRenewedAt: new Date("2025-08-15"),
        },
      })
    )
  );
  const ridersByEfi = new Map(riders.map((r) => [r.efiId, r]));

  // ── Horses ───────────────────────────────────────────────────────────────
  const horseSeed = [
    { efi: "EFI-H-201", name: "Maharaja", sex: "Stallion", dob: "2017-04-12", height: 162, owner: "EFI-IND-1001" },
    { efi: "EFI-H-202", name: "Chetak", sex: "Gelding", dob: "2018-06-08", height: 158, owner: "EFI-IND-1001" },
    { efi: "EFI-H-203", name: "Ranthambore", sex: "Mare", dob: "2016-09-23", height: 165, owner: "EFI-IND-1002" },
    { efi: "EFI-H-204", name: "Sundari", sex: "Mare", dob: "2019-01-15", height: 152, owner: "EFI-IND-1002" },
    { efi: "EFI-H-205", name: "Silver Streak", sex: "Gelding", dob: "2017-11-30", height: 168, owner: "EFI-IND-1003" },
    { efi: "EFI-H-206", name: "Shyamla", sex: "Mare", dob: "2018-03-11", height: 160, owner: "EFI-IND-1004" },
    { efi: "EFI-H-207", name: "Bahadur", sex: "Stallion", dob: "2015-12-20", height: 170, owner: "EFI-IND-1005" },
    { efi: "EFI-H-208", name: "Kohinoor", sex: "Gelding", dob: "2017-07-04", height: 164, owner: "EFI-IND-1006" },
    { efi: "EFI-H-209", name: "Veer", sex: "Gelding", dob: "2016-02-19", height: 161, owner: "EFI-IND-1007" },
    { efi: "EFI-H-210", name: "Chandni", sex: "Mare", dob: "2020-08-08", height: 145, owner: "EFI-IND-1008" },
  ];
  const horses = await Promise.all(
    horseSeed.map((h) =>
      prisma.horse.create({
        data: {
          efiHorseId: h.efi,
          registeredName: h.name,
          sex: h.sex,
          dateOfBirth: new Date(h.dob),
          heightHandsX10: h.height,
          heightCertOnFile: true,
          ownerId: ridersByEfi.get(h.owner)?.id,
        },
      })
    )
  );
  const horsesByEfi = new Map(horses.map((h) => [h.efiHorseId, h]));

  // Grade records.
  const grades: Array<{ efi: string; discipline: string; grade: string }> = [
    { efi: "EFI-H-201", discipline: "TentPegging", grade: "Open" },
    { efi: "EFI-H-202", discipline: "TentPegging", grade: "Open" },
    { efi: "EFI-H-203", discipline: "Dressage", grade: "PrixStGeorges" },
    { efi: "EFI-H-204", discipline: "Dressage", grade: "Elementary" },
    { efi: "EFI-H-205", discipline: "ShowJumping", grade: "GradeI" },
    { efi: "EFI-H-206", discipline: "Dressage", grade: "Medium" },
    { efi: "EFI-H-207", discipline: "TentPegging", grade: "Open" },
    { efi: "EFI-H-208", discipline: "ShowJumping", grade: "GradeII" },
    { efi: "EFI-H-209", discipline: "TentPegging", grade: "Open" },
    { efi: "EFI-H-210", discipline: "Dressage", grade: "Preliminary" },
  ];
  for (const g of grades) {
    await prisma.horseGrade.create({
      data: {
        horseId: horsesByEfi.get(g.efi)!.id,
        discipline: g.discipline,
        grade: g.grade,
        merCount: 1,
        lastCompetedAt: new Date("2026-02-01"),
      },
    });
  }

  // ── Tournament + Events ──────────────────────────────────────────────────
  const nec = await prisma.tournament.create({
    data: {
      name: "National Equestrian Championships 2026",
      shortCode: "NEC2026",
      startDate: new Date("2026-05-10"),
      endDate: new Date("2026-05-20"),
      venue: "RVC Grounds, Meerut",
      isJNEC: false,
    },
  });

  const jnec = await prisma.tournament.create({
    data: {
      name: "Junior National Equestrian Championships 2026",
      shortCode: "JNEC2026",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-08"),
      venue: "Embassy International Riding School, Bengaluru",
      isJNEC: true,
    },
  });

  const events = await Promise.all([
    // Tent Pegging
    prisma.event.create({
      data: {
        tournamentId: nec.id, code: "TP-ILN", name: "Tent Pegging — Lance (Individual)",
        discipline: "TentPegging", isHCAllowed: false,
        speedMpm: 750, timeAllowedMs: TIME_ALLOWED_MS["TP-ILN"], rounds: 2,
      },
    }),
    prisma.event.create({
      data: {
        tournamentId: nec.id, code: "TP-ISW", name: "Tent Pegging — Sword (Individual)",
        discipline: "TentPegging", isHCAllowed: false,
        speedMpm: 750, timeAllowedMs: TIME_ALLOWED_MS["TP-ISW"], rounds: 2,
      },
    }),
    prisma.event.create({
      data: {
        tournamentId: nec.id, code: "TP-RPL", name: "Ring & Peg — Lance",
        discipline: "TentPegging", isHCAllowed: false,
        speedMpm: 685, timeAllowedMs: TIME_ALLOWED_MS["TP-RPL"], rounds: 1,
      },
    }),
    // Dressage
    prisma.event.create({
      data: {
        tournamentId: nec.id, code: "D-PSG", name: "Prix St-Georges",
        discipline: "Dressage", grade: "PrixStGeorges", isHCAllowed: true,
        rounds: 1,
      },
    }),
    prisma.event.create({
      data: {
        tournamentId: nec.id, code: "D-MED", name: "Medium Dressage",
        discipline: "Dressage", grade: "Medium", isHCAllowed: true,
        rounds: 1,
      },
    }),
    // Show Jumping
    prisma.event.create({
      data: {
        tournamentId: nec.id, code: "SJ-GP", name: "Grand Prix",
        discipline: "ShowJumping", grade: "GrandPrix",
        minHeightCm: 135, maxHeightCm: 150, maxSpreadCm: 170, speedMpmCourse: 375, rounds: 2,
      },
    }),
    prisma.event.create({
      data: {
        tournamentId: nec.id, code: "SJ-G2", name: "Grade II Normal",
        discipline: "ShowJumping", grade: "GradeII",
        minHeightCm: 120, maxHeightCm: 130, maxSpreadCm: 150, speedMpmCourse: 350, rounds: 2,
      },
    }),
    // JNEC
    prisma.event.create({
      data: {
        tournamentId: jnec.id, code: "J-DJR", name: "JNEC — Dressage Junior",
        discipline: "Dressage", grade: "Preliminary", isJunior: true, rounds: 1,
      },
    }),
  ]);

  const evByCode = new Map(events.map((e) => [e.code, e]));

  // ── Entries ──────────────────────────────────────────────────────────────
  // Tent Pegging entries
  const tpEntries: Array<{ event: string; rider: string; horse: string; start: number }> = [
    { event: "TP-ILN", rider: "EFI-IND-1001", horse: "EFI-H-201", start: 1 },
    { event: "TP-ILN", rider: "EFI-IND-1005", horse: "EFI-H-207", start: 2 },
    { event: "TP-ILN", rider: "EFI-IND-1007", horse: "EFI-H-209", start: 3 },
    { event: "TP-ILN", rider: "EFI-IND-1001", horse: "EFI-H-202", start: 4 },
    { event: "TP-ISW", rider: "EFI-IND-1001", horse: "EFI-H-201", start: 1 },
    { event: "TP-ISW", rider: "EFI-IND-1005", horse: "EFI-H-207", start: 2 },
    { event: "TP-RPL", rider: "EFI-IND-1001", horse: "EFI-H-201", start: 1 },
    { event: "TP-RPL", rider: "EFI-IND-1007", horse: "EFI-H-209", start: 2 },

    { event: "D-PSG", rider: "EFI-IND-1002", horse: "EFI-H-203", start: 1 },
    { event: "D-PSG", rider: "EFI-IND-1006", horse: "EFI-H-208", start: 2 },
    { event: "D-MED", rider: "EFI-IND-1002", horse: "EFI-H-204", start: 1 },
    { event: "D-MED", rider: "EFI-IND-1004", horse: "EFI-H-206", start: 2 },

    { event: "SJ-GP", rider: "EFI-IND-1003", horse: "EFI-H-205", start: 1 },
    { event: "SJ-GP", rider: "EFI-IND-1006", horse: "EFI-H-208", start: 2 },
    { event: "SJ-G2", rider: "EFI-IND-1003", horse: "EFI-H-205", start: 1 },
    { event: "SJ-G2", rider: "EFI-IND-1007", horse: "EFI-H-209", start: 2 },

    { event: "J-DJR", rider: "EFI-IND-1008", horse: "EFI-H-210", start: 1 },
    { event: "J-DJR", rider: "EFI-IND-1004", horse: "EFI-H-206", start: 2 },
  ];

  for (const e of tpEntries) {
    await prisma.entry.create({
      data: {
        eventId: evByCode.get(e.event)!.id,
        riderId: ridersByEfi.get(e.rider)!.id,
        horseId: horsesByEfi.get(e.horse)!.id,
        startNumber: e.start,
        paidAt: new Date(),
        feeMinor: 250000, // ₹2,500
      },
    });
  }

  // ── Officials ────────────────────────────────────────────────────────────
  await prisma.official.createMany({
    data: [
      { firstName: "Col. (Retd.) Ashok", lastName: "Verma", roles: "PGJ,TechDelegate", disciplines: "TentPegging", efiPanelId: "EFI-OFF-001" },
      { firstName: "Maj. Rajeev", lastName: "Bose", roles: "LaneJudge", disciplines: "TentPegging", efiPanelId: "EFI-OFF-002" },
      { firstName: "Capt. Sunita", lastName: "Rao", roles: "LaneJudge,Steward", disciplines: "TentPegging", efiPanelId: "EFI-OFF-003" },
      { firstName: "Dr. Anika", lastName: "Joshi", roles: "Vet", disciplines: "All", efiPanelId: "EFI-OFF-004" },
      { firstName: "Mrs. Ila", lastName: "Mukherjee", roles: "DressageJudge,PGJ", disciplines: "Dressage", efiPanelId: "EFI-OFF-005" },
      { firstName: "Mr. Sushant", lastName: "Kohli", roles: "DressageJudge", disciplines: "Dressage", efiPanelId: "EFI-OFF-006" },
      { firstName: "Mrs. Devika", lastName: "Nair", roles: "DressageJudge", disciplines: "Dressage", efiPanelId: "EFI-OFF-007" },
      { firstName: "Mr. Rohan", lastName: "Bhattacharya", roles: "Timer,Scorer", disciplines: "TentPegging", efiPanelId: "EFI-OFF-008" },
    ],
  });

  // ── Stalls ───────────────────────────────────────────────────────────────
  const stallList: Array<{ block: string; stallNumber: string; isStallion?: boolean }> = [];
  for (let n = 1; n <= 6; n++) stallList.push({ block: "Block A (Stallion)", stallNumber: `A-${n}`, isStallion: true });
  for (let n = 1; n <= 8; n++) stallList.push({ block: "Block B", stallNumber: `B-${n}` });
  for (let n = 1; n <= 8; n++) stallList.push({ block: "Block C", stallNumber: `C-${n}` });
  const createdStalls = await Promise.all(
    stallList.map((s) => prisma.stall.create({ data: s }))
  );
  // Pre-assign a few horses to stalls so the map shows occupancy on load.
  const stallA1 = createdStalls.find((s) => s.stallNumber === "A-1")!;
  const stallA2 = createdStalls.find((s) => s.stallNumber === "A-2")!;
  const stallB1 = createdStalls.find((s) => s.stallNumber === "B-1")!;
  const stallB2 = createdStalls.find((s) => s.stallNumber === "B-2")!;
  const stallB3 = createdStalls.find((s) => s.stallNumber === "B-3")!;
  await prisma.stallAssignment.createMany({
    data: [
      { stallId: stallA1.id, horseId: horsesByEfi.get("EFI-H-201")!.id, groomName: "Ramesh K." },
      { stallId: stallA2.id, horseId: horsesByEfi.get("EFI-H-207")!.id, groomName: "Sandeep T." },
      { stallId: stallB1.id, horseId: horsesByEfi.get("EFI-H-203")!.id, groomName: "Anil P." },
      { stallId: stallB2.id, horseId: horsesByEfi.get("EFI-H-205")!.id, groomName: "Mahesh R." },
      { stallId: stallB3.id, horseId: horsesByEfi.get("EFI-H-208")!.id, groomName: "Suresh M." },
    ],
  });

  // ── Vet docs (sample) ────────────────────────────────────────────────────
  const today = new Date();
  const inAYear = new Date(today); inAYear.setFullYear(inAYear.getFullYear() + 1);
  for (const h of horses.slice(0, 6)) {
    await prisma.vetDocument.createMany({
      data: [
        { horseId: h.id, type: "Coggins", issuedOn: today, expiresOn: inAYear, verifiedAt: today },
        { horseId: h.id, type: "Influenza", issuedOn: today, expiresOn: inAYear, verifiedAt: today },
      ],
    });
  }

  // ── Notice board (sample) ────────────────────────────────────────────────
  await prisma.officialNotice.createMany({
    data: [
      { title: "Welcome to NEC 2026", body: "Course walks open at 0700 daily. Vet trot-ups begin 0800.", category: "Schedule" },
      { title: "Lightning hold protocol", body: "If lightning is detected within 8 km, all outdoor activity pauses for 30 min after the last strike.", category: "Weather" },
      { title: "Tent Pegging track ready", body: "Track A inspected and certified per ITPF specifications. 4 lanes, 80m.", category: "Track" },
    ],
  });

  // ── Sample invoice ───────────────────────────────────────────────────────
  await prisma.invoice.create({
    data: {
      riderId: riders[0].id,
      totalMinor: 750000, // ₹7,500
      status: "Paid",
      paidAt: new Date(),
      lineItems: {
        create: [
          { itemCode: "BASE_ENTRY", description: "TP-ILN entry", quantity: 1, unitMinor: 250000, totalMinor: 250000 },
          { itemCode: "BASE_ENTRY", description: "TP-ISW entry", quantity: 1, unitMinor: 250000, totalMinor: 250000 },
          { itemCode: "BASE_ENTRY", description: "TP-RPL entry", quantity: 1, unitMinor: 250000, totalMinor: 250000 },
        ],
      },
    },
  });

  // ── A few sample TP runs to populate leaderboard out of the box ──────────
  const ilnEvent = evByCode.get("TP-ILN")!;
  const ilnEntries = await prisma.entry.findMany({ where: { eventId: ilnEvent.id }, include: { rider: true } });
  // Hard-code two scored runs each so leaderboard has data on first load.
  const ilnSamples = [
    { startNumber: 1, runs: [
      { time: 6280, targets: ["Carry", "Carry", "Carry"] },
      { time: 6300, targets: ["Carry", "Carry", "Draw"] },
    ]},
    { startNumber: 2, runs: [
      { time: 6440, targets: ["Carry", "Draw", "Strike"] },
      { time: 6510, targets: ["Carry", "Carry", "Miss"] },
    ]},
    { startNumber: 3, runs: [
      { time: 6700, targets: ["Strike", "Carry", "Miss"] },
      { time: 6800, targets: ["Carry", "Strike", "Strike"] },
    ]},
  ];

  for (const s of ilnSamples) {
    const entry = ilnEntries.find((e) => e.startNumber === s.startNumber);
    if (!entry) continue;
    let totalRaw = 0;
    let totalAfterPen = 0;
    let totalTimePen = 0;
    for (let i = 0; i < s.runs.length; i++) {
      const r = s.runs[i];
      const pegSize = i === 0 ? 6 : 4;
      const targetPoints = r.targets.reduce((acc, t) => acc + (t === "Carry" ? 6 : t === "Draw" ? 4 : t === "Strike" ? 2 : 0), 0);
      const overMs = r.time - 6400;
      const timePen = overMs <= 0 ? 0 : Math.ceil(overMs / 1000) * 0.5;
      totalRaw += targetPoints;
      totalTimePen += timePen;
      totalAfterPen += Math.max(0, targetPoints - timePen);
      await prisma.run.create({
        data: {
          eventId: ilnEvent.id,
          entryId: entry.id,
          roundNo: i + 1,
          runNo: 1,
          pegSizeCm: pegSize,
          recordedTimeMs: r.time,
          isCompleted: true,
          finishedAt: new Date(),
          scores: {
            create: [
              ...r.targets.map((t) => ({
                entryId: entry.id,
                kind: "TPTarget" as const,
                targetType: "Peg",
                targetResult: t,
                pointsAwarded: t === "Carry" ? 6 : t === "Draw" ? 4 : t === "Strike" ? 2 : 0,
              })),
              { entryId: entry.id, kind: "TimePenalty" as const, pointsAwarded: -timePen },
            ],
          },
        },
      });
    }
    await prisma.result.create({
      data: {
        entryId: entry.id,
        totalRaw,
        totalAfterPen,
        timePenalty: totalTimePen,
        status: "Completed",
        meetsMER: totalAfterPen >= 24,
        meetsMedal: totalAfterPen >= 24,
      },
    });
  }

  console.log("Seed complete.");
  console.log(`  Riders: ${riders.length}`);
  console.log(`  Horses: ${horses.length}`);
  console.log(`  Events: ${events.length}`);
  console.log(`  Tournaments: NEC2026, JNEC2026`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
