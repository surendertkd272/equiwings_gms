import { Card, CardBody, CardHeader, PageTitle, Button, Field, Input, LinkButton } from "@/components/ui";
import { createTournamentAction } from "./actions";

export default function NewTournamentPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="New tournament"
        description="Create an NEC, JNEC, or EFI-approved tournament."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { href: "/tournaments", label: "Tournaments" }, { label: "New" }]}
      />
      <Card className="max-w-2xl">
        <CardHeader title="Tournament details" />
        <form action={createTournamentAction}>
          <CardBody className="space-y-4">
            <Field label="Name"><Input name="name" required placeholder="National Equestrian Championships 2027" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Short code" hint="Used as identifier"><Input name="shortCode" required placeholder="NEC2027" /></Field>
              <Field label="Venue"><Input name="venue" placeholder="RVC Grounds, Meerut" /></Field>
              <Field label="Start date"><Input name="startDate" type="date" required /></Field>
              <Field label="End date"><Input name="endDate" type="date" required /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isJNEC" /> Junior NEC (JNEC)
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <LinkButton href="/tournaments" variant="ghost">Cancel</LinkButton>
              <Button>Create tournament</Button>
            </div>
          </CardBody>
        </form>
      </Card>
    </div>
  );
}
