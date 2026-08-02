import * as Print from 'expo-print';
import { escapeHtml } from './html';

export function buildShoppingListHtml(list) {
    const items = list.items || [];
    const checkedCount = items.filter((item) => item.checked).length;

    const itemsHtml = items
        .map(
            (item) => `
                <li class="${item.checked ? 'checked' : ''}">
                    <span class="box">${item.checked ? '☑' : '☐'}</span>
                    ${escapeHtml(item.quantity)}${escapeHtml(item.unit)} ${escapeHtml(item.name)}
                </li>`
        )
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
                margin-bottom: 20px;
            }
            ul {
                padding-left: 0;
                list-style: none;
            }
            li {
                display: flex;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #EFDFC9;
                font-size: 15px;
            }
            li.checked {
                color: #7A6A5C;
                text-decoration: line-through;
            }
            .box {
                display: inline-block;
                width: 24px;
                font-size: 18px;
                color: #E67E22;
            }
        </style>
        </head>
        <body>
            <h1>${escapeHtml(list.name)}</h1>
            <div class="meta">${checkedCount} / ${items.length} articles cochés</div>
            <ul>${itemsHtml}</ul>
        </body>
        </html>
    `;
}

export async function printShoppingList(list) {
    const html = buildShoppingListHtml(list);
    await Print.printAsync({ html });
}
