import * as Print from 'expo-print';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function buildRecipeHtml(recipe) {
    const heroImage = recipe.images?.[0]?.url;
    const metaParts = [
        recipe.preparationTime != null ? `${recipe.preparationTime} min` : null,
        recipe.servings != null ? `${recipe.servings} personnes` : null,
        recipe.difficulty,
        recipe.type,
        recipe.diet,
    ].filter(Boolean);

    const ingredientsHtml = (recipe.ingredients || [])
        .map((i) => `<li>${escapeHtml(i.quantity)}${escapeHtml(i.unit)} de ${escapeHtml(i.name)}</li>`)
        .join('');

    const stepsHtml = (recipe.steps || [])
        .map((step, index) => `<li><span class="step-number">${index + 1}</span>${escapeHtml(step)}</li>`)
        .join('');

    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #2E1D12;
                padding: 24px;
            }
            h1 {
                color: #B85C00;
                font-size: 26px;
                margin-bottom: 4px;
            }
            .meta {
                color: #7A6A5C;
                font-size: 13px;
                margin-bottom: 16px;
            }
            .hero {
                width: 100%;
                max-height: 260px;
                object-fit: cover;
                border-radius: 12px;
                margin-bottom: 16px;
            }
            h2 {
                color: #2E1D12;
                font-size: 18px;
                border-bottom: 2px solid #E67E22;
                padding-bottom: 4px;
                margin-top: 28px;
            }
            ul, ol {
                padding-left: 0;
                list-style: none;
            }
            li {
                padding: 6px 0;
                border-bottom: 1px solid #EFDFC9;
                font-size: 14px;
            }
            .step-number {
                display: inline-block;
                width: 22px;
                height: 22px;
                line-height: 22px;
                text-align: center;
                background: #E67E22;
                color: #FFFFFF;
                border-radius: 11px;
                font-size: 12px;
                font-weight: 700;
                margin-right: 10px;
            }
        </style>
        </head>
        <body>
            <h1>${escapeHtml(recipe.title)}</h1>
            <div class="meta">${escapeHtml(metaParts.join(' · '))}</div>
            ${heroImage ? `<img class="hero" src="${escapeHtml(heroImage)}">` : ''}

            <h2>Ingrédients</h2>
            <ul>${ingredientsHtml}</ul>

            <h2>Étapes de préparation</h2>
            <ol>${stepsHtml}</ol>
        </body>
        </html>
    `;
}

export async function printRecipe(recipe) {
    const html = buildRecipeHtml(recipe);
    await Print.printAsync({ html });
}
