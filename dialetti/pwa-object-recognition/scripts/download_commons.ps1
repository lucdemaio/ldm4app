# Downloads selected Wikimedia Commons files and writes metadata
$items = @(
    @{ dialect='siciliano'; name='LL-Q33973_(scn)-XANA000-a_cavaddu_datu_nun_si_guarda_in_bucca.wav'; page='https://commons.wikimedia.org/wiki/File:LL-Q33973_(scn)-XANA000-a_cavaddu_datu_nun_si_guarda_in_bucca.wav'; url='https://upload.wikimedia.org/wikipedia/commons/6/65/LL-Q33973_%28scn%29-XANA000-a_cavaddu_datu_nun_si_guarda_in_bucca.wav'; license='CC0 1.0'; license_url='https://creativecommons.org/publicdomain/zero/1.0/'; author='Àncilu'}
    @{ dialect='siciliano'; name='LL-Q33973_(scn)-XANA000-sicilianu_anticu.wav'; page='https://commons.wikimedia.org/wiki/File:LL-Q33973_(scn)-XANA000-sicilianu_anticu.wav'; url='https://upload.wikimedia.org/wikipedia/commons/2/21/LL-Q33973_%28scn%29-XANA000-sicilianu_anticu.wav'; license='CC0 1.0'; license_url='https://creativecommons.org/publicdomain/zero/1.0/'; author='Àncilu'}
    @{ dialect='siciliano'; name='LL-Q33973_(scn)-XANA000-a_babbala.wav'; page='https://commons.wikimedia.org/wiki/File:LL-Q33973_(scn)-XANA000-a_babbal%C3%A0.wav'; url='https://upload.wikimedia.org/wikipedia/commons/f/f2/LL-Q33973_%28scn%29-XANA000-a_babbal%C3%A0.wav'; license='CC0 1.0'; license_url='https://creativecommons.org/publicdomain/zero/1.0/'; author='Àncilu'}

    @{ dialect='napoletano'; name='LL-Q36163_(nap)-Key_Mirza-a_staggione.wav'; page='https://commons.wikimedia.org/wiki/File:LL-Q36163_(nap)-Key_M%C3%AErza-%27a_staggione.wav'; url='https://upload.wikimedia.org/wikipedia/commons/6/60/LL-Q36163_%28nap%29-Key_M%C3%AErza-%27a_staggione.wav'; license='CC-BY-SA 4.0'; license_url='https://creativecommons.org/licenses/by-sa/4.0/'; author='Key Mîrza'}

    @{ dialect='romanesco'; name='Giuseppe_Gioachino_Belli_Er_caffettiere_fisolofo.ogg'; page='https://commons.wikimedia.org/wiki/File:Giuseppe_Gioachino_Belli,_Er_caffettiere_fisolofo.ogg'; url='https://upload.wikimedia.org/wikipedia/commons/c/c7/Giuseppe_Gioachino_Belli%2C_Er_caffettiere_fisolofo.ogg'; license='Public Domain'; license_url='https://commons.wikimedia.org/wiki/Public_domain'; author='Nightbit'}
    @{ dialect='romanesco'; name='Nl-romanesco.ogg'; page='https://commons.wikimedia.org/wiki/File:Nl-romanesco.ogg'; url='https://upload.wikimedia.org/wikipedia/commons/7/7c/Nl-romanesco.ogg'; license='CC-BY-SA 3.0'; license_url='https://creativecommons.org/licenses/by-sa/3.0/'; author='Marcel coenders'}
    @{ dialect='romanesco'; name='LL-Q150_(fra)-Helenou66-chou_romanesco.wav'; page='https://commons.wikimedia.org/wiki/File:LL-Q150_(fra)-Helenou66-chou_romanesco.wav'; url='https://upload.wikimedia.org/wikipedia/commons/b/b3/LL-Q150_%28fra%29-Helenou66-chou_romanesco.wav'; license='CC0 1.0'; license_url='https://creativecommons.org/publicdomain/zero/1.0/'; author='Helenou66'}

    @{ dialect='veneto'; name='Es-Veneto-article.ogg'; page='https://commons.wikimedia.org/wiki/File:Es-V%C3%A9neto-article.ogg'; url='https://upload.wikimedia.org/wikipedia/commons/a/ac/Es-V%C3%A9neto-article.ogg'; license='CC-BY-SA 4.0'; license_url='https://creativecommons.org/licenses/by-sa/4.0/'; author='Klausghm'}
    @{ dialect='veneto'; name='Nl-Veneto.ogg'; page='https://commons.wikimedia.org/wiki/File:Nl-Veneto.ogg'; url='https://upload.wikimedia.org/wikipedia/commons/8/84/Nl-Veneto.ogg'; license='CC0 1.0'; license_url='https://creativecommons.org/publicdomain/zero/1.0/'; author='Marcel coenders'}
    @{ dialect='veneto'; name='LL-Q1860_(eng)-Vealhurl-Veneto.wav'; page='https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Vealhurl-Veneto.wav'; url='https://upload.wikimedia.org/wikipedia/commons/3/33/LL-Q1860_%28eng%29-Vealhurl-Veneto.wav'; license='CC-BY-SA 4.0'; license_url='https://creativecommons.org/licenses/by-sa/4.0/'; author='Vealhurl'}

    @{ dialect='milanese'; name='Milanese.ogg'; page='https://commons.wikimedia.org/wiki/File:Milanese.ogg'; url='https://upload.wikimedia.org/wikipedia/commons/4/42/Milanese.ogg'; license='CC-BY-SA 3.0'; license_url='https://creativecommons.org/licenses/by-sa/3.0/'; author='LjL'}
    @{ dialect='milanese'; name='LL-Q7026_(cat)-Millars-milaneses.wav'; page='https://commons.wikimedia.org/wiki/File:LL-Q7026_(cat)-Millars-milaneses.wav'; url='https://upload.wikimedia.org/wikipedia/commons/4/41/LL-Q7026_%28cat%29-Millars-milaneses.wav'; license='CC-BY-SA 4.0'; license_url='https://creativecommons.org/licenses/by-sa/4.0/'; author='Millars'}
    @{ dialect='milanese'; name='40Al_Milanese_CastellArquato.ogg'; page='https://commons.wikimedia.org/wiki/File:40Al_Milanese_Castell%27Arquato.ogg'; url='https://upload.wikimedia.org/wikipedia/commons/c/c5/40Al_Milanese_Castell%27Arquato.ogg'; license='CC-BY-SA 3.0'; license_url='https://creativecommons.org/licenses/by-sa/3.0/'; author='Metzner'}

    @{ dialect='bergamasco'; name='LL-Q809_(pol)-Jest_Spoczko-bergamasco.wav'; page='https://commons.wikimedia.org/wiki/File:LL-Q809_(pol)-Jest_Spoczko-bergamasco.wav'; url='https://upload.wikimedia.org/wikipedia/commons/e/e4/LL-Q809_%28pol%29-Jest_Spoczko-bergamasco.wav'; license='CC-BY-SA 4.0'; license_url='https://creativecommons.org/licenses/by-sa/4.0/'; author='Jest Spoczko'}
)

$base = Join-Path -Path (Get-Location) -ChildPath 'audio\human-recordings'
if (-not (Test-Path $base)) { New-Item -Path $base -ItemType Directory | Out-Null }

$metadataAll = @{}

# find local ffmpeg
$possible = @(
    "$(Join-Path $PSScriptRoot '..\tools\ffmpeg\bin\ffmpeg.exe')",
    "$(Join-Path $PSScriptRoot '..\tools\ffmpeg-8.0.1-essentials_build\bin\ffmpeg.exe')",
    "$(Join-Path $PSScriptRoot '..\tools\bin\ffmpeg.exe')"
)
$ffmpegPath = $null
foreach ($p in $possible) { if (Test-Path $p) { $ffmpegPath = $p; break } }
if (-not $ffmpegPath) { Write-Warning "ffmpeg non trovato in tools; assicurati che ffmpeg sia nel PATH o aggiungilo a tools/" }

foreach ($it in $items) {
    $d = $it.dialect
    $dir = Join-Path $base $d
    if (-not (Test-Path $dir)) { New-Item -Path $dir -ItemType Directory | Out-Null }
    $fname = $it.name
    # normalize filename safe
    $safeName = $fname -replace '[^A-Za-z0-9._-]', '_'
    $out = Join-Path $dir $safeName
    Write-Host "Processing $($it.url) -> $out"
    # download with retries (handle 429)
    $attempt = 0
    while ($attempt -lt 3 -and -not (Test-Path $out)) {
        $attempt++
        try {
            Invoke-WebRequest -Uri $it.url -OutFile $out -UseBasicParsing -ErrorAction Stop
            break
        } catch {
            Write-Warning ([string]::Format('Attempt {0}: Failed to download: {1}', $attempt, $_.Exception.Message))
            if ($_.Exception.Response -and $_.Exception.Response.StatusCode.Value__ -eq 429) {
                Start-Sleep -Seconds (5 * $attempt)
                continue
            } else {
                break
            }
        }
    }

    if (-not (Test-Path $out)) {
        Write-Warning "Skipping $($it.url) because it could not be downloaded."
        continue
    }

    # probe duration with ffmpeg if available
    $duration = $null
    if ($ffmpegPath) {
        $ffprobeOut = & $ffmpegPath -i $out 2>&1 | Select-String 'Duration'
        if ($ffprobeOut -and $ffprobeOut -match 'Duration: ([0-9:.]+)') { $duration = $matches[1] }
    }
    # create mp3 version if ffmpeg available
    $mp3Out = [System.IO.Path]::ChangeExtension($out, '.mp3')
    if ($ffmpegPath) {
        Write-Host "Converting to MP3 -> $mp3Out"
        & $ffmpegPath -y -loglevel error -i $out -ar 16000 -ac 1 -b:a 128k $mp3Out
    } else {
        Write-Warning "ffmpeg non disponibile: saltata la conversione per $out"
    }

    $meta = [ordered]@{
        "filename" = [System.IO.Path]::GetFileName($out)
        "mp3" = if (Test-Path $mp3Out) { [System.IO.Path]::GetFileName($mp3Out) } else { $null }
        "file_page" = $it.page
        "download_url" = $it.url
        "license" = $it.license
        "license_url" = $it.license_url
        "author" = $it.author
        "duration" = $duration
    }
    $metaPath = Join-Path $dir 'metadata.json'
    if (-not $metadataAll.ContainsKey($d)) { $metadataAll[$d] = @() }
    $metadataAll[$d] += $meta
    # write per-dialect metadata immediately
    $metadataAll[$d] | ConvertTo-Json -Depth 5 | Out-File -FilePath $metaPath -Encoding UTF8
}

# write top-level manifest
$manifest = @{}
foreach ($k in $metadataAll.Keys) {
    $contentPath = "$base\$k\metadata.json"
    if (Test-Path $contentPath) { $manifest[$k] = @(Get-Content -Path $contentPath -Raw | ConvertFrom-Json) }
}
$manifestPath = Join-Path $base 'metadata_manifest.json'
$manifest | ConvertTo-Json -Depth 6 | Out-File -FilePath $manifestPath -Encoding UTF8
Write-Host "Done. Metadata written to $manifestPath"