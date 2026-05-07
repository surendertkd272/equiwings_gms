import { Card, CardBody, CardHeader, PageTitle, Button, Field, Input, LinkButton } from "@/components/ui";
import { createOfficialAction } from "./actions";

export default function NewOfficialPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="New official"
        description="Add a panel official, judge, vet, timer, scorer, or steward."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { href: "/officials", label: "Officials" }, { label: "New" }]}
      />
      <Card className="max-w-2xl">
        <CardHeader title="Official details" subtitle="At NEC, no jury member may be from the organising entity." />
        <form action={createOfficialAction}>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="First name"><Input name="firstName" required /></Field>
              <Field label="Last name"><Input name="lastName" required /></Field>
              <Field label="EFI Panel ID"><Input name="efiPanelId" placeholder="EFI-OFF-009" /></Field>
              <Field label="Email"><Input name="email" type="email" /></Field>
              <Field label="Disciplines (CSV)"><Input name="disciplines" placeholder="Dressage,ShowJumping" /></Field>
              <Field label="Roles (CSV)" hint="PGJ, TechDelegate, DressageJudge, LaneJudge, Vet, Medical, Timer, Scorer, Steward, Scribe">
                <Input name="roles" placeholder="DressageJudge,Steward" />
              </Field>
              <Field label="Organising entity (if any)"><Input name="organisingEntity" placeholder="61 Cavalry / RVC / —" /></Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <LinkButton href="/officials" variant="ghost">Cancel</LinkButton>
              <Button>Create official</Button>
            </div>
          </CardBody>
        </form>
      </Card>
    </div>
  );
}
