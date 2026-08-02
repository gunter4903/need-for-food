<#
.SYNOPSIS
    Genere un APK Android release signe pour Need for Food, en local (sans compte EAS/Expo).

.DESCRIPTION
    Voir need-for-food-mobile/BUILD.md pour la procedure complete et le contexte des choix
    ci-dessous. Resume des etapes :
      1. Copie le projet vers un chemin COURT (C:\nff-build\...) : le build natif Android
         (CMake/NDK/lld) echoue sur le chemin reel de ce depot, trop profond/trop long pour les
         outils Win32 (limite ~250-260 caracteres par chemin de fichier objet).
      2. Nettoie le cache Metro (TEMP Windows) - sinon un changement de .env (URL de backend) peut
         etre ignore silencieusement par un rebuild, voir le commentaire de l'etape correspondante.
      3. `expo prebuild` regenere le dossier android/ (jamais commite, voir .gitignore) a partir
         de app.json.
      4. Reinjecte la config de signature release (keystore.properties + app/build.gradle patche)
         depuis need-for-food-mobile/keystore/ (jamais commite) et
         need-for-food-mobile/android-release-config/ (commite, sans secret).
      5. Lance `gradlew assembleRelease` avec le JDK embarque dans Android Studio.
      6. Copie l'APK signe dans need-for-food-mobile/build-output/.
      7. Publie l'APK et sa date de version sur needforfood.fr (VPS, via scp/SSH par cle) - peut
         etre desactive avec -SkipPublish.

    Note : les outils npx/npm ecrivent parfois des avertissements benins sur stderr, que
    PowerShell peut afficher en rouge sans que la commande ait reellement echoue - c'est pour
    cela que ce script verifie explicitement $LASTEXITCODE apres chaque commande native plutot
    que de s'arreter au premier flux stderr.

.PARAMETER CleanInstall
    `npm install` s'execute a chaque build (rapide et sans effet si rien n'a change). Ce switch
    supprime en plus le node_modules du workspace de build avant, pour une reinstallation
    totalement propre (utile en cas de doute sur l'etat du workspace, pas necessaire pour un
    ajout de dependance normal).

.PARAMETER SkipPublish
    N'envoie pas l'APK sur needforfood.fr a la fin du build (utile pour un build de test local,
    ou si le VPS est injoignable). Par defaut, la publication est automatique.

.EXAMPLE
    .\scripts\build-release-apk.ps1
    .\scripts\build-release-apk.ps1 -CleanInstall
    .\scripts\build-release-apk.ps1 -SkipPublish
#>
param(
    [switch]$CleanInstall,
    [switch]$SkipPublish
)

$MobileRepo = Split-Path -Parent $PSScriptRoot
$BuildWorkspace = "C:\nff-build\need-for-food-mobile"
$KeystoreDir = Join-Path $MobileRepo "keystore"
$KeystoreFile = Join-Path $KeystoreDir "needforfood-release.jks"
$PasswordFile = Join-Path $KeystoreDir "PASSWORD_DO_NOT_COMMIT.txt"

function Fail($message) {
    Write-Host $message -ForegroundColor Red
    exit 1
}

Write-Host "=== 1/8 : lecture de la version depuis app.json ===" -ForegroundColor Cyan
$appJson = Get-Content (Join-Path $MobileRepo "app.json") -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
$versionName = $appJson.expo.version
$versionCode = $appJson.expo.android.versionCode
if (-not $versionName -or -not $versionCode) {
    Fail "app.json doit definir expo.version et expo.android.versionCode."
}
Write-Host "Version : $versionName (versionCode $versionCode)"

if (-not (Test-Path $KeystoreFile)) {
    Fail "Keystore introuvable : $KeystoreFile. Voir need-for-food-mobile/keystore/README.md - ce fichier ne doit JAMAIS etre regenere a la legere (perte de la capacite a publier des mises a jour)."
}
if (-not (Test-Path $PasswordFile)) {
    Fail "Mot de passe du keystore introuvable : $PasswordFile"
}

Write-Host ""
Write-Host "=== 2/8 : synchronisation vers un chemin court ($BuildWorkspace) ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $BuildWorkspace) | Out-Null
robocopy $MobileRepo $BuildWorkspace /MIR `
    /XD ".git" "android" ".expo" "dist" "build-output" "keystore" "node_modules" `
    /NFL /NDL /NJH /NJS /NP /R:1 /W:1 | Out-Null
if ($LASTEXITCODE -ge 8) {
    Fail "robocopy a echoue (code $LASTEXITCODE)."
}

Write-Host "Installation des dependances (npm install) dans la copie de travail..."
if ($CleanInstall) {
    Remove-Item -Recurse -Force (Join-Path $BuildWorkspace "node_modules") -ErrorAction SilentlyContinue
}
Push-Location $BuildWorkspace
npm install
$npmExitCode = $LASTEXITCODE
Pop-Location
if ($npmExitCode -ne 0) {
    Fail "npm install a echoue (code $npmExitCode)."
}

Write-Host ""
Write-Host "=== 3/8 : nettoyage du cache Metro (TEMP) ===" -ForegroundColor Cyan
# Metro persiste son cache de bundles transformes dans le dossier TEMP de Windows, en dehors du
# projet - le robocopy /MIR ci-dessus ne le touche jamais. Un changement dans .env (ex:
# EXPO_PUBLIC_API_URL) ne fait pas partie de la cle de cache par defaut : sans ce nettoyage, un
# nouveau build peut reutiliser un bundle deja transforme avec l'ancienne valeur, produisant un
# APK qui semble a jour (nouvelle version, nouveau code) mais qui contacte encore l'ancien
# serveur. Bug reel rencontre en pratique (v1.0.4 avait garde l'URL de dev apres un changement de
# .env vers l'URL de production).
Remove-Item -Recurse -Force "$env:TEMP\metro-cache" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:TEMP\metro-file-map-*" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:TEMP\haste-map-*" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== 4/8 : expo prebuild --platform android ===" -ForegroundColor Cyan
Push-Location $BuildWorkspace
npx expo prebuild --platform android
$prebuildExitCode = $LASTEXITCODE
Pop-Location
if ($prebuildExitCode -ne 0) {
    Fail "expo prebuild a echoue (code $prebuildExitCode)."
}

Write-Host ""
Write-Host "=== 5/8 : reinjection de la configuration de signature release ===" -ForegroundColor Cyan
$keystorePathForward = $KeystoreFile -replace '\\', '/'
$password = (Get-Content $PasswordFile -Raw -ErrorAction Stop).Trim()
$keystorePropsLines = @(
    "storeFile=$keystorePathForward",
    "storePassword=$password",
    "keyAlias=needforfood-release",
    "keyPassword=$password"
)
$keystorePropsLines -join "`n" | Out-File -FilePath (Join-Path $BuildWorkspace "android\keystore.properties") -Encoding ascii -NoNewline

$template = Get-Content (Join-Path $MobileRepo "android-release-config\app.build.gradle.template") -Raw -ErrorAction Stop
$template = $template.Replace("__VERSION_CODE__", $versionCode).Replace("__VERSION_NAME__", $versionName)
Set-Content -Path (Join-Path $BuildWorkspace "android\app\build.gradle") -Value $template -Encoding ascii -NoNewline

Write-Host ""
Write-Host "=== 6/8 : gradlew assembleRelease ===" -ForegroundColor Cyan
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;" + $env:Path
if (-not (Test-Path $env:JAVA_HOME)) {
    Fail "JDK introuvable a $env:JAVA_HOME (Android Studio requis pour ce JDK 21 compatible Gradle)."
}
if (-not (Test-Path $env:ANDROID_HOME)) {
    Fail "Android SDK introuvable a $env:ANDROID_HOME."
}

Push-Location (Join-Path $BuildWorkspace "android")
& .\gradlew.bat assembleRelease --console=plain
$gradleExitCode = $LASTEXITCODE
Pop-Location
if ($gradleExitCode -ne 0) {
    Fail "gradlew assembleRelease a echoue (code $gradleExitCode). Voir la sortie ci-dessus."
}

Write-Host ""
Write-Host "=== 7/8 : copie de l'APK signe ===" -ForegroundColor Cyan
$builtApk = Join-Path $BuildWorkspace "android\app\build\outputs\apk\release\app-release.apk"
$outputDir = Join-Path $MobileRepo "build-output"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
$finalApk = Join-Path $outputDir "need-for-food-v$versionName.apk"
Copy-Item $builtApk $finalApk -Force -ErrorAction Stop

Write-Host ""
Write-Host "APK genere : $finalApk" -ForegroundColor Green
Get-Item $finalApk | Select-Object Name, Length, LastWriteTime

Write-Host ""
Write-Host "=== 8/8 : publication sur needforfood.fr ===" -ForegroundColor Cyan
if ($SkipPublish) {
    Write-Host "Ignoree (-SkipPublish)." -ForegroundColor Yellow
} else {
    $VpsHost = "ubuntu@193.70.40.165"
    $VpsDownloadsDir = "~/need-for-food/need-for-food-website/downloads"
    $versionJsonPath = Join-Path $outputDir "version.json"
    $releaseDate = (Get-Date).ToString("yyyy-MM-dd")
    # -Encoding utf8 ajoute toujours un BOM sous Windows PowerShell : Android/React Native ne le
    # tolere pas dans JSON.parse (echec silencieux, avale par le try/catch de updateCheck.js), ce
    # qui rendait le bandeau de mise a jour invisible en permanence, meme quand une version plus
    # recente etait disponible. Le contenu est du pur ASCII, donc -Encoding ascii evite le BOM.
    "{`"version`":`"$versionName`",`"date`":`"$releaseDate`"}" |
        Out-File -FilePath $versionJsonPath -Encoding ascii -NoNewline

    scp $finalApk "${VpsHost}:${VpsDownloadsDir}/need-for-food-latest.apk"
    $scpApkExit = $LASTEXITCODE
    scp $versionJsonPath "${VpsHost}:${VpsDownloadsDir}/version.json"
    $scpJsonExit = $LASTEXITCODE

    if ($scpApkExit -ne 0 -or $scpJsonExit -ne 0) {
        Write-Host "Avertissement : l'envoi vers le VPS a echoue (code apk=$scpApkExit, version.json=$scpJsonExit)." -ForegroundColor Yellow
        Write-Host "L'APK reste disponible localement dans build-output/, mais needforfood.fr n'a pas ete mis a jour - relancer avec .\scripts\build-release-apk.ps1 -SkipPublish puis publier manuellement, ou corriger l'acces SSH et relancer ce script." -ForegroundColor Yellow
    } else {
        Write-Host "Publie sur https://needforfood.fr (APK + version $versionName du $releaseDate)." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Rappel : la cle de signature ($KeystoreFile) doit etre sauvegardee ailleurs que sur cette machine (voir keystore/README.md)." -ForegroundColor Yellow
