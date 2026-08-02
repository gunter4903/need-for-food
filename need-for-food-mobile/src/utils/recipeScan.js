import TextRecognition from '@react-native-ml-kit/text-recognition';

const INGREDIENTS_HEADER = /^ingr[ée]dients?\b/i;
const STEPS_HEADER = /^(pr[ée]paration|instructions?|[ée]tapes?( de (la )?pr[ée]paration)?|marche\s*à\s*suivre)\b/i;

const SERVINGS_LINE = /^(?:pour\s+)?(\d+)\s*(?:personnes?|portions?|parts?|pers\.?)\s*:?$/i;
const SERVINGS_INLINE = /(\d+)\s*(?:personnes?|portions?|parts?|pers\.?)/i;

const MIN_LINE_LENGTH = 3;

const QUANTITY = /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*/;

const UNIT_WORDS = [
    'kilogrammes', 'kilogramme', 'kg',
    'grammes', 'gramme', 'gr', 'g',
    'milligrammes', 'milligramme', 'mg',
    'centilitres', 'centilitre', 'cl',
    'millilitres', 'millilitre', 'ml',
    'décilitres', 'décilitre', 'dl',
    'litres', 'litre', 'l',
    'cuillères à soupe', 'cuillère à soupe', 'cuillères à café', 'cuillère à café',
    'c. à s.', 'c à s', 'càs',
    'c. à c.', 'c à c', 'càc',
    'pincées', 'pincée',
    'verres', 'verre',
    'tasses', 'tasse',
    'gousses', 'gousse',
    'tranches', 'tranche',
    'bottes', 'botte',
    'sachets', 'sachet',
    'boîtes', 'boîte', 'boites', 'boite',
    'paquets', 'paquet',
    'branches', 'branche',
    'feuilles', 'feuille',
    'pièces', 'pièce',
    'unités', 'unité',
    'pots', 'pot',
];

const NOT_FOLLOWED_BY_LETTER = '(?![a-zà-ÿ])';

const UNIT_PATTERN = new RegExp(
    `^(${UNIT_WORDS
        .slice()
        .sort((a, b) => b.length - a.length)
        .map((word) => word.replace(/\./g, '\\.').replace(/\s+/g, '\\s+'))
        .join('|')})${NOT_FOLLOWED_BY_LETTER}`,
    'i'
);

const LEADING_DE = /^(?:de\s+|d')/i;

const STEP_VERB_PATTERN = new RegExp(
    '^(ajout(er|ez)|m[ée]lang(er|ez)|vers(er|ez)|cui(re|sez)|pr[ée]chauff(er|ez)|couvr(ir|ez)|batt(re|ez)|' +
        "incorpor(er|ez)|fait(e|es)|laiss(er|ez)|plac(er|ez)|[ée]tal(er|ez)|saupoudr(er|ez)|r[ée]serv(er|ez)|" +
        'd[ée]coup(er|ez)|hach(er|ez)|assaisonn(er|ez)|dispos(er|ez)|r[ée]part(ir|issez)|d[ée]moul(er|ez)|' +
        `enfourn(er|ez)|retir(er|ez)|ajust(er|ez)|remu(er|ez))${NOT_FOLLOWED_BY_LETTER}`,
    'i'
);

const LIST_MARKER = /^\s*(?:[-•*]|\d+[.):])\s*/;
const SENTENCE_END = /[.!?…]$/;

function stripListMarker(line) {
    return line.replace(LIST_MARKER, '').trim();
}

function hasListMarker(line) {
    return LIST_MARKER.test(line);
}

function isServingsOnlyLine(line) {
    return SERVINGS_LINE.test(line);
}

function isHeaderLine(line) {
    return INGREDIENTS_HEADER.test(line) || STEPS_HEADER.test(line);
}

function extractServings(lines) {
    for (const line of lines) {
        const match = line.match(SERVINGS_INLINE);
        if (match) return match[1];
    }
    return '';
}

function isNumberedStepDisguisedAsQuantity(line) {
    const cleaned = stripListMarker(line);
    const quantityMatch = cleaned.match(QUANTITY);
    if (!quantityMatch) return false;
    const rest = cleaned.slice(quantityMatch[0].length).trim();
    return STEP_VERB_PATTERN.test(rest);
}

function parseIngredientLine(line) {
    const cleaned = stripListMarker(line);

    const quantityMatch = cleaned.match(QUANTITY);
    if (!quantityMatch) {
        return { name: cleaned, quantity: '', unit: '' };
    }

    const quantity = quantityMatch[1].replace(',', '.');
    let rest = cleaned.slice(quantityMatch[0].length).trim();

    let unit = '';
    const unitMatch = rest.match(UNIT_PATTERN);
    if (unitMatch) {
        unit = unitMatch[1];
        rest = rest.slice(unitMatch[0].length).trim();
    }

    rest = rest.replace(LEADING_DE, '').trim();

    return { name: rest, quantity, unit };
}

function groupStepLines(lines) {
    const steps = [];
    let current = '';

    for (const rawLine of lines) {
        const text = stripListMarker(rawLine);
        if (!text) continue;

        const startsNewStep =
            !current || hasListMarker(rawLine) || SENTENCE_END.test(current) || STEP_VERB_PATTERN.test(text);

        if (startsNewStep) {
            if (current) steps.push(current);
            current = text;
        } else {
            current = `${current} ${text}`;
        }
    }
    if (current) steps.push(current);
    return steps;
}

function splitByQuantity(lines) {
    return {
        ingredientLines: lines.filter((l) => QUANTITY.test(stripListMarker(l))),
        stepLines: lines.filter((l) => !QUANTITY.test(stripListMarker(l))),
    };
}

export function parseRecipeText(rawText, { scope = 'all' } = {}) {
    const rawLines = String(rawText || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

    if (rawLines.length === 0) {
        return { title: '', servings: '', ingredients: [], steps: [] };
    }

    const servings = extractServings(rawLines);

    if (scope === 'ingredients' || scope === 'steps') {
        const lines = rawLines.filter(
            (l) => stripListMarker(l).length >= MIN_LINE_LENGTH && !isServingsOnlyLine(l) && !isHeaderLine(l)
        );
        return scope === 'ingredients'
            ? { title: '', servings, ingredients: lines.map(parseIngredientLine).filter((i) => i.name), steps: [] }
            : { title: '', servings, ingredients: [], steps: groupStepLines(lines) };
    }

    const title = rawLines[0];

    const bodySource = rawLines
        .slice(1)
        .filter((l) => stripListMarker(l).length >= MIN_LINE_LENGTH && !isServingsOnlyLine(l));

    const ingredientsHeaderIndex = bodySource.findIndex((l) => INGREDIENTS_HEADER.test(l));
    const stepsHeaderIndex = bodySource.findIndex(
        (l, i) => STEPS_HEADER.test(l) && (ingredientsHeaderIndex < 0 || i > ingredientsHeaderIndex)
    );

    let ingredientLines = [];
    let stepLines = [];

    if (ingredientsHeaderIndex >= 0 && stepsHeaderIndex >= 0) {
        ingredientLines = bodySource.slice(ingredientsHeaderIndex + 1, stepsHeaderIndex);
        stepLines = bodySource.slice(stepsHeaderIndex + 1);
    } else if (ingredientsHeaderIndex >= 0) {
        ({ ingredientLines, stepLines } = splitByQuantity(bodySource.slice(ingredientsHeaderIndex + 1)));
    } else if (stepsHeaderIndex >= 0) {
        const candidates = [...bodySource.slice(0, stepsHeaderIndex), ...bodySource.slice(stepsHeaderIndex + 1)];
        ({ ingredientLines, stepLines } = splitByQuantity(candidates));
    } else {
        ({ ingredientLines, stepLines } = splitByQuantity(bodySource));
    }

    const disguisedSteps = ingredientLines.filter(isNumberedStepDisguisedAsQuantity);
    if (disguisedSteps.length > 0) {
        ingredientLines = ingredientLines.filter((l) => !disguisedSteps.includes(l));
        stepLines = [...disguisedSteps, ...stepLines];
    }

    return {
        title,
        servings,
        ingredients: ingredientLines.map(parseIngredientLine).filter((i) => i.name),
        steps: groupStepLines(stepLines),
    };
}

export async function recognizeTextFromImage(imageUri) {
    const result = await TextRecognition.recognize(imageUri);
    return result.text;
}
