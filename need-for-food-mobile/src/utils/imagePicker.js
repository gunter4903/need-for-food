import * as FileSystem from 'expo-file-system/legacy';

// Sur Android, l'URI renvoyée par le sélecteur système (content://...) peut devenir
// illisible au moment où fetch() essaie réellement d'envoyer le fichier (autorisation
// temporaire expirée), ce qui fait échouer l'upload avec une erreur réseau générique.
// On copie donc chaque photo choisie dans le cache de l'app dès la sélection : l'URI
// utilisée ensuite (aperçu + upload) est un fichier que l'app possède complètement.
export async function copyPickedAssetsToCache(assets) {
    return Promise.all(
        assets.map(async (asset) => {
            const extension = (asset.fileName || asset.uri || '').split('.').pop() || 'jpg';
            const destination = `${FileSystem.cacheDirectory}recipe-photo-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}.${extension}`;

            await FileSystem.copyAsync({ from: asset.uri, to: destination });

            return {
                uri: destination,
                fileName: asset.fileName,
                mimeType: asset.mimeType,
            };
        })
    );
}
