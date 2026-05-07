// Minimum horse age per discipline/grade (Module 2.1).

export type Discipline = "Dressage" | "ShowJumping" | "Eventing" | "Endurance" | "TentPegging";

export interface MinAgeKey {
  discipline: Discipline;
  grade?: string;
}

/** Returns the minimum age (years) the horse must be on the date of competition. */
export function minHorseAge({ discipline, grade }: MinAgeKey): number {
  switch (discipline) {
    case "Dressage": {
      switch (grade) {
        case "Preliminary": return 4;
        case "Elementary": return 5;
        case "Medium":
        case "AdvancedMedium":
        case "Advanced": return 6;
        case "PrixStGeorges":
        case "IntermediateI": return 7;
        default: return 4;
      }
    }
    case "ShowJumping": {
      switch (grade) {
        case "Preliminary": return 4;
        case "Novice":
        case "GradeIII": return 5;
        case "GradeII":
        case "GradeI": return 6;
        case "GrandPrix": return 7;
        default: return 4;
      }
    }
    case "Eventing": return 4;
    case "Endurance": return 5;
    case "TentPegging": return 5;
  }
}

export function ageInYearsAt(dob: Date, when: Date): number {
  const ms = when.getTime() - dob.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

export function isHorseOldEnough(args: {
  horseDob: Date;
  competitionDate: Date;
  discipline: Discipline;
  grade?: string;
}): boolean {
  const min = minHorseAge({ discipline: args.discipline, grade: args.grade });
  return ageInYearsAt(args.horseDob, args.competitionDate) >= min;
}

// Tent Pegging requires minimum 14.2 hands unshod (10mm shoe allowance).
// Stored as hands * 10 (e.g. 142). Allow 4mm equivalent? Doc says 10mm allowance for shoes
// → if measured shod, deduct 0.1 hand (~10mm). Min still 14.2 effective.
export const TP_MIN_HANDS_X10 = 142;

export function isHorseTallEnoughForTentPegging(heightHandsX10: number, measuredShod = false): boolean {
  // 10mm ≈ 1 cm ≈ 0.1 hand. If measured shod, deduct 1 from heightHandsX10 effectively.
  const effective = measuredShod ? heightHandsX10 - 1 : heightHandsX10;
  return effective >= TP_MIN_HANDS_X10;
}

// JNEC age category — calculated as of 01 Jan of the competition year, valid until 31 Dec.
export type JuniorCategory = "ChildrenII" | "ChildrenI" | "Junior" | "YoungRider";

/** Mock category resolver — bands are illustrative; real bands come from EFI annexes. */
export function juniorCategoryFor(birthDate: Date, competitionYear: number): JuniorCategory | "Senior" {
  const refDate = new Date(Date.UTC(competitionYear, 0, 1));
  const ageYears = ageInYearsAt(birthDate, refDate);
  if (ageYears < 12) return "ChildrenII";
  if (ageYears < 14) return "ChildrenI";
  if (ageYears < 18) return "Junior";
  if (ageYears < 21) return "YoungRider";
  return "Senior";
}
