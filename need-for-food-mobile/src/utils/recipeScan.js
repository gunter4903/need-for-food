import TextRecognition from '@react-native-ml-kit/text-recognition';

const INGREDIENTS_HEADER = /^ingr[ée]dients?\b/i;
const STEPS_HEADER = /^(pr[ée]paration|instructions?|[ée]tapes?( de (la )?pr[ée]paration)?|marche\s*à\s*suivre)\b/i;

const SERVINGS_LINE = /^(?:pour\s+)?(\d+)\s*(?:personnes?|portions?|parts?|pers\.?)\s*:?$/i;
const SERVINGS_INLINE = /(\d+)\s*(?:personnes?|portions?|parts?|pers\.?)/i;

const MIN_LINE_LENGTH = 3;

const QUANTITY_UNIT_NAME = /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*([a-zA-ZÀ-ÿ.]{1,15})\s+(?:de\s+|d')?(.+)$/;

const QUANTITY_NAME = /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s+(?:de\s+|d')?(.+)$/;

function stripListMarker(line) {
    return line.replace(/^\s*(?:[-•*]|\d+[.):])\s*/, '').trim();
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

function parseIngredientLine(line) {
    const cleaned = stripListMarker(line);

    const withUnit = cleaned.match(QUANTITY_UNIT_NAME);
    if (withUnit) {
        return { name: withUnit[3].trim(), quantity: withUnit[1].replace(',', '.'), unit: withUnit[2].trim() };
    }

    const withoutUnit = cleaned.match(QUANTITY_NAME);
    if (withoutUnit) {
        return { name: withoutUnit[2].trim(), quantity: withoutUnit[1].replace(',', '.'), unit: '' };
    }

    return { name: cleaned, quantity: '', unit: '' };
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
            : { title: '', servings, ingredients: [], steps: lines.map(stripListMarker).filter(Boolean) };
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

    if (ingredientsHeaderIndex >= 0) {
        const end = stepsHeaderIndex >= 0 ? stepsHeaderIndex : bodySource.length;
        ingredientLines = bodySource.slice(ingredientsHeaderIndex + 1, end);
    }
    if (stepsHeaderIndex >= 0) {
        stepLines = bodySource.slice(stepsHeaderIndex + 1);
    }

    if (ingredientsHeaderIndex < 0 && stepsHeaderIndex < 0) {
        ingredientLines = bodySource.filter((l) => /^\d/.test(stripListMarker(l)));
        stepLines = bodySource.filter((l) => !/^\d/.test(stripListMarker(l)));
    }

    return {
        title,
        servings,
        ingredients: ingredientLines.map(parseIngredientLine).filter((i) => i.name),
        steps: stepLines.map(stripListMarker).filter(Boolean),
    };
}

export async function recognizeTextFromImage(imageUri) {
    const result = await TextRecognition.recognize(imageUri);
    return result.text;
}
