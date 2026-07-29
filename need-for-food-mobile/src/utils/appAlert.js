// Petit registre imperatif (pas de contexte/hook) pour pouvoir appeler showAlert(...) depuis
// n'importe quelle fonction (handler d'événement, catch, etc.) exactement comme Alert.alert de
// React Native — seul <AppAlert /> (monté une fois à la racine, voir App.js) s'abonne pour
// afficher la modale correspondante.
let listener = null;

export function registerAlertListener(fn) {
    listener = fn;
}

// Même signature que Alert.alert(title, message, buttons) pour un remplacement à l'identique
// des appels existants — seul l'import change.
export function showAlert(title, message, buttons) {
    if (listener) {
        listener({ title, message, buttons });
    }
}
