$startDate = Get-Date "2026-01-10"
$endDate = Get-Date "2026-04-09"

$dates = @()
$current = $startDate

# Random gaps (natural work pattern)
while ($current -le $endDate) {
    $dates += $current
    $current = $current.AddDays((Get-Random -Minimum 1 -Maximum 3))
}

# Only 50 commits
$dates = $dates | Select-Object -First 50

$folders = @("api","controllers","models","routes","services","middleware")

$messages = @(
"feat: add authentication API",
"fix: resolve login issue",
"feat: create user model",
"refactor: improve structure",
"feat: add CRUD operations",
"fix: handle API error",
"feat: add middleware",
"update: optimize backend",
"fix: database bug",
"feat: add validation",
"refactor: clean code",
"feat: implement routes"
)

$i = 0
foreach ($date in $dates) {

    $folder = $folders | Get-Random
    $path = "backend/$folder"

    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force
    }

    $file = "$path/file$i.js"

@"
export const func$i = () => {
    return "Backend update in $folder";
};
"@ | Out-File $file

    git add .

    # Random evening time
    $hour = Get-Random -Minimum 18 -Maximum 23
    $minute = Get-Random -Minimum 0 -Maximum 59

$timeString = "{0}:{1}:00" -f $hour, $minute
$commitDate = $date.ToString("yyyy-MM-dd") + " $timeString"

    $env:GIT_AUTHOR_DATE = $commitDate
    $env:GIT_COMMITTER_DATE = $commitDate

    $msg = $messages | Get-Random

    git commit -m "$msg"

    $i++
}

Write-Host "✅ 50 backend commits created!"