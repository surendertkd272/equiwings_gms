import { Card, CardBody, CardHeader, PageTitle, Button, Field, Input, Select, LinkButton } from "@/components/ui";
import { createRiderAction } from "./actions";

export default function NewRiderPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-6">
      <PageTitle
        title="New rider"
        description="Add a registered athlete with a valid EFI ID."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { href: "/riders", label: "Riders" }, { label: "New" }]}
      />
      <Card className="max-w-3xl">
        <CardHeader title="Rider details" subtitle="EFI ID renewal must be on or after 01 Aug of the previous year." />
        <form action={createRiderAction}>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="EFI ID" hint="Unique national registration number">
                <Input name="efiId" required placeholder="EFI-IND-1010" />
              </Field>
              <Field label="Category">
                <Select name="category" defaultValue="Senior">
                  <option value="Senior">Senior</option>
                  <option value="YoungRider">Young Rider</option>
                  <option value="Junior">Junior</option>
                  <option value="ChildrenI">Children I</option>
                  <option value="ChildrenII">Children II</option>
                </Select>
              </Field>
              <Field label="First name"><Input name="firstName" required /></Field>
              <Field label="Last name"><Input name="lastName" required /></Field>
              <Field label="Date of birth"><Input name="dateOfBirth" type="date" required /></Field>
              <Field label="Gender">
                <Select name="gender" defaultValue="M">
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="X">X</option>
                </Select>
              </Field>
              <Field label="Unit / Club"><Input name="unitOrClub" placeholder="61 Cavalry · Embassy Riding School …" /></Field>
              <Field label="Email"><Input name="email" type="email" /></Field>
              <Field label="Phone"><Input name="phone" /></Field>
              <Field label="EFI ID renewed at" hint="01 Aug of the prior year is the deadline">
                <Input name="efiIdRenewedAt" type="date" required defaultValue={today} />
              </Field>
              <Field label="Passport number (foreign / NEC)"><Input name="passportNumber" /></Field>
              <Field label="Foreign rider">
                <label className="flex items-center gap-2 mt-2 text-sm">
                  <input name="isForeign" type="checkbox" /> Yes — needs NOC on file
                </label>
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <LinkButton href="/riders" variant="ghost">Cancel</LinkButton>
              <Button>Create rider</Button>
            </div>
          </CardBody>
        </form>
      </Card>
    </div>
  );
}
