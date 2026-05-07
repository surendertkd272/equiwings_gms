import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Button, Field, Input, Select, LinkButton } from "@/components/ui";
import { createHorseAction } from "./actions";

export default async function NewHorsePage() {
  const riders = await prisma.rider.findMany({ orderBy: { lastName: "asc" } });
  return (
    <div className="space-y-6">
      <PageTitle
        title="New horse"
        description="Register an equine passport. Heights stored as hands × 10 (e.g., 14.2hh = 142)."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { href: "/horses", label: "Horses" }, { label: "New" }]}
      />
      <Card className="max-w-3xl">
        <CardHeader title="Horse details" subtitle="Tent Pegging requires ≥142 (14.2hh) and 5+ years of age." />
        <form action={createHorseAction}>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="EFI Horse ID"><Input name="efiHorseId" required placeholder="EFI-H-211" /></Field>
              <Field label="Registered name"><Input name="registeredName" required /></Field>
              <Field label="Sex">
                <Select name="sex" defaultValue="Gelding">
                  <option value="Stallion">Stallion</option>
                  <option value="Mare">Mare</option>
                  <option value="Gelding">Gelding</option>
                </Select>
              </Field>
              <Field label="Date of birth"><Input name="dateOfBirth" type="date" required /></Field>
              <Field label="Height (hands × 10)" hint="14.2hh → 142 · 16.0hh → 160">
                <Input name="heightHandsX10" type="number" min={120} max={200} required defaultValue={160} />
              </Field>
              <Field label="Breed"><Input name="breed" placeholder="Indigenous · Warmblood · …" /></Field>
              <Field label="Microchip"><Input name="microchip" /></Field>
              <Field label="Owner">
                <Select name="ownerId" defaultValue="">
                  <option value="">—</option>
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Trainer">
                <Select name="trainerId" defaultValue="">
                  <option value="">—</option>
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Height cert on file">
                <label className="flex items-center gap-2 mt-2 text-sm">
                  <input name="heightCertOnFile" type="checkbox" /> Yes
                </label>
              </Field>
            </div>
            <div className="border-t border-ink-200 pt-4">
              <div className="text-xs text-ink-500 mb-2">Optional initial grade</div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Discipline">
                  <Select name="gradeDiscipline" defaultValue="">
                    <option value="">—</option>
                    <option value="Dressage">Dressage</option>
                    <option value="ShowJumping">Show Jumping</option>
                    <option value="Eventing">Eventing</option>
                    <option value="Endurance">Endurance</option>
                    <option value="TentPegging">Tent Pegging</option>
                  </Select>
                </Field>
                <Field label="Grade">
                  <Input name="gradeGrade" placeholder="Preliminary / Novice / GradeIII / Open …" />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <LinkButton href="/horses" variant="ghost">Cancel</LinkButton>
              <Button>Create horse</Button>
            </div>
          </CardBody>
        </form>
      </Card>
    </div>
  );
}
