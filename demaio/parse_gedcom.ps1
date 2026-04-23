# PowerShell GEDCOM Parser for De Maio Genealogy
# Generates persone_genealogia.json with all 234 people and their relationships

$gedcomPath = "C:\Users\Luca\Desktop\luca\albero genealogico\albero luca de maio 7 giugno 2023.ged"
$outputPath = "C:\Users\Luca\Desktop\luca\albero genealogico\persone_genealogia.json"

# Read GEDCOM
$lines = Get-Content $gedcomPath
$individuals = @{}
$families = @{}

$currentId = $null
$currentType = $null

foreach ($line in $lines) {
    if ($line -match "^0 @(.+?)@ INDI") {
        $currentId = $matches[1]
        $currentType = "INDI"
        $individuals[$currentId] = @{
            id = $currentId
            name = ""
            sex = ""
            birth = ""
            death = ""
            famc = ""
            fams = @()
            age = ""
            relationship = ""
        }
    }
    elseif ($line -match "^0 @(.+?)@ FAM") {
        $currentId = $matches[1]
        $currentType = "FAM"
        $families[$currentId] = @{
            id = $currentId
            husband = ""
            wife = ""
            children = @()
            marriage = ""
        }
    }
    elseif ($currentType -eq "INDI") {
        if ($line -match "^1 NAME (.+)$") {
            $individuals[$currentId].name = $matches[1] -replace "/", ""
        }
        elseif ($line -match "^1 SEX (.+)$") {
            $individuals[$currentId].sex = $matches[1]
        }
        elseif ($line -match "^1 FAMC (.+)$") {
            $individuals[$currentId].famc = $matches[1]
        }
        elseif ($line -match "^1 FAMS (.+)$") {
            $individuals[$currentId].fams += @($matches[1])
        }
        elseif ($line -match "^2 DATE (.+)$") {
            $date = $matches[1]
            # Controlla se è una nascita o morte basandosi sulla linea precedente nel contesto
            if($individuals[$currentId].birth -eq "" -and $individuals[$currentId].death -eq "") {
                $individuals[$currentId].birth = $date
            }
            elseif($individuals[$currentId].death -eq "") {
                $individuals[$currentId].death = $date
            }
        }
    }
    elseif ($currentType -eq "FAM") {
        if ($line -match "^1 HUSB (.+)$") {
            $families[$currentId].husband = $matches[1]
        }
        elseif ($line -match "^1 WIFE (.+)$") {
            $families[$currentId].wife = $matches[1]
        }
        elseif ($line -match "^1 CHIL (.+)$") {
            $families[$currentId].children += @($matches[1])
        }
    }
}

# Calcola i gradi di parentela
$rootId = "@I112211670070@"  # Luca De Maio

function Get-Relationship {
    param(
        [string]$personId,
        [string]$rootId,
        [hashtable]$individuals,
        [hashtable]$families
    )
    
    if ($personId -eq $rootId) { return "Tu" }
    
    # Semplificato: usa la vicinanza
    $person = $individuals[$personId]
    $root = $individuals[$rootId]
    
    # Genitori di root
    if ($root.famc -and $families[$root.famc]) {
        if ($personId -eq $families[$root.famc].husband -or $personId -eq $families[$root.famc].wife) {
            return "Genitore"
        }
    }
    
    # Figli di root
    foreach ($famId in $root.fams) {
        if ($families[$famId] -and $families[$famId].children -contains $personId) {
            return "Figlio/a"
        }
    }
    
    # Nonni
    if ($root.famc -and $families[$root.famc]) {
        $parentId = $families[$root.famc].husband
        if ($parentId -and $individuals[$parentId].famc -and $families[$individuals[$parentId].famc]) {
            if ($personId -eq $families[$individuals[$parentId].famc].husband -or $personId -eq $families[$individuals[$parentId].famc].wife) {
                return "Nonno/Nonna"
            }
        }
    }
    
    # Fratelli
    if ($root.famc -and $families[$root.famc]) {
        if ($families[$root.famc].children -contains $personId) {
            return "Fratello/Sorella"
        }
    }
    
    # Zii
    if ($root.famc -and $families[$root.famc]) {
        $parentId = $families[$root.famc].husband
        if ($parentId -and $individuals[$parentId].famc -and $families[$individuals[$parentId].famc]) {
            if ($families[$individuals[$parentId].famc].children -contains $personId) {
                return "Zio/Zia"
            }
        }
    }
    
    return "Parente"
}

# Calcola l'età
function Get-Age {
    param([string]$birth, [string]$death)
    
    if ($birth -match "(\d{4})") {
        $birthYear = [int]$matches[1]
        if ($death -match "(\d{4})") {
            $deathYear = [int]$matches[1]
            return "$($deathYear - $birthYear) anni (†$deathYear)"
        } else {
            $age = 2026 - $birthYear
            return "$age anni"
        }
    }
    return ""
}

# Crea array di persone con relazioni
$people = @()
foreach ($id in $individuals.Keys) {
    $ind = $individuals[$id]
    if ($ind.name) {  # Solo se ha un nome
        $people += @{
            id = $id
            name = $ind.name
            sex = $ind.sex
            birth = $ind.birth
            death = $ind.death
            age = Get-Age $ind.birth $ind.death
            relationship = Get-Relationship $id $rootId $individuals $families
        }
    }
}

# Ordina per relazione
$relationshipOrder = @{
    "Tu" = 0
    "Genitore" = 1
    "Fratello/Sorella" = 2
    "Figlio/a" = 3
    "Nonno/Nonna" = 4
    "Nipote" = 5
    "Zio/Zia" = 6
    "Cugino/a" = 7
    "Parente" = 8
}

$people = $people | Sort-Object {
    $order = $relationshipOrder[$_.relationship]
    if ($null -eq $order) { $order = 999 }
    return @($order, $_.name)
}

# Creazione JSON
$output = @{
    generated = [datetime]::Now.ToString("yyyy-MM-dd HH:mm:ss")
    total_individuals = $individuals.Count
    total_families = $families.Count
    total_people_with_names = $people.Count
    people = $people
} | ConvertTo-Json -Depth 10

# Scrivi file
$output | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host "[OK] JSON creato: $outputPath"
Write-Host "[INFO] Totale persone: $($people.Count)"
Write-Host "[INFO] Famiglie: $($families.Count)"
Write-Host ""
Write-Host "Persone per relazione:"
$people | Group-Object -Property relationship | ForEach-Object {
    Write-Host "   $($_.Name): $($_.Count)"
}
