
import { findOption, questionsFor, SKIPPED } from "./clues.js";

export const VERDICTS = [
  { value: "still-useful", label: "Still useful", band: 0 },
  { value: "partly-useful", label: "Partly useful", band: 1 },
  { value: "unusable", label: "Completely unusable", band: 2 },
  { value: "not-sure", label: "Not sure", band: null }
];

const VERDICT_BY_VALUE = new Map(VERDICTS.map(v => [v.value, v]));

export function verdictLabel(value) {
  return VERDICT_BY_VALUE.get(value)?.label || "Not recorded";
}

const BAND_TEXT = [
  "Most of what you looked at still seems sound.",
  "Some of what you looked at seems sound, and some of it does not.",
  "Most of what you looked at seems to have gone."
];

const TENTATIVE_TEXT = "There was not much to go on, so this stays a guess.";

/** Band a mean weight into 0, 1 or 2. */
function bandOf(mean) {
  if (mean < 2 / 3) return 0;
  if (mean < 4 / 3) return 1;
  return 2;
}

/**
 * Turn the recorded answers into the site's reasoning.
 *
 * @param {object} input
 * @param {string[]} input.problems    chosen problem ids (may be ["not-sure"])
 * @param {Array<string|null>} input.answers  one value per asked question, in order
 * @returns {{conclusion: string, band: number|null, lowInformation: boolean,
 *            dangerFlag: boolean, uncertainty: string[], answered: object[]}}
 */
export function reason({ problems = [], answers = [] } = {}) {
  const questions = questionsFor(problems);
  const uncertainty = [];
  const answered = [];
  let dangerFlag = false;

  if (problems.includes("not-sure") || problems.length === 0) {
    uncertainty.push("suspected problem");
  }

  questions.forEach((question, index) => {
    const value = answers[index];
    const option = findOption(question, value);
    if (option?.danger) dangerFlag = true;

    if (value === SKIPPED || value == null) {
      uncertainty.push(`clue ${index + 1}`);
      return;
    }
    if (!option || option.weight == null) {
      // "Not sure" is a real answer, but it carries no weight for the reveal.
      uncertainty.push(`clue ${index + 1}`);
      return;
    }
    answered.push({ question, option });
  });

  // US-1.3: skipping every question is a supported path. The flow continues on
  // the suspected problem alone, flagged low-information.
  const lowInformation = answered.length === 0;
  if (lowInformation) {
    return {
      conclusion: TENTATIVE_TEXT,
      band: null,
      lowInformation: true,
      dangerFlag,
      uncertainty,
      answered
    };
  }

  const mean = answered.reduce((sum, entry) => sum + entry.option.weight, 0) / answered.length;
  const band = bandOf(mean);
  const thin = answered.length === 1;

  return {
    conclusion: thin ? `${BAND_TEXT[band]} Only one clue was answered, so this stays a guess.` : BAND_TEXT[band],
    band,
    lowInformation: thin,
    dangerFlag,
    uncertainty,
    answered
  };
}

/**
 * The comparison shown beside the child's own verdict.
 *
 * When the two differ, this names the single clue that pulls the other way and
 * stops. It never states a preference between them: several of these judgements
 * have more than one defensible answer.
 */
export function compare(verdict, reasoning) {
  const verdictBand = VERDICT_BY_VALUE.get(verdict)?.band ?? null;

  if (verdictBand === null || reasoning.band === null) {
    return {
      differs: false,
      note: "You said you were not sure, so there is nothing to line up yet.",
      clue: null
    };
  }

  if (verdictBand === reasoning.band) {
    return {
      differs: false,
      note: "Your thinking and the clues line up.",
      clue: null
    };
  }

  // The clue that pulls the other way is the answered clue furthest from the
  // band the child chose.
  const pulling = [...reasoning.answered]
    .sort((a, b) => Math.abs(b.option.weight - verdictBand) - Math.abs(a.option.weight - verdictBand))[0];

  return {
    differs: true,
    note: "Your thinking and the clues point different ways.",
    clue: pulling
      ? { question: pulling.question.text, answer: pulling.option.label }
      : null
  };
}
